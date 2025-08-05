import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
    Employee,
    EmployeeCreateDto,
    EmployeeUpdateDto,
    EmployeeSearchParams,
    ApiResponse,
    PagerDto
} from '../models/employee.model';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private readonly http = inject(HttpClient);
    private readonly httpErrorHandler = inject(HttpErrorHandlerService);
    private readonly apiUrl = `${environment.apiBaseUrl}/employees`;

    // 一鍵切換 mock data 和真實 API
    private readonly useMockData = false;

    /**
     * 查詢員工列表 - 支援分頁、排序、篩選
     * @param params 搜尋參數
     * @returns 員工列表分頁結果
     */
    getEmployees(params?: EmployeeSearchParams): Observable<PagerDto<Employee>> {
        if (this.useMockData) {
            return this.getMockEmployeesPaged(params);
        }

        return this.getRealEmployeesPaged(params);
    }

    private getMockEmployeesPaged(params?: EmployeeSearchParams): Observable<PagerDto<Employee>> {
        let allEmployees = this.getMockEmployeeList().dataList;

        // 應用篩選條件
        allEmployees = this.applyFilters(allEmployees, params);

        // 應用排序
        allEmployees = this.applySorting(allEmployees, params);

        // 應用分頁
        const { page = 1, pageSize = 10 } = params || {};
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pagedData = allEmployees.slice(start, end);

        return of({
            dataList: pagedData,
            totalRecords: allEmployees.length,
            firstIndexInPage: start + 1,
            lastIndexInPage: Math.min(end, allEmployees.length),
            pageable: true,
            sortColumn: params?.sortColumn ?? 'empCode',
            sortDirection: params?.sortDirection ?? 'ASC'
        }).pipe(delay(300));
    }

    private applyFilters(employees: Employee[], params?: EmployeeSearchParams): Employee[] {
        let filtered = [...employees];

        if (params?.deptId !== undefined) {
            filtered = filtered.filter(e => e.deptId === params.deptId);
        }

        if (params?.isActive !== undefined) {
            const targetStatus = Boolean(params.isActive);
            filtered = filtered.filter(e => Boolean(e.isActive) === targetStatus);
        }

        if (params?.empName) {
            filtered = filtered.filter(e => e.empName.includes(params.empName as string));
        }

        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(e =>
                e.empName.toLowerCase().includes(keyword) ||
                e.empCode.toLowerCase().includes(keyword) ||
                (e.empEmail && e.empEmail.toLowerCase().includes(keyword))
            );
        }

        return filtered;
    }

    private applySorting(employees: Employee[], params?: EmployeeSearchParams): Employee[] {
        if (!params?.sortColumn || !params?.sortDirection) {
            return employees;
        }

        return [...employees].sort((a, b) => {
            const aValue = (a as any)[params.sortColumn!];
            const bValue = (b as any)[params.sortColumn!];

            if (aValue === undefined || bValue === undefined) return 0;

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;

            return params.sortDirection === 'DESC' ? -comparison : comparison;
        });
    }

    private getRealEmployeesPaged(params?: EmployeeSearchParams): Observable<PagerDto<Employee>> {
        const { page = 1, pageSize = 10 } = params || {};
        const firstIndex = (page - 1) * pageSize + 1;
        const lastIndex = page * pageSize;

        const requestParams = {
            page,
            pageSize,
            firstIndexInPage: firstIndex,
            lastIndexInPage: lastIndex,
            pageable: true,
            sortColumn: params?.sortColumn || 'empCode',
            sortDirection: params?.sortDirection || 'ASC',
            ...(params?.keyword && { keyword: params.keyword }),
            ...(params?.isActive !== undefined && { isActive: params.isActive }),
            ...(params?.deptId && { deptId: params.deptId }),
            ...(params?.empName && { empName: params.empName }),
            ...(params?.empCode && { empCode: params.empCode }),
            ...(params?.empEmail && { empEmail: params.empEmail })
        };

        return this.http.post<ApiResponse<PagerDto<Employee>>>(`${this.apiUrl}/query`, requestParams)
            .pipe(
                map(response => this.adaptBackendResponse(response, firstIndex, lastIndex)),
                catchError(this.httpErrorHandler.handleError('getEmployees', this.getEmptyPagerDto()))
            );
    }

    private adaptBackendResponse(
        response: ApiResponse<PagerDto<Employee>>,
        firstIndex: number,
        lastIndex: number
    ): PagerDto<Employee> {
        if (response.code !== 1000) {
            throw new Error(response.message || '查詢失敗');
        }

        const backendData = response.data;
        return {
            dataList: backendData.dataList,
            totalRecords: backendData.totalRecords,
            firstIndexInPage: firstIndex,
            lastIndexInPage: Math.min(lastIndex, backendData.totalRecords),
            pageable: backendData.pageable,
            sortColumn: backendData.sortColumn,
            sortDirection: backendData.sortDirection
        };
    }

    private getEmptyPagerDto(): PagerDto<Employee> {
        return {
            dataList: [],
            totalRecords: 0,
            firstIndexInPage: 0,
            lastIndexInPage: 0,
            pageable: true
        };
    }

    /**
     * 根據 ID 取得單一員工
     */
    getEmployeeById(id: number): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.getMockEmployeeById(id)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`)
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('getEmployeeById', null))
            );
    }

    /**
     * 建立新員工
     */
    createEmployee(employeeData: EmployeeCreateDto): Observable<Employee> {
        if (this.useMockData) {
            return of(this.createMockEmployee(employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/create`, employeeData)
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('createEmployee', null))
            );
    }

    /**
     * 更新員工資料
     */
    updateEmployee(id: number, employeeData: EmployeeUpdateDto): Observable<Employee> {
        if (this.useMockData) {
            return of(this.updateMockEmployee(id, employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/update`, {
            ...employeeData,
            empId: id
        })
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('updateEmployee', null))
            );
    }

    /**
     * 刪除員工
     */
    deleteEmployee(id: number): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(400));
        }

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/delete`, { empId: id })
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('deleteEmployee', false))
            );
    }

    /**
     * 批量刪除員工
     */
    bulkDeleteEmployees(ids: number[]): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(800));
        }

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/bulk-delete`, { empIds: ids })
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('bulkDeleteEmployees', false))
            );
    }

    /**
     * 切換員工啟用狀態
     */
    toggleActiveStatus(id: number): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.toggleMockEmployeeStatus(id)).pipe(delay(500));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/toggle-status`, { empId: id })
            .pipe(
                map(response => response.data),
                catchError(this.httpErrorHandler.handleError('toggleEmployeeStatus', null))
            );
    }

    // Mock 資料方法 - 用於開發階段
    private getMockEmployeeList(): PagerDto<Employee> {
        const mockEmployees: Employee[] = [
            {
                empId: 1,
                empCode: 'EMP001',
                empName: '林泰安',
                empEmail: 'an.lin@example.com',
                empPhone: '0911222333',
                deptId: 1,
                jobTitle: '企業策略長',
                hireDate: '2021-09-01',
                resignDate: null,
                isActive: true,
                createTime: '2024-01-10T08:10:00',
                createUser: 'sysadmin',
                updateTime: '2024-06-01T09:05:00',
                updateUser: 'sysadmin',
                deptName: '企業發展事業群'
            },
            {
                empId: 2,
                empCode: 'EMP002',
                empName: '張偉翔',
                empEmail: 'will.zhang@example.com',
                empPhone: '0922123456',
                deptId: 2,
                jobTitle: '技術長',
                hireDate: '2022-01-15',
                resignDate: null,
                isActive: true,
                createTime: '2024-01-12T09:20:00',
                createUser: 'sysadmin',
                updateTime: '2024-06-03T10:00:00',
                updateUser: 'sysadmin',
                deptName: '技術策略事業群'
            },
            {
                empId: 3,
                empCode: 'EMP003',
                empName: '蘇怡君',
                empEmail: 'yijun.su@example.com',
                empPhone: '0919111222',
                deptId: 3,
                jobTitle: '營運總監',
                hireDate: '2023-05-20',
                resignDate: null,
                isActive: true,
                createTime: '2024-02-01T10:15:00',
                createUser: 'admin1',
                updateTime: '2024-06-08T08:45:00',
                updateUser: 'admin1',
                deptName: '營運管理中心'
            },
            {
                empId: 4,
                empCode: 'EMP004',
                empName: '高家豪',
                empEmail: 'hao.gao@example.com',
                empPhone: '0933122999',
                deptId: 4,
                jobTitle: '業務主管',
                hireDate: '2022-03-12',
                resignDate: null,
                isActive: true,
                createTime: '2024-02-02T13:40:00',
                createUser: 'admin2',
                updateTime: '2024-06-10T14:20:00',
                updateUser: 'admin2',
                deptName: '銷售服務中心'
            },
            {
                empId: 5,
                empCode: 'EMP005',
                empName: '許惠玲',
                empEmail: 'ling.hsueh@example.com',
                empPhone: '0966555777',
                deptId: 5,
                jobTitle: '研發經理',
                hireDate: '2021-11-01',
                resignDate: null,
                isActive: true,
                createTime: '2024-02-03T11:50:00',
                createUser: 'admin3',
                updateTime: '2024-06-11T15:00:00',
                updateUser: 'admin3',
                deptName: '工程研發中心'
            },
            {
                empId: 6,
                empCode: 'EMP006',
                empName: '吳志軒',
                empEmail: 'chihsuan.wu@example.com',
                empPhone: '0977122334',
                deptId: 6,
                jobTitle: '品質總監',
                hireDate: '2022-06-08',
                resignDate: null,
                isActive: true,
                createTime: '2024-02-04T15:35:00',
                createUser: 'admin4',
                updateTime: '2024-06-12T16:30:00',
                updateUser: 'admin4',
                deptName: '品質管理中心'
            },
            {
                empId: 7,
                empCode: 'EMP007',
                empName: '鄭佳珊',
                empEmail: 'jshan.cheng@example.com',
                empPhone: '0910112233',
                deptId: 7,
                jobTitle: '客服專員',
                hireDate: '2023-02-10',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-01T09:00:00',
                createUser: 'ops_mgr',
                updateTime: '2024-07-01T09:30:00',
                updateUser: 'ops_mgr',
                deptName: '客服組'
            },
            {
                empId: 8,
                empCode: 'EMP008',
                empName: '王柏廷',
                empEmail: 'po.wang@example.com',
                empPhone: '0988654321',
                deptId: 8,
                jobTitle: '採購主任',
                hireDate: '2021-10-20',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-02T10:10:00',
                createUser: 'ops_mgr',
                updateTime: '2024-07-01T10:15:00',
                updateUser: 'ops_mgr',
                deptName: '採購組'
            },
            {
                empId: 9,
                empCode: 'EMP009',
                empName: '林家宏',
                empEmail: 'chiahong.lin@example.com',
                empPhone: '0912123456',
                deptId: 9,
                jobTitle: '國內業務',
                hireDate: '2023-07-11',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-03T11:20:00',
                createUser: 'sale_mgr',
                updateTime: '2024-07-01T11:25:00',
                updateUser: 'sale_mgr',
                deptName: '國內銷售組'
            },
            {
                empId: 10,
                empCode: 'EMP010',
                empName: '葉欣怡',
                empEmail: 'hsinyi.yeh@example.com',
                empPhone: '0933987654',
                deptId: 10,
                jobTitle: '國際業務',
                hireDate: '2022-05-19',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-04T12:30:00',
                createUser: 'sale_mgr',
                updateTime: '2024-07-01T12:35:00',
                updateUser: 'sale_mgr',
                deptName: '國際銷售組'
            },
            {
                empId: 11,
                empCode: 'EMP011',
                empName: '曾國凱',
                empEmail: 'kuokai.tseng@example.com',
                empPhone: '0977111222',
                deptId: 11,
                jobTitle: '後端工程師',
                hireDate: '2021-09-13',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-05T13:40:00',
                createUser: 'eng_mgr',
                updateTime: '2024-07-01T13:45:00',
                updateUser: 'eng_mgr',
                deptName: '後端開發組'
            },
            {
                empId: 12,
                empCode: 'EMP012',
                empName: '陳韋廷',
                empEmail: 'weitin.chen@example.com',
                empPhone: '0922233445',
                deptId: 12,
                jobTitle: '前端工程師',
                hireDate: '2022-08-08',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-06T14:50:00',
                createUser: 'eng_mgr',
                updateTime: '2024-07-01T14:55:00',
                updateUser: 'eng_mgr',
                deptName: '前端開發組'
            },
            {
                empId: 13,
                empCode: 'EMP013',
                empName: '賴信瑋',
                empEmail: 'shinwei.lai@example.com',
                empPhone: '0910666777',
                deptId: 13,
                jobTitle: '測試工程師',
                hireDate: '2023-01-15',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-07T15:10:00',
                createUser: 'qa_mgr',
                updateTime: '2024-07-01T15:20:00',
                updateUser: 'qa_mgr',
                deptName: '軟體測試組'
            },
            {
                empId: 14,
                empCode: 'EMP014',
                empName: '簡雅婷',
                empEmail: 'yating.jian@example.com',
                empPhone: '0918999888',
                deptId: 14,
                jobTitle: '品管稽核員',
                hireDate: '2023-12-25',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-08T16:30:00',
                createUser: 'qa_mgr',
                updateTime: '2024-07-01T16:40:00',
                updateUser: 'qa_mgr',
                deptName: '品管稽核組'
            },
            {
                empId: 15,
                empCode: 'EMP015',
                empName: '許榮華',
                empEmail: 'jung.hua.hsu@example.com',
                empPhone: '0910222999',
                deptId: 15,
                jobTitle: '風險分析師',
                hireDate: '2022-04-01',
                resignDate: '2024-06-10',
                isActive: false,
                createTime: '2024-03-09T17:00:00',
                createUser: 'ops_mgr',
                updateTime: '2024-07-02T17:10:00',
                updateUser: 'ops_mgr',
                deptName: '風險控管組'
            },
            {
                empId: 16,
                empCode: 'EMP016',
                empName: '葉姿君',
                empEmail: 'zijun.yeh@example.com',
                empPhone: '0922112233',
                deptId: 16,
                jobTitle: '行銷專員',
                hireDate: '2023-06-22',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-10T18:20:00',
                createUser: 'sale_mgr',
                updateTime: '2024-07-02T18:30:00',
                updateUser: 'sale_mgr',
                deptName: '行銷推廣組'
            },
            {
                empId: 17,
                empCode: 'EMP017',
                empName: '鄧宜樺',
                empEmail: 'yi.hua.teng@example.com',
                empPhone: '0910223555',
                deptId: 17,
                jobTitle: 'UX設計師',
                hireDate: '2022-10-05',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-11T19:00:00',
                createUser: 'eng_mgr',
                updateTime: '2024-07-02T19:10:00',
                updateUser: 'eng_mgr',
                deptName: 'UX設計組'
            },
            {
                empId: 18,
                empCode: 'EMP018',
                empName: '方承睿',
                empEmail: 'cheng.jui.fang@example.com',
                empPhone: '0933444111',
                deptId: 18,
                jobTitle: '自動化測試工程師',
                hireDate: '2023-09-01',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-12T20:00:00',
                createUser: 'qa_mgr',
                updateTime: '2024-07-02T20:10:00',
                updateUser: 'qa_mgr',
                deptName: '自動化測試組'
            },
            {
                empId: 19,
                empCode: 'EMP019',
                empName: '廖立文',
                empEmail: 'liwen.liao@example.com',
                empPhone: '0919555333',
                deptId: 19,
                jobTitle: '技術寫手',
                hireDate: '2021-05-18',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-13T21:00:00',
                createUser: 'eng_mgr',
                updateTime: '2024-07-02T21:10:00',
                updateUser: 'eng_mgr',
                deptName: '技術文件組'
            },
            {
                empId: 20,
                empCode: 'EMP020',
                empName: '林品妤',
                empEmail: 'pin.yu.lin@example.com',
                empPhone: '0988777333',
                deptId: 20,
                jobTitle: '支援專員',
                hireDate: '2024-01-04',
                resignDate: null,
                isActive: true,
                createTime: '2024-03-14T22:00:00',
                createUser: 'ops_mgr',
                updateTime: '2024-07-02T22:10:00',
                updateUser: 'ops_mgr',
                deptName: '支援服務組'
            }
        ];

        return {
            dataList: mockEmployees,
            totalRecords: mockEmployees.length,
            firstIndexInPage: 1,
            lastIndexInPage: mockEmployees.length,
            pageable: true,
            sortColumn: 'empCode',
            sortDirection: 'ASC'
        };
    }

    private getMockEmployeeById(id: number): Employee | null {
        const mockData = this.getMockEmployeeList();
        return mockData.dataList.find((emp: Employee) => emp.empId === id) || null;
    }

    private createMockEmployee(employeeData: EmployeeCreateDto): Employee {
        const newId = Math.max(...this.getMockEmployeeList().dataList.map((e: Employee) => e.empId)) + 1;
        const now = new Date().toISOString();

        return {
            empId: newId,
            empCode: employeeData.empCode,
            empName: employeeData.empName,
            deptId: employeeData.deptId,
            deptName: this.getDeptNameById(employeeData.deptId),
            isActive: employeeData.isActive ?? true,
            createTime: now,
            createUser: 'current_user',
            updateTime: now,
            updateUser: 'current_user'
        };
    }

    private updateMockEmployee(id: number, employeeData: EmployeeUpdateDto): Employee {
        const existing = this.getMockEmployeeById(id);
        if (!existing) {
            throw new Error('Employee not found');
        }

        return {
            ...existing,
            empCode: employeeData.empCode ?? existing.empCode,
            empName: employeeData.empName ?? existing.empName,
            deptId: employeeData.deptId ?? existing.deptId,
            deptName: employeeData.deptId ? this.getDeptNameById(employeeData.deptId) : existing.deptName,
            isActive: employeeData.isActive ?? existing.isActive,
            updateTime: new Date().toISOString(),
            updateUser: 'current_user'
        };
    }

    private toggleMockEmployeeStatus(id: number): Employee | null {
        const existing = this.getMockEmployeeById(id);
        if (!existing) {
            return null;
        }

        return {
            ...existing,
            isActive: !existing.isActive,
            updateTime: new Date().toISOString(),
            updateUser: 'current_user'
        };
    }

    private getDeptNameById(deptId: number): string {
        const deptMap: { [key: number]: string } = {
            1: '人力資源部',
            2: '財務部',
            3: '資訊部',
            4: '行銷部',
            5: '業務部'
        };
        return deptMap[deptId] || '未知部門';
    }
}
