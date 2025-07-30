import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, map, delay, catchError, switchMap } from 'rxjs';
import {
    Department,
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DepartmentListResponse,
    DepartmentSearchFilters,
    DepartmentLevel
} from '../models/department.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    private http = inject(HttpClient);

    // Toggle between mock data and real API
    private readonly useMockData = false;
    private readonly apiUrl = `${environment.apiBaseUrl}/departments`;

    private mockDepartments: Department[] = [
        // BI層（最高層，通常1-3個）
        {
            dept_id: 1,
            parent_dept_id: null,
            dept_code: 'CORP',
            dept_name: '企業發展事業群',
            dept_level: 'BI',
            manager_emp_id: 1,
            is_active: true,
            dept_desc: '負責公司整體發展與決策，涵蓋策略與規劃等。',
            create_time: new Date('2024-01-10T08:00:00'),
            create_user: 'sysadmin',
            update_time: new Date('2024-06-01T08:30:00'),
            update_user: 'sysadmin',
            parent_dept_name: undefined,
            manager_name: '林泰安'
        },
        {
            dept_id: 2,
            parent_dept_id: null,
            dept_code: 'TECH',
            dept_name: '技術策略事業群',
            dept_level: 'BI',
            manager_emp_id: 2,
            is_active: true,
            dept_desc: '主導技術方向與產品創新策略。',
            create_time: new Date('2024-01-12T09:00:00'),
            create_user: 'sysadmin',
            update_time: new Date('2024-06-03T09:45:00'),
            update_user: 'sysadmin',
            parent_dept_name: undefined,
            manager_name: '張偉翔'
        },

        // BU 層
        {
            dept_id: 3,
            parent_dept_id: 1,
            dept_code: 'OPS',
            dept_name: '營運管理中心',
            dept_level: 'BU',
            manager_emp_id: 3,
            is_active: true,
            dept_desc: '統籌營運資源，確保業務穩定發展。',
            create_time: new Date('2024-02-01T10:00:00'),
            create_user: 'admin1',
            update_time: new Date('2024-06-08T10:00:00'),
            update_user: 'admin1',
            parent_dept_name: '企業發展事業群',
            manager_name: '蘇怡君'
        },
        {
            dept_id: 4,
            parent_dept_id: 1,
            dept_code: 'SALE',
            dept_name: '銷售服務中心',
            dept_level: 'BU',
            manager_emp_id: 4,
            is_active: true,
            dept_desc: '負責全公司銷售目標與客戶關係管理。',
            create_time: new Date('2024-02-02T13:00:00'),
            create_user: 'admin2',
            update_time: new Date('2024-06-10T13:00:00'),
            update_user: 'admin2',
            parent_dept_name: '企業發展事業群',
            manager_name: '高家豪'
        },
        {
            dept_id: 5,
            parent_dept_id: 2,
            dept_code: 'ENG',
            dept_name: '工程研發中心',
            dept_level: 'BU',
            manager_emp_id: 5,
            is_active: true,
            dept_desc: '技術開發與產品維護的核心部門。',
            create_time: new Date('2024-02-03T11:00:00'),
            create_user: 'admin3',
            update_time: new Date('2024-06-11T11:00:00'),
            update_user: 'admin3',
            parent_dept_name: '技術策略事業群',
            manager_name: '許惠玲'
        },
        {
            dept_id: 6,
            parent_dept_id: 2,
            dept_code: 'QA',
            dept_name: '品質管理中心',
            dept_level: 'BU',
            manager_emp_id: 6,
            is_active: true,
            dept_desc: '確保產品服務品質、制定品質標準。',
            create_time: new Date('2024-02-04T15:00:00'),
            create_user: 'admin4',
            update_time: new Date('2024-06-12T15:00:00'),
            update_user: 'admin4',
            parent_dept_name: '技術策略事業群',
            manager_name: '吳志軒'
        },

        // LOB 層
        {
            dept_id: 7,
            parent_dept_id: 3,
            dept_code: 'CUST',
            dept_name: '客服組',
            dept_level: 'LOB',
            manager_emp_id: 7,
            is_active: true,
            dept_desc: '第一線客戶回應與問題處理。',
            create_time: new Date('2024-03-01T09:00:00'),
            create_user: 'ops_mgr',
            update_time: new Date('2024-07-01T09:30:00'),
            update_user: 'ops_mgr',
            parent_dept_name: '營運管理中心',
            manager_name: '鄭佳珊'
        },
        {
            dept_id: 8,
            parent_dept_id: 3,
            dept_code: 'PROC',
            dept_name: '採購組',
            dept_level: 'LOB',
            manager_emp_id: 8,
            is_active: true,
            dept_desc: '原物料與外包服務採購。',
            create_time: new Date('2024-03-02T10:00:00'),
            create_user: 'ops_mgr',
            update_time: new Date('2024-07-01T10:15:00'),
            update_user: 'ops_mgr',
            parent_dept_name: '營運管理中心',
            manager_name: '王柏廷'
        },
        {
            dept_id: 9,
            parent_dept_id: 4,
            dept_code: 'DOMS',
            dept_name: '國內銷售組',
            dept_level: 'LOB',
            manager_emp_id: 9,
            is_active: true,
            dept_desc: '負責國內客戶與經銷商業務。',
            create_time: new Date('2024-03-03T11:00:00'),
            create_user: 'sale_mgr',
            update_time: new Date('2024-07-01T11:25:00'),
            update_user: 'sale_mgr',
            parent_dept_name: '銷售服務中心',
            manager_name: '林家宏'
        },
        {
            dept_id: 10,
            parent_dept_id: 4,
            dept_code: 'INTR',
            dept_name: '國際銷售組',
            dept_level: 'LOB',
            manager_emp_id: 10,
            is_active: true,
            dept_desc: '拓展海外市場，協助出口業務。',
            create_time: new Date('2024-03-04T12:00:00'),
            create_user: 'sale_mgr',
            update_time: new Date('2024-07-01T12:35:00'),
            update_user: 'sale_mgr',
            parent_dept_name: '銷售服務中心',
            manager_name: '葉欣怡'
        },
        {
            dept_id: 11,
            parent_dept_id: 5,
            dept_code: 'DEV',
            dept_name: '後端開發組',
            dept_level: 'LOB',
            manager_emp_id: 11,
            is_active: true,
            dept_desc: '專注於後端系統設計與維護。',
            create_time: new Date('2024-03-05T13:00:00'),
            create_user: 'eng_mgr',
            update_time: new Date('2024-07-01T13:45:00'),
            update_user: 'eng_mgr',
            parent_dept_name: '工程研發中心',
            manager_name: '曾國凱'
        },
        {
            dept_id: 12,
            parent_dept_id: 5,
            dept_code: 'FRONT',
            dept_name: '前端開發組',
            dept_level: 'LOB',
            manager_emp_id: 12,
            is_active: true,
            dept_desc: '前端UI與互動介面設計。',
            create_time: new Date('2024-03-06T14:00:00'),
            create_user: 'eng_mgr',
            update_time: new Date('2024-07-01T14:55:00'),
            update_user: 'eng_mgr',
            parent_dept_name: '工程研發中心',
            manager_name: '陳韋廷'
        },
        {
            dept_id: 13,
            parent_dept_id: 6,
            dept_code: 'TEST',
            dept_name: '軟體測試組',
            dept_level: 'LOB',
            manager_emp_id: 13,
            is_active: true,
            dept_desc: '產品測試與自動化回歸測試。',
            create_time: new Date('2024-03-07T15:00:00'),
            create_user: 'qa_mgr',
            update_time: new Date('2024-07-01T15:20:00'),
            update_user: 'qa_mgr',
            parent_dept_name: '品質管理中心',
            manager_name: '賴信瑋'
        },
        {
            dept_id: 14,
            parent_dept_id: 6,
            dept_code: 'CTRL',
            dept_name: '品管稽核組',
            dept_level: 'LOB',
            manager_emp_id: 14,
            is_active: true,
            dept_desc: '協助品質稽核與標準作業稽查。',
            create_time: new Date('2024-03-08T16:00:00'),
            create_user: 'qa_mgr',
            update_time: new Date('2024-07-01T16:40:00'),
            update_user: 'qa_mgr',
            parent_dept_name: '品質管理中心',
            manager_name: '簡雅婷'
        },
        {
            dept_id: 15,
            parent_dept_id: 3,
            dept_code: 'RISK',
            dept_name: '風險控管組',
            dept_level: 'LOB',
            manager_emp_id: 15,
            is_active: false,
            dept_desc: '內部稽核、企業風險評估與控管。',
            create_time: new Date('2024-03-09T17:00:00'),
            create_user: 'ops_mgr',
            update_time: new Date('2024-07-02T17:10:00'),
            update_user: 'ops_mgr',
            parent_dept_name: '營運管理中心',
            manager_name: '許榮華'
        },
        {
            dept_id: 16,
            parent_dept_id: 4,
            dept_code: 'MARK',
            dept_name: '行銷推廣組',
            dept_level: 'LOB',
            manager_emp_id: 16,
            is_active: true,
            dept_desc: '產品推廣、品牌行銷與活動執行。',
            create_time: new Date('2024-03-10T18:00:00'),
            create_user: 'sale_mgr',
            update_time: new Date('2024-07-02T18:30:00'),
            update_user: 'sale_mgr',
            parent_dept_name: '銷售服務中心',
            manager_name: '葉姿君'
        },
        {
            dept_id: 17,
            parent_dept_id: 5,
            dept_code: 'UXUI',
            dept_name: 'UX設計組',
            dept_level: 'LOB',
            manager_emp_id: 17,
            is_active: true,
            dept_desc: '使用者體驗與介面設計團隊。',
            create_time: new Date('2024-03-11T19:00:00'),
            create_user: 'eng_mgr',
            update_time: new Date('2024-07-02T19:10:00'),
            update_user: 'eng_mgr',
            parent_dept_name: '工程研發中心',
            manager_name: '鄧宜樺'
        },
        {
            dept_id: 18,
            parent_dept_id: 6,
            dept_code: 'SQA',
            dept_name: '自動化測試組',
            dept_level: 'LOB',
            manager_emp_id: 18,
            is_active: true,
            dept_desc: '軟體測試自動化開發、測試效率提升。',
            create_time: new Date('2024-03-12T20:00:00'),
            create_user: 'qa_mgr',
            update_time: new Date('2024-07-02T20:10:00'),
            update_user: 'qa_mgr',
            parent_dept_name: '品質管理中心',
            manager_name: '方承睿'
        },
        {
            dept_id: 19,
            parent_dept_id: 5,
            dept_code: 'DOCS',
            dept_name: '技術文件組',
            dept_level: 'LOB',
            manager_emp_id: 19,
            is_active: true,
            dept_desc: '撰寫、管理技術與開發文件。',
            create_time: new Date('2024-03-13T21:00:00'),
            create_user: 'eng_mgr',
            update_time: new Date('2024-07-02T21:10:00'),
            update_user: 'eng_mgr',
            parent_dept_name: '工程研發中心',
            manager_name: '廖立文'
        },
        {
            dept_id: 20,
            parent_dept_id: 3,
            dept_code: 'SUP',
            dept_name: '支援服務組',
            dept_level: 'LOB',
            manager_emp_id: 20,
            is_active: true,
            dept_desc: '內部技術與行政支援服務窗口。',
            create_time: new Date('2024-03-14T22:00:00'),
            create_user: 'ops_mgr',
            update_time: new Date('2024-07-02T22:10:00'),
            update_user: 'ops_mgr',
            parent_dept_name: '營運管理中心',
            manager_name: '林品妤'
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

        // 後端使用 GET /api/departments/query，並傳遞查詢參數
        const params: any = {
            page,
            pageSize
        };

        if (searchTerm) {
            params.keyword = searchTerm;
        }
        if (filters.dept_level) {
            params.dept_level = filters.dept_level;
        }
        if (filters.is_active !== undefined) {
            params.is_active = filters.is_active;
        }
        if (filters.parent_dept_id !== undefined) {
            params.parent_dept_id = filters.parent_dept_id;
        }

        console.log('Sending HTTP GET request with params:', params);
        console.log('Constructed request URL:', `${this.apiUrl}/query`);
        console.log('Constructed request params:', params);

        return this.http.get<any>(`${this.apiUrl}/query`, { params }).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const pagerDto = response.data;
                    // 後端使用 data_list 而不是 dataList，total_records 而不是 totalRecords
                    const departments = pagerDto.data_list ? pagerDto.data_list.map((dept: any) => ({
                        dept_id: dept.dept_id,
                        dept_code: dept.dept_code,
                        dept_name: dept.dept_name,
                        dept_level: dept.dept_level,
                        parent_dept_id: dept.parent_dept_id,
                        manager_emp_id: dept.manager_emp_id,
                        is_active: dept.is_active,
                        dept_desc: dept.dept_desc,
                        create_time: dept.create_time ? new Date(dept.create_time) : undefined,
                        create_user: dept.create_user,
                        update_time: dept.update_time ? new Date(dept.update_time) : undefined,
                        update_user: dept.update_user,
                        parent_dept_name: dept.parent_dept_name,
                        manager_name: dept.manager_name
                    })) : [];

                    return {
                        data: departments,
                        total: pagerDto.total_records || departments.length,
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
            const activeDepts = this.mockDepartments.filter(dept => dept.is_active === true);
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
                        create_time: new Date(dept.create_time || dept.createTime || Date.now()),
                        create_user: dept.create_user || dept.createUser || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : (dept.updateTime ? new Date(dept.updateTime) : undefined),
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
            catchError((error: any) => {
                console.error('API 請求失敗:', error);
                console.error('錯誤詳情:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    url: error.url
                });
                throw error;
            })
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
                        dept.dept_name.toLowerCase().includes(term) ||
                        dept.dept_code.toLowerCase().includes(term)
                    );
                    console.log('按關鍵字過濾後數量:', filteredDepartments.length);
                }

                // Apply filters
                if (filters.dept_level && filters.dept_level.trim() !== '') {
                    console.log('按層級過濾，目標層級:', filters.dept_level);
                    filteredDepartments = filteredDepartments.filter(dept => {
                        const match = dept.dept_level === filters.dept_level;
                        console.log(`部門 ${dept.dept_name} 層級: ${dept.dept_level}, 目標: ${filters.dept_level}, 匹配: ${match}`);
                        return match;
                    });
                    console.log('按層級過濾後數量:', filteredDepartments.length);
                }

                if (filters.is_active !== undefined) {
                    console.log('按狀態過濾，目標狀態:', filters.is_active, '類型:', typeof filters.is_active);

                    // 確保比較時類型一致
                    const targetStatus = Boolean(filters.is_active);
                    filteredDepartments = filteredDepartments.filter(dept => {
                        const deptStatus = Boolean(dept.is_active);
                        console.log(`部門 ${dept.dept_name} 狀態: ${deptStatus}, 目標: ${targetStatus}, 匹配: ${deptStatus === targetStatus}`);
                        return deptStatus === targetStatus;
                    });
                    console.log('按狀態過濾後數量:', filteredDepartments.length);
                }

                if (filters.parent_dept_id !== undefined) {
                    filteredDepartments = filteredDepartments.filter(dept =>
                        dept.parent_dept_id === filters.parent_dept_id
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
                map(departments => departments.find(dept => dept.dept_id === id) || null),
            );
        }

        return this.http.get<any>(`${this.apiUrl}/find/${id}`).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        dept_id: dept.dept_id,
                        dept_code: dept.dept_code,
                        dept_name: dept.dept_name,
                        dept_level: dept.dept_level,
                        parent_dept_id: dept.parent_dept_id,
                        manager_emp_id: dept.manager_emp_id,
                        is_active: dept.is_active,
                        dept_desc: dept.dept_desc,
                        create_time: dept.create_time ? new Date(dept.create_time) : new Date(),
                        create_user: dept.create_user || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : undefined,
                        update_user: dept.update_user
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
                    const newDepartment: Department = {
                        dept_id: Math.max(...this.mockDepartments.map(d => d.dept_id)) + 1,
                        dept_code: request.dept_code,
                        dept_name: request.dept_name,
                        dept_level: request.dept_level,
                        parent_dept_id: request.parent_dept_id ?? null,
                        manager_emp_id: request.manager_emp_id ?? null,
                        is_active: true,
                        create_time: new Date(),
                        create_user: 'current_user',
                        update_time: new Date(),
                        update_user: 'current_user'
                    };

                    this.mockDepartments.push(newDepartment);
                    this.departmentsSubject.next([...this.mockDepartments]);

                    return newDepartment;
                })
            );
        }

        // 後端 API 調用
        const departmentData = {
            dept_code: request.dept_code,
            dept_name: request.dept_name,
            dept_level: request.dept_level,
            parent_dept_id: request.parent_dept_id || null,
            manager_emp_id: request.manager_emp_id || null,
            is_active: request.is_active ?? true,
            dept_desc: request.dept_desc,
            create_user: 'current_user'
        };

        return this.http.post<any>(`${this.apiUrl}/create`, departmentData).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        dept_id: dept.dept_id,
                        dept_code: dept.dept_code,
                        dept_name: dept.dept_name,
                        dept_level: dept.dept_level,
                        parent_dept_id: dept.parent_dept_id,
                        manager_emp_id: dept.manager_emp_id,
                        is_active: dept.is_active,
                        dept_desc: dept.dept_desc,
                        create_time: dept.create_time ? new Date(dept.create_time) : new Date(),
                        create_user: dept.create_user,
                        update_time: dept.update_time ? new Date(dept.update_time) : undefined,
                        update_user: dept.update_user
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
                    const departmentIndex = this.mockDepartments.findIndex(dept => dept.dept_id === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    const existingDepartment = this.mockDepartments[departmentIndex];
                    const updatedDepartment: Department = {
                        ...existingDepartment,
                        ...request,
                        update_time: new Date(),
                        update_user: 'current_user'
                    };

                    this.mockDepartments[departmentIndex] = updatedDepartment;
                    this.departmentsSubject.next([...this.mockDepartments]);

                    return updatedDepartment;
                })
            );
        }

        // 後端 API 調用
        const updateData = {
            dept_id: id,
            dept_code: request.dept_code,
            dept_name: request.dept_name,
            dept_level: request.dept_level,
            parent_dept_id: request.parent_dept_id,
            manager_emp_id: request.manager_emp_id,
            is_active: request.is_active,
            dept_desc: request.dept_desc,
            update_user: 'current_user',
            update_time: new Date().toISOString()
        };

        return this.http.post<any>(`${this.apiUrl}/update`, updateData).pipe(
            map(response => {
                // 檢查後端回應格式
                if (response.code === 1000 && response.data) {
                    const dept = response.data;
                    return {
                        dept_id: dept.dept_id,
                        dept_code: dept.dept_code,
                        dept_name: dept.dept_name,
                        dept_level: dept.dept_level,
                        parent_dept_id: dept.parent_dept_id,
                        manager_emp_id: dept.manager_emp_id,
                        is_active: dept.is_active,
                        dept_desc: dept.dept_desc,
                        create_time: dept.create_time ? new Date(dept.create_time) : new Date(),
                        create_user: dept.create_user || 'system',
                        update_time: dept.update_time ? new Date(dept.update_time) : new Date(),
                        update_user: dept.update_user || 'system'
                    } as Department;
                } else if (response.code === 1000) {
                    // 成功但沒有回傳資料的情況，使用請求資料建構回傳
                    return {
                        dept_id: id,
                        dept_code: request.dept_code,
                        dept_name: request.dept_name,
                        dept_level: request.dept_level,
                        parent_dept_id: request.parent_dept_id,
                        manager_emp_id: request.manager_emp_id,
                        is_active: request.is_active,
                        dept_desc: request.dept_desc,
                        create_time: new Date(),
                        create_user: 'system',
                        update_time: new Date(),
                        update_user: 'current_user'
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
                    const departmentIndex = this.mockDepartments.findIndex(dept => dept.dept_id === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    // Soft delete by setting is_active to false
                    this.mockDepartments[departmentIndex] = {
                        ...this.mockDepartments[departmentIndex],
                        is_active: false,
                        update_time: new Date(),
                        update_user: 'current_user'
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
                return { ...dept, is_active: !dept.is_active };
            }),
            switchMap((toggled: Department) => this.updateDepartment(toggled.dept_id, {
                dept_id: toggled.dept_id,
                dept_code: toggled.dept_code,
                dept_name: toggled.dept_name,
                dept_level: toggled.dept_level,
                parent_dept_id: toggled.parent_dept_id,
                manager_emp_id: toggled.manager_emp_id,
                is_active: toggled.is_active
            }))
        );
    }

    /**
     * Get root departments (departments without parent)
     */
    getRootDepartments(): Observable<Department[]> {
        if (this.useMockData) {
            // 只回傳頂層且啟用的部門
            return of(this.mockDepartments.filter(dept => dept.parent_dept_id === null && dept.is_active === true)).pipe(delay(200));
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
                    dept.parent_dept_id === parentId && dept.is_active === true
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
                    return departments.filter(dept => dept.is_active === true)
                        .sort((a, b) => {
                            if (a.dept_level !== b.dept_level) {
                                const levelOrder = { 'BI': 1, 'BU': 2, 'DEPT': 3 };
                                return (levelOrder[a.dept_level as keyof typeof levelOrder] || 4) -
                                    (levelOrder[b.dept_level as keyof typeof levelOrder] || 4);
                            }
                            return a.dept_name.localeCompare(b.dept_name);
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
                        dept.dept_code.toLowerCase() === code.toLowerCase() &&
                        dept.dept_id !== excludeId
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
