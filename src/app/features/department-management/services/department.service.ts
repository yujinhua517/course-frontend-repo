import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, map, delay, catchError, switchMap } from 'rxjs';
import {
    Department,
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DepartmentListResponse,
    DepartmentSearchFilters,
    DepartmentLevel,
    ApiResponse,
    PagerDto
} from '../models/department.model';
import { environment } from '../../../../environments/environment';
import { UserStore } from '../../../core/auth/user.store';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    private http = inject(HttpClient);
    private userStore = inject(UserStore);
    private httpErrorHandler = inject(HttpErrorHandlerService);

    // Toggle between mock data and real API
    private readonly useMockData = false;
    private readonly apiUrl = `${environment.apiBaseUrl}/departments`;

    /**
     * Get current logged-in user's username
     */
    private getCurrentUser(): string {
        const currentUser = this.userStore.user();
        return currentUser?.username || 'system';
    }

    private mockDepartments: Department[] = [
        // BI層（最高層，通常1-3個）
        {
            deptId: 1,
            parentDeptId: null,
            deptCode: 'CORP',
            deptName: '企業發展事業群',
            deptLevel: 'BI',
            managerEmpId: 1,
            isActive: true,
            deptDesc: '負責公司整體發展與決策，涵蓋策略與規劃等。',
            createTime: '2024-01-10T08:00:00',
            createUser: 'sysadmin',
            updateTime: '2024-06-01T08:30:00',
            updateUser: 'sysadmin',
            parentDeptName: undefined,
            managerName: '林泰安'
        },
        {
            deptId: 2,
            parentDeptId: null,
            deptCode: 'TECH',
            deptName: '技術策略事業群',
            deptLevel: 'BI',
            managerEmpId: 2,
            isActive: true,
            deptDesc: '主導技術方向與產品創新策略。',
            createTime: '2024-01-12T09:00:00',
            createUser: 'sysadmin',
            updateTime: '2024-06-03T09:45:00',
            updateUser: 'sysadmin',
            parentDeptName: undefined,
            managerName: '張偉翔'
        },

        // BU 層
        {
            deptId: 3,
            parentDeptId: 1,
            deptCode: 'OPS',
            deptName: '營運管理中心',
            deptLevel: 'BU',
            managerEmpId: 3,
            isActive: true,
            deptDesc: '統籌營運資源，確保業務穩定發展。',
            createTime: '2024-02-01T10:00:00',
            createUser: 'admin1',
            updateTime: '2024-06-08T10:00:00',
            updateUser: 'admin1',
            parentDeptName: '企業發展事業群',
            managerName: '蘇怡君'
        },
        {
            deptId: 4,
            parentDeptId: 1,
            deptCode: 'SALE',
            deptName: '銷售服務中心',
            deptLevel: 'BU',
            managerEmpId: 4,
            isActive: true,
            deptDesc: '負責全公司銷售目標與客戶關係管理。',
            createTime: '2024-02-02T13:00:00',
            createUser: 'admin2',
            updateTime: '2024-06-10T13:00:00',
            updateUser: 'admin2',
            parentDeptName: '企業發展事業群',
            managerName: '高家豪'
        },
        {
            deptId: 5,
            parentDeptId: 2,
            deptCode: 'ENG',
            deptName: '工程研發中心',
            deptLevel: 'BU',
            managerEmpId: 5,
            isActive: true,
            deptDesc: '技術開發與產品維護的核心部門。',
            createTime: '2024-02-03T11:00:00',
            createUser: 'admin3',
            updateTime: '2024-06-11T11:00:00',
            updateUser: 'admin3',
            parentDeptName: '技術策略事業群',
            managerName: '許惠玲'
        },
        {
            deptId: 6,
            parentDeptId: 2,
            deptCode: 'QA',
            deptName: '品質管理中心',
            deptLevel: 'BU',
            managerEmpId: 6,
            isActive: true,
            deptDesc: '確保產品服務品質、制定品質標準。',
            createTime: '2024-02-04T15:00:00',
            createUser: 'admin4',
            updateTime: '2024-06-12T15:00:00',
            updateUser: 'admin4',
            parentDeptName: '技術策略事業群',
            managerName: '吳志軒'
        },

        // LOB 層
        {
            deptId: 7,
            parentDeptId: 3,
            deptCode: 'CUST',
            deptName: '客服組',
            deptLevel: 'LOB',
            managerEmpId: 7,
            isActive: true,
            deptDesc: '第一線客戶回應與問題處理。',
            createTime: '2024-03-01T09:00:00',
            createUser: 'ops_mgr',
            updateTime: '2024-07-01T09:30:00',
            updateUser: 'ops_mgr',
            parentDeptName: '營運管理中心',
            managerName: '鄭佳珊'
        },
        {
            deptId: 8,
            parentDeptId: 3,
            deptCode: 'PROC',
            deptName: '採購組',
            deptLevel: 'LOB',
            managerEmpId: 8,
            isActive: true,
            deptDesc: '原物料與外包服務採購。',
            createTime: '2024-03-02T10:00:00',
            createUser: 'ops_mgr',
            updateTime: '2024-07-01T10:15:00',
            updateUser: 'ops_mgr',
            parentDeptName: '營運管理中心',
            managerName: '王柏廷'
        },
        {
            deptId: 9,
            parentDeptId: 4,
            deptCode: 'DOMS',
            deptName: '國內銷售組',
            deptLevel: 'LOB',
            managerEmpId: 9,
            isActive: true,
            deptDesc: '負責國內客戶與經銷商業務。',
            createTime: '2024-03-03T11:00:00',
            createUser: 'sale_mgr',
            updateTime: '2024-07-01T11:25:00',
            updateUser: 'sale_mgr',
            parentDeptName: '銷售服務中心',
            managerName: '林家宏'
        },
        {
            deptId: 10,
            parentDeptId: 4,
            deptCode: 'INTR',
            deptName: '國際銷售組',
            deptLevel: 'LOB',
            managerEmpId: 10,
            isActive: true,
            deptDesc: '拓展海外市場，協助出口業務。',
            createTime: '2024-03-04T12:00:00',
            createUser: 'sale_mgr',
            updateTime: '2024-07-01T12:35:00',
            updateUser: 'sale_mgr',
            parentDeptName: '銷售服務中心',
            managerName: '葉欣怡'
        },
        {
            deptId: 11,
            parentDeptId: 5,
            deptCode: 'DEV',
            deptName: '後端開發組',
            deptLevel: 'LOB',
            managerEmpId: 11,
            isActive: true,
            deptDesc: '專注於後端系統設計與維護。',
            createTime: '2024-03-05T13:00:00',
            createUser: 'eng_mgr',
            updateTime: '2024-07-01T13:45:00',
            updateUser: 'eng_mgr',
            parentDeptName: '工程研發中心',
            managerName: '曾國凱'
        },
        {
            deptId: 12,
            parentDeptId: 5,
            deptCode: 'FRONT',
            deptName: '前端開發組',
            deptLevel: 'LOB',
            managerEmpId: 12,
            isActive: true,
            deptDesc: '前端UI與互動介面設計。',
            createTime: '2024-03-06T14:00:00',
            createUser: 'eng_mgr',
            updateTime: '2024-07-01T14:55:00',
            updateUser: 'eng_mgr',
            parentDeptName: '工程研發中心',
            managerName: '陳韋廷'
        },
        {
            deptId: 13,
            parentDeptId: 6,
            deptCode: 'TEST',
            deptName: '軟體測試組',
            deptLevel: 'LOB',
            managerEmpId: 13,
            isActive: true,
            deptDesc: '產品測試與自動化回歸測試。',
            createTime: '2024-03-07T15:00:00',
            createUser: 'qa_mgr',
            updateTime: '2024-07-01T15:20:00',
            updateUser: 'qa_mgr',
            parentDeptName: '品質管理中心',
            managerName: '賴信瑋'
        },
        {
            deptId: 14,
            parentDeptId: 6,
            deptCode: 'CTRL',
            deptName: '品管稽核組',
            deptLevel: 'LOB',
            managerEmpId: 14,
            isActive: true,
            deptDesc: '協助品質稽核與標準作業稽查。',
            createTime: '2024-03-08T16:00:00',
            createUser: 'qa_mgr',
            updateTime: '2024-07-01T16:40:00',
            updateUser: 'qa_mgr',
            parentDeptName: '品質管理中心',
            managerName: '簡雅婷'
        },
        {
            deptId: 15,
            parentDeptId: 3,
            deptCode: 'RISK',
            deptName: '風險控管組',
            deptLevel: 'LOB',
            managerEmpId: 15,
            isActive: false,
            deptDesc: '內部稽核、企業風險評估與控管。',
            createTime: '2024-03-09T17:00:00',
            createUser: 'ops_mgr',
            updateTime: '2024-07-02T17:10:00',
            updateUser: 'ops_mgr',
            parentDeptName: '營運管理中心',
            managerName: '許榮華'
        },
        {
            deptId: 16,
            parentDeptId: 4,
            deptCode: 'MARK',
            deptName: '行銷推廣組',
            deptLevel: 'LOB',
            managerEmpId: 16,
            isActive: true,
            deptDesc: '產品推廣、品牌行銷與活動執行。',
            createTime: '2024-03-10T18:00:00',
            createUser: 'sale_mgr',
            updateTime: '2024-07-02T18:30:00',
            updateUser: 'sale_mgr',
            parentDeptName: '銷售服務中心',
            managerName: '葉姿君'
        },
        {
            deptId: 17,
            parentDeptId: 5,
            deptCode: 'UXUI',
            deptName: 'UX設計組',
            deptLevel: 'LOB',
            managerEmpId: 17,
            isActive: true,
            deptDesc: '使用者體驗與介面設計團隊。',
            createTime: '2024-03-11T19:00:00',
            createUser: 'eng_mgr',
            updateTime: '2024-07-02T19:10:00',
            updateUser: 'eng_mgr',
            parentDeptName: '工程研發中心',
            managerName: '鄧宜樺'
        },
        {
            deptId: 18,
            parentDeptId: 6,
            deptCode: 'SQA',
            deptName: '自動化測試組',
            deptLevel: 'LOB',
            managerEmpId: 18,
            isActive: true,
            deptDesc: '軟體測試自動化開發、測試效率提升。',
            createTime: '2024-03-12T20:00:00',
            createUser: 'qa_mgr',
            updateTime: '2024-07-02T20:10:00',
            updateUser: 'qa_mgr',
            parentDeptName: '品質管理中心',
            managerName: '方承睿'
        },
        {
            deptId: 19,
            parentDeptId: 5,
            deptCode: 'DOCS',
            deptName: '技術文件組',
            deptLevel: 'LOB',
            managerEmpId: 19,
            isActive: true,
            deptDesc: '撰寫、管理技術與開發文件。',
            createTime: '2024-03-13T21:00:00',
            createUser: 'eng_mgr',
            updateTime: '2024-07-02T21:10:00',
            updateUser: 'eng_mgr',
            parentDeptName: '工程研發中心',
            managerName: '廖立文'
        },
        {
            deptId: 20,
            parentDeptId: 3,
            deptCode: 'SUP',
            deptName: '支援服務組',
            deptLevel: 'LOB',
            managerEmpId: 20,
            isActive: true,
            deptDesc: '內部技術與行政支援服務窗口。',
            createTime: '2024-03-14T22:00:00',
            createUser: 'ops_mgr',
            updateTime: '2024-07-02T22:10:00',
            updateUser: 'ops_mgr',
            parentDeptName: '營運管理中心',
            managerName: '林品妤'
        }
    ];

    // BehaviorSubject for reactive updates
    private departmentsSubject = new BehaviorSubject<Department[]>(this.mockDepartments);

    constructor() { }

    /**
     * Get departments with search, filtering, and pagination
     */
    getDepartments(
        page = 1,
        pageSize = 10,
        searchTerm = '',
        filters: DepartmentSearchFilters = {}
    ): Observable<DepartmentListResponse> {
        if (this.useMockData) {
            return this.getMockDepartments(page, pageSize, searchTerm, filters);
        }

        // 使用 camelCase 參數，HTTP 攔截器會自動轉換為 snake_case
        const params: any = {
            page,
            pageSize
        };

        if (searchTerm) {
            params.keyword = searchTerm;
        }
        if (filters.deptLevel) {
            params.deptLevel = filters.deptLevel;  // 轉為 camelCase
        }
        if (filters.isActive !== undefined) {
            params.isActive = filters.isActive;  // 轉為 camelCase
        }
        if (filters.parentDeptId !== undefined) {
            params.parentDeptId = filters.parentDeptId;  // 轉為 camelCase
        }

        console.log('Sending HTTP GET request with params (camelCase, 攔截器會自動轉換):', params);

        return this.http.get<ApiResponse<PagerDto<Department>>>(`${this.apiUrl}/query`, { params }).pipe(
            map(response => {
                // HTTP 攔截器已經自動轉換為 camelCase，直接使用
                if (response.code === 1000 && response.data) {
                    const pagerDto = response.data;
                    const departments = pagerDto.dataList || [];

                    return {
                        data: departments,
                        total: pagerDto.totalRecords || departments.length,
                        page: page,
                        pageSize: pageSize
                    };
                } else {
                    throw new Error(response.message || '載入部門資料失敗');
                }
            })
        );
    }

    /**
     * 獲取所有活躍部門的簡單方法（用於下拉選單）
     */
    getActiveDepartments(): Observable<Department[]> {
        //console.log('getActiveDepartments called, useMockData:', this.useMockData);

        if (this.useMockData) {
            const activeDepts = this.mockDepartments.filter(dept => dept.isActive === true);
            //console.log('返回 mock 活躍部門:', activeDepts);
            return of(activeDepts).pipe(delay(300));
        }

        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                //console.log('API 完整回應:', response);
                //console.log('回應類型:', typeof response);
                //console.log('response.code:', response?.code);
                //console.log('response.data:', response?.data);

                if (response?.code === 1000 && response?.data) {
                    //console.log('API 回應驗證成功，資料數量:', response.data.length);

                    // 過濾只取活躍的部門 - 後端回傳的欄位可能是 is_active 或 isActive
                    const activeDepts = response.data.filter((dept: any) => {
                        //console.log('檢查部門:', dept.dept_name || dept.deptName, 'is_active:', dept.is_active, 'isActive:', dept.isActive);
                        return dept.is_active === true || dept.isActive === true;
                    });
                    //console.log('過濾後的活躍部門數量:', activeDepts.length);
                    //console.log('過濾後的活躍部門:', activeDepts);

                    // 轉換後端格式到前端期望的格式
                    const mappedDepts = activeDepts.map((dept: any) => ({
                        dept_id: dept.dept_id || dept.deptId,
                        dept_code: dept.dept_code || dept.deptCode,
                        dept_name: dept.dept_name || dept.deptName,
                        dept_level: dept.dept_level || dept.deptLevel || 'BU',
                        parent_dept_id: dept.parent_dept_id || dept.parentDeptId || null,
                        manager_emp_id: dept.manager_emp_id || dept.managerEmpId || null,
                        is_active: dept.is_active === true || dept.isActive === true,
                        create_time: dept.create_time || dept.createTime || new Date().toISOString(),
                        create_user: dept.create_user || dept.createUser || 'system',
                        update_time: dept.update_time || dept.updateTime || undefined,
                        update_user: dept.update_user || dept.updateUser
                    }));

                    //console.log('映射後的部門資料數量:', mappedDepts.length);
                    //console.log('映射後的部門資料:', mappedDepts);
                    return mappedDepts;
                } else {
                    console.error('API 回應格式錯誤 - code:', response?.code, 'data:', response?.data);
                    throw new Error(response?.message || '載入部門資料失敗');
                }
            }),
            catchError(this.httpErrorHandler.handleError('getDepartments', []))
        );
    }

    private getMockDepartments(
        page: number,
        pageSize: number,
        searchTerm: string,
        filters: DepartmentSearchFilters
    ): Observable<DepartmentListResponse> {
        return of(null).pipe(
            delay(300), // Simulate network delay
            map(() => {
                let filteredDepartments = [...this.mockDepartments];

                console.log('原始部門數據數量:', filteredDepartments.length);
                console.log('搜尋關鍵字:', searchTerm);
                console.log('篩選條件:', filters);

                // Apply search filter
                if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    filteredDepartments = filteredDepartments.filter(dept =>
                        dept.deptName.toLowerCase().includes(term) ||
                        dept.deptCode.toLowerCase().includes(term)
                    );
                    console.log('按關鍵字過濾後數量:', filteredDepartments.length);
                }

                // Apply filters
                if (filters.deptLevel && filters.deptLevel.trim() !== '') {
                    console.log('按層級過濾，目標層級:', filters.deptLevel);
                    filteredDepartments = filteredDepartments.filter(dept => {
                        const match = dept.deptLevel === filters.deptLevel;
                        console.log(`部門 ${dept.deptName} 層級: ${dept.deptLevel}, 目標: ${filters.deptLevel}, 匹配: ${match}`);
                        return match;
                    });
                    console.log('按層級過濾後數量:', filteredDepartments.length);
                }

                if (filters.isActive !== undefined) {
                    console.log('按狀態過濾，目標狀態:', filters.isActive, '類型:', typeof filters.isActive);

                    // 確保比較時類型一致
                    const targetStatus = Boolean(filters.isActive);
                    filteredDepartments = filteredDepartments.filter(dept => {
                        const deptStatus = Boolean(dept.isActive);
                        console.log(`部門 ${dept.deptName} 狀態: ${deptStatus}, 目標: ${targetStatus}, 匹配: ${deptStatus === targetStatus}`);
                        return deptStatus === targetStatus;
                    });
                    console.log('按狀態過濾後數量:', filteredDepartments.length);
                }

                if (filters.parentDeptId !== undefined) {
                    filteredDepartments = filteredDepartments.filter(dept =>
                        dept.parentDeptId === filters.parentDeptId
                    );
                    console.log('按上級部門過濾後數量:', filteredDepartments.length);
                }

                // Calculate pagination
                const totalItems = filteredDepartments.length;
                const totalPages = Math.ceil(totalItems / pageSize);
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

                console.log('最終返回數據數量:', paginatedDepartments.length);

                return {
                    data: paginatedDepartments,  // 改為 data 而不是 departments 以保持一致性
                    total: totalItems,
                    page: page,
                    pageSize
                };
            })
        );
    }

    /**
     * Get a single department by ID
     */
    getDepartmentById(id: number): Observable<Department | null> {
        if (this.useMockData) {
            return of(this.mockDepartments).pipe(
                delay(200),
                map(departments => departments.find(dept => dept.deptId === id) || null),
            );
        }

        return this.http.get<any>(`${this.apiUrl}/find/${id}`).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        deptId: dept.dept_id,
                        deptCode: dept.dept_code,
                        deptName: dept.dept_name,
                        deptLevel: dept.dept_level,
                        parentDeptId: dept.parent_dept_id,
                        managerEmpId: dept.manager_emp_id,
                        isActive: dept.is_active,
                        deptDesc: dept.dept_desc,
                        createTime: dept.create_time || new Date().toISOString(),
                        createUser: dept.create_user || 'system',
                        updateTime: dept.update_time || undefined,
                        updateUser: dept.update_user
                    } as Department;
                } else {
                    return null;
                }
            })
        );
    }

    /**
     * Create a new department
     */
    createDepartment(request: CreateDepartmentRequest): Observable<Department> {
        if (this.useMockData) {
            return of(null).pipe(
                delay(500),
                map(() => {
                    const currentUser = this.getCurrentUser();
                    const newDepartment: Department = {
                        deptId: Math.max(...this.mockDepartments.map(d => d.deptId)) + 1,
                        deptCode: request.deptCode,
                        deptName: request.deptName,
                        deptLevel: request.deptLevel,
                        parentDeptId: request.parentDeptId ?? null,
                        managerEmpId: request.managerEmpId ?? null,
                        isActive: true,
                        createTime: new Date().toISOString(),
                        createUser: currentUser,
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    };

                    this.mockDepartments.push(newDepartment);
                    this.departmentsSubject.next([...this.mockDepartments]);

                    return newDepartment;
                })
            );
        }

        // 後端 API 調用
        const currentUser = this.getCurrentUser();
        const departmentData = {
            deptCode: request.deptCode,
            deptName: request.deptName,
            deptLevel: request.deptLevel,
            parentDeptId: request.parentDeptId || null,
            managerEmpId: request.managerEmpId || null,
            isActive: request.isActive ?? true,
            deptDesc: request.deptDesc,
            createUser: currentUser
        };

        return this.http.post<any>(`${this.apiUrl}/create`, departmentData).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        deptId: dept.dept_id,
                        deptCode: dept.dept_code,
                        deptName: dept.dept_name,
                        deptLevel: dept.dept_level,
                        parentDeptId: dept.parent_dept_id,
                        managerEmpId: dept.manager_emp_id,
                        isActive: dept.is_active,
                        deptDesc: dept.dept_desc,
                        createTime: dept.create_time || new Date().toISOString(),
                        createUser: dept.create_user,
                        updateTime: dept.update_time || undefined,
                        updateUser: dept.update_user
                    };
                } else {
                    throw new Error(response.message || '創建部門失敗');
                }
            }),
            catchError(error => {
                console.error('創建部門時發生錯誤:', error);
                throw error;
            })
        );
    }

    /**
     * Update an existing department
     */
    updateDepartment(id: number, request: UpdateDepartmentRequest): Observable<Department> {
        if (this.useMockData) {
            return of(null).pipe(
                delay(500),
                map(() => {
                    const departmentIndex = this.mockDepartments.findIndex(dept => dept.deptId === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    const currentUser = this.getCurrentUser();
                    const existingDepartment = this.mockDepartments[departmentIndex];
                    const updatedDepartment: Department = {
                        ...existingDepartment,
                        ...request,
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    };

                    this.mockDepartments[departmentIndex] = updatedDepartment;
                    this.departmentsSubject.next([...this.mockDepartments]);

                    return updatedDepartment;
                })
            );
        }

        // 後端 API 調用
        const currentUser = this.getCurrentUser();
        const updateData = {
            deptId: id,
            deptCode: request.deptCode,
            deptName: request.deptName,
            deptLevel: request.deptLevel,
            parentDeptId: request.parentDeptId,
            managerEmpId: request.managerEmpId,
            isActive: request.isActive,
            deptDesc: request.deptDesc,
            updateUser: currentUser,
            updateTime: new Date().toISOString()
        };

        return this.http.post<any>(`${this.apiUrl}/update`, updateData).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        deptId: dept.dept_id,
                        deptCode: dept.dept_code,
                        deptName: dept.dept_name,
                        deptLevel: dept.dept_level,
                        parentDeptId: dept.parent_dept_id,
                        managerEmpId: dept.manager_emp_id,
                        isActive: dept.is_active,
                        deptDesc: dept.dept_desc,
                        createTime: dept.create_time || new Date().toISOString(),
                        createUser: dept.create_user || 'system',
                        updateTime: dept.update_time || new Date().toISOString(),
                        updateUser: dept.update_user || 'system'
                    } as Department;
                } else if (response.code === 1000) {
                    // 成功但沒有回傳資料的情況，使用請求資料建構回傳
                    const currentUser = this.getCurrentUser();
                    return {
                        deptId: id,
                        deptCode: request.deptCode,
                        deptName: request.deptName,
                        deptLevel: request.deptLevel,
                        parentDeptId: request.parentDeptId,
                        managerEmpId: request.managerEmpId,
                        isActive: request.isActive,
                        deptDesc: request.deptDesc,
                        createTime: new Date().toISOString(),
                        createUser: 'system',
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    } as Department;
                } else {
                    throw new Error(response.message || '更新部門失敗');
                }
            }),
            catchError(error => {
                console.error('更新部門時發生錯誤:', error);
                throw error;
            })
        );
    }

    /**
     * Delete a department (soft delete)
     */
    deleteDepartment(id: number): Observable<boolean> {
        if (this.useMockData) {
            return of(null).pipe(
                delay(300),
                map(() => {
                    const departmentIndex = this.mockDepartments.findIndex(dept => dept.deptId === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    const currentUser = this.getCurrentUser();
                    // Soft delete by setting is_active to false
                    this.mockDepartments[departmentIndex] = {
                        ...this.mockDepartments[departmentIndex],
                        isActive: false,
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    };

                    this.departmentsSubject.next([...this.mockDepartments]);
                    return true;
                })
            );
        }

        // 後端 API 調用
        const deleteData = { dept_id: id };

        return this.http.post<any>(`${this.apiUrl}/delete`, deleteData).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000) {
                    return true;
                } else {
                    throw new Error(response.message || '刪除部門失敗');
                }
            })
        );
    }

    /**
     * Toggle department active status (呼叫 update API，送出 is_active 欄位)
     */
    toggleDepartmentStatus(departmentId: number): Observable<Department> {
        return this.getDepartmentById(departmentId).pipe(
            map((dept: Department | null): Department => {
                if (!dept) throw new Error(`Department with id ${departmentId} not found`);
                // 切換狀態
                return { ...dept, isActive: !dept.isActive };
            }),
            switchMap((toggled: Department) => this.updateDepartment(toggled.deptId, {
                deptId: toggled.deptId,
                deptCode: toggled.deptCode,
                deptName: toggled.deptName,
                deptLevel: toggled.deptLevel,
                parentDeptId: toggled.parentDeptId,
                managerEmpId: toggled.managerEmpId,
                isActive: toggled.isActive
            }))
        );
    }

    /**
     * Get root departments (departments without parent)
     */
    getRootDepartments(): Observable<Department[]> {
        if (this.useMockData) {
            // 只回傳頂層且啟用的部門
            return of(this.mockDepartments.filter(dept => dept.parentDeptId === null && dept.isActive === true)).pipe(delay(200));
        }

        // 從 API 取得全部部門，過濾頂層且啟用的部門
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    return response.data
                        .filter((dept: any) =>
                            (dept.parent_dept_id === null || dept.parentDeptId === null) &&
                            (dept.is_active === true || dept.isActive === true) //沒有上級部門（parent_dept_id 為 null）且啟用中的部門
                        )
                        .map((dept: any) => ({
                            dept_id: dept.dept_id || dept.deptId,
                            dept_code: dept.dept_code || dept.deptCode,
                            dept_name: dept.dept_name || dept.deptName,
                            dept_level: dept.dept_level || dept.deptLevel || 'BU',
                            parent_dept_id: dept.parent_dept_id || dept.parentDeptId || null,
                            manager_emp_id: dept.manager_emp_id || dept.managerEmpId || null,
                            is_active: dept.is_active === true || dept.isActive === true,
                            create_time: new Date(dept.create_time || dept.createTime || Date.now()),
                            create_user: dept.create_user || dept.createUser || 'system',
                            update_time: dept.update_time ? new Date(dept.update_time) : (dept.updateTime ? new Date(dept.updateTime) : undefined),
                            update_user: dept.update_user || dept.updateUser
                        }));
                } else {
                    return [];
                }
            })
        );
    }

    /**
     * Get child departments for a given parent
     */
    getChildDepartments(parentId: number): Observable<Department[]> {
        if (this.useMockData) {
            return of(this.mockDepartments).pipe(
                delay(200),
                map(departments => departments.filter(dept =>
                    dept.parentDeptId === parentId && dept.isActive === true
                )),
            );
        }

        // 實際 API 調用 - 後端回應格式：ApiResponse<DepartmentDto[]>
        return this.http.get<any>(`${this.apiUrl}/children/${parentId}`).pipe(
            map(response => {
                if (response.code === 1000 && response.data) {
                    return response.data.map((dept: any) => ({
                        dept_id: dept.dept_id || dept.deptId,
                        dept_code: dept.dept_code || dept.deptCode,
                        dept_name: dept.dept_name || dept.deptName,
                        dept_level: dept.dept_level || dept.deptLevel || 'BU',
                        parent_dept_id: dept.parent_dept_id || dept.parentDeptId || null,
                        manager_emp_id: dept.manager_emp_id || dept.managerEmpId || null,
                        is_active: dept.is_active === true || dept.isActive === true,
                        create_time: new Date(dept.create_time || dept.createTime || Date.now()),
                        create_user: dept.create_user || dept.createUser || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : (dept.updateTime ? new Date(dept.updateTime) : undefined),
                        update_user: dept.update_user || dept.updateUser
                    }));
                } else {
                    return [];
                }
            }),
            catchError(() => of([]))
        );
    }

    /**
     * Get department hierarchy tree
     */
    getDepartmentHierarchy(): Observable<Department[]> {
        if (this.useMockData) {
            return of(this.mockDepartments).pipe(
                delay(300),
                map(departments => {
                    return departments.filter(dept => dept.isActive === true)
                        .sort((a, b) => {
                            if (a.deptLevel !== b.deptLevel) {
                                const levelOrder = { 'BI': 1, 'BU': 2, 'DEPT': 3 };
                                return (levelOrder[a.deptLevel as keyof typeof levelOrder] || 4) -
                                    (levelOrder[b.deptLevel as keyof typeof levelOrder] || 4);
                            }
                            return a.deptName.localeCompare(b.deptName);
                        });
                })
            );
        }

        // 實際 API 調用 - 後端回應格式：ApiResponse<DepartmentDto[]>
        return this.http.get<any>(`${this.apiUrl}/hierarchy`).pipe(
            map(response => {
                if (response.code === 1000 && response.data) {
                    return response.data.map((dept: any) => ({
                        dept_id: dept.dept_id || dept.deptId,
                        dept_code: dept.dept_code || dept.deptCode,
                        dept_name: dept.dept_name || dept.deptName,
                        dept_level: dept.dept_level || dept.deptLevel || 'BU',
                        parent_dept_id: dept.parent_dept_id || dept.parentDeptId || null,
                        manager_emp_id: dept.manager_emp_id || dept.managerEmpId || null,
                        is_active: dept.is_active === true || dept.isActive === true,
                        create_time: new Date(dept.create_time || dept.createTime || Date.now()),
                        create_user: dept.create_user || dept.createUser || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : (dept.updateTime ? new Date(dept.updateTime) : undefined),
                        update_user: dept.update_user || dept.updateUser
                    }));
                } else {
                    return [];
                }
            }),
            catchError(() => of([]))
        );
    }

    /**
     * Get departments as observable for reactive updates
     */
    getDepartmentsAsObservable(): Observable<Department[]> {
        if (this.useMockData) {
            return this.departmentsSubject.asObservable();
        }

        // 從 API 取得全部部門，轉成 Department[] - 後端回應格式：ApiResponse<DepartmentDto[]>
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                if (response.code === 1000 && response.data) {
                    return response.data.map((dept: any) => ({
                        dept_id: dept.dept_id || dept.deptId,
                        dept_code: dept.dept_code || dept.deptCode,
                        dept_name: dept.dept_name || dept.deptName,
                        dept_level: dept.dept_level || dept.deptLevel || 'BU',
                        parent_dept_id: dept.parent_dept_id || dept.parentDeptId || null,
                        manager_emp_id: dept.manager_emp_id || dept.managerEmpId || null,
                        is_active: dept.is_active === true || dept.isActive === true,
                        create_time: new Date(dept.create_time || dept.createTime || Date.now()),
                        create_user: dept.create_user || dept.createUser || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : (dept.updateTime ? new Date(dept.updateTime) : undefined),
                        update_user: dept.update_user || dept.updateUser
                    }));
                } else {
                    return [];
                }
            })
        );
    }

    /**
     * Check if department code is unique
     */
    isDepartmentCodeUnique(code: string, excludeId?: number): Observable<boolean> {
        if (this.useMockData) {
            return of(this.mockDepartments).pipe(
                delay(200),
                map(departments => {
                    const existingDept = departments.find(dept =>
                        dept.deptCode.toLowerCase() === code.toLowerCase() &&
                        dept.deptId !== excludeId
                    );
                    return !existingDept;
                })
            );
        }

        // 實際 API 調用 - 後端回應格式：ApiResponse<{ isUnique: boolean }>
        const params = excludeId ? `?code=${code}&excludeId=${excludeId}` : `?code=${code}`;

        return this.http.get<any>(`${this.apiUrl}/check-code${params}`).pipe(
            map(response => {
                if (response.code === 1000) {
                    return response.data.isUnique;
                } else {
                    throw new Error(response.message || '檢查部門代碼失敗');
                }
            }),
            catchError(() => of(true))
        );
    }
}
