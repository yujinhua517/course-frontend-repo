import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, delay, catchError, switchMap, forkJoin } from 'rxjs';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { camelToSnake } from '../../../core/utils/object-case.util';
import {
    Department,
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DepartmentListResponse,
    DepartmentLevel,
    ApiResponse,
    PagerDto,
    DepartmentSearchParams,
    DepartmentQueryOptions
} from '../models/department.model';
import {
    DEPARTMENT_LEVEL_ORDER,
    API_STATUS_CODES,
    DepartmentStatusType,
    SortDirection,
    SORT_DIRECTIONS
} from '../models/department.constants';
import { PAGINATION_DEFAULTS } from '../../../core/models/common.model';
import { QueryParamsBuilder } from '../../../core/utils/query.util';
import { environment } from '../../../../environments/environment';
import { UserStore } from '../../../core/auth/user.store';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { MOCK_DEPARTMENTS } from '../services/mock-departments.data';

@Injectable({
    providedIn: 'root'
})
export class DepartmentService extends BaseQueryService<Department, DepartmentSearchParams> {
    private userStore = inject(UserStore);

    // BaseQueryService 必需的屬性
    protected readonly apiUrl = `${environment.apiBaseUrl}/departments`;
    protected readonly useMockData = false;
    protected readonly defaultSortColumn = 'deptId';
    protected readonly mockData: Department[] = MOCK_DEPARTMENTS;

    // 使用 signals 替代 BehaviorSubject - 符合 Angular 19+ 規範
    private readonly departmentsSignal = signal<Department[]>(this.mockData);
    public readonly departments = this.departmentsSignal.asReadonly();

    constructor() {
        super();
    }

    /**
     * 覆寫排序欄位映射：前端 camelCase -> 後端 snake_case
     * 使用自動轉換方式
     */
    protected override mapSortColumn(frontendColumn?: string): string {
        if (!frontendColumn) {
            return this.defaultSortColumn;
        }
        return camelToSnake(frontendColumn);
    }

    /**
     * 實作Mock資料篩選邏輯
     */
    protected override applyMockFilters(data: Department[], params?: DepartmentSearchParams): Department[] {
        let filtered = [...data];

        // 關鍵字搜尋
        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(dept =>
                dept.deptCode.toLowerCase().includes(keyword) ||
                dept.deptName.toLowerCase().includes(keyword)
            );
        }

        // 啟用狀態篩選
        if (params?.isActive !== undefined) {
            filtered = filtered.filter(dept => dept.isActive === params.isActive);
        }

        // 部門層級篩選
        if (params?.deptLevel) {
            filtered = filtered.filter(dept => dept.deptLevel === params.deptLevel);
        }

        // 上級部門篩選
        if (params?.parentDeptId !== undefined) {
            filtered = filtered.filter(dept => dept.parentDeptId === params.parentDeptId);
        }

        // 部門代碼篩選
        if (params?.deptCode) {
            filtered = filtered.filter(dept =>
                dept.deptCode.toLowerCase().includes(params.deptCode!.toLowerCase())
            );
        }

        // 部門名稱篩選
        if (params?.deptName) {
            filtered = filtered.filter(dept =>
                dept.deptName.toLowerCase().includes(params.deptName!.toLowerCase())
            );
        }

        return filtered;
    }

    /**
     * 建構自訂API參數 - 將 keyword 轉換為具體欄位搜尋
     */
    protected override buildCustomApiParams(params?: DepartmentSearchParams): Record<string, any> {
        const customParams: Record<string, any> = {};

        // 處理 keyword 搜尋 - 轉換為具體欄位，不傳送 keyword 本身
        if (params?.keyword) {
            const keyword = params.keyword.trim();
            if (keyword) {
                // 根據關鍵字特性決定搜尋策略
                if (/^[A-Z]{2,}\d+$/i.test(keyword)) {
                    // 如果看起來像部門代碼 (如 IT001, HR001)，搜尋 deptCode
                    customParams['deptCode'] = keyword;
                } else if (/^\d+$/.test(keyword)) {
                    // 如果是純數字，搜尋 deptId
                    customParams['deptId'] = parseInt(keyword, 10);
                } else {
                    // 否則搜尋部門名稱
                    customParams['deptName'] = keyword;
                }
            }
        }

        // 處理其他具體搜尋欄位
        if (params?.deptLevel) {
            customParams['deptLevel'] = params.deptLevel;
        }

        if (params?.parentDeptId !== undefined) {
            customParams['parentDeptId'] = params.parentDeptId;
        }

        if (params?.deptCode) {
            customParams['deptCode'] = params.deptCode;
        }

        if (params?.deptName) {
            customParams['deptName'] = params.deptName;
        }

        if (params?.managerEmpId) {
            customParams['managerEmpId'] = params.managerEmpId;
        }

        return customParams;
    }

    /**
     * Get current logged-in user's username
     */
    private getCurrentUser(): string {
        const currentUser = this.userStore.user();
        // return currentUser?.username || 'system';
        return currentUser?.username || 'noname';
    }

    /**
     * 統一的 API 回應處理器
     * 確保所有 API 調用都使用相同的錯誤處理邏輯
     */
    private handleApiResponse<T>(response: ApiResponse<T>): T {
        if (response.code === API_STATUS_CODES.SUCCESS && response.data) {
            return response.data;
        }
        throw new Error(response.message || '操作失敗');
    }

    /**
     * 統一的部門查詢方法 - 使用 BaseQueryService 統一模式
     */
    getDepartments(options: DepartmentQueryOptions = {}): Observable<DepartmentListResponse> {
        const searchParams: DepartmentSearchParams = {
            ...options.filters,
            keyword: options.searchTerm,
            page: options.page || PAGINATION_DEFAULTS.PAGE,
            pageSize: options.pageSize || PAGINATION_DEFAULTS.PAGE_SIZE,
            sortColumn: this.mapSortColumn(options.sort?.field),
            sortDirection: options.sort?.direction?.toUpperCase() as 'ASC' | 'DESC' || 'ASC'
        };

        return this.getPagedData(searchParams) as Observable<DepartmentListResponse>;
    }

    /**
     * 取得活躍部門 - 使用統一的查詢方法
     */
    getActiveDepartments(): Observable<Department[]> {
        return this.getDepartments({
            page: 1,
            pageSize: PAGINATION_DEFAULTS.MAX_PAGE_SIZE,
            filters: { activeOnly: true }
        }).pipe(
            map(response => response.data.dataList),
            catchError(this.httpErrorHandler.handleError('getActiveDepartments', []))
        );
    }

    /**
     * 取得根部門 - 使用統一的查詢方法
     */
    getRootDepartments(): Observable<Department[]> {
        return this.getDepartments({
            page: 1,
            pageSize: PAGINATION_DEFAULTS.MAX_PAGE_SIZE,
            filters: { rootOnly: true, activeOnly: true }
        }).pipe(
            map(response => response.data.dataList),
            catchError(this.httpErrorHandler.handleError('getRootDepartments', []))
        );
    }

    /**
     * 取得子部門 - 使用統一的查詢方法
     */
    getChildDepartments(parentId: number): Observable<Department[]> {
        return this.getDepartments({
            page: 1,
            pageSize: PAGINATION_DEFAULTS.MAX_PAGE_SIZE,
            filters: { parentId, activeOnly: true }
        }).pipe(
            map(response => response.data),
            catchError(this.httpErrorHandler.handleError('getChildDepartments', []))
        );
    }

    /**
     * Get a single department by ID
     */
    getDepartmentById(id: number): Observable<Department | null> {
        if (this.useMockData) {
            return of(this.mockData).pipe(
                delay(200),
                map(departments => departments.find(dept => dept.deptId === id) || null),
                catchError(this.httpErrorHandler.handleError('getDepartmentById', null))
            );
        }

        return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/find/${id}`).pipe(
            map(response => this.handleApiResponse(response)),
            catchError(this.httpErrorHandler.handleError('getDepartmentById', null))
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
                        deptId: Math.max(...this.mockData.map(d => d.deptId)) + 1,
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

                    this.mockData.push(newDepartment);
                    this.departmentsSignal.set([...this.mockData]);

                    return newDepartment;
                }),
                catchError(this.httpErrorHandler.handleError('createDepartment', null as any))
            );
        }

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

        return this.http.post<ApiResponse<Department>>(`${this.apiUrl}/create`, departmentData).pipe(
            map(response => this.handleApiResponse(response)),
            catchError(this.httpErrorHandler.handleError('createDepartment', null as any))
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
                    const departmentIndex = this.mockData.findIndex(dept => dept.deptId === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    const currentUser = this.getCurrentUser();
                    const existingDepartment = this.mockData[departmentIndex];
                    const updatedDepartment: Department = {
                        ...existingDepartment,
                        ...request,
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    };

                    this.mockData[departmentIndex] = updatedDepartment;
                    this.departmentsSignal.set([...this.mockData]);

                    return updatedDepartment;
                }),
                catchError(this.httpErrorHandler.handleError('updateDepartment', null as any))
            );
        }

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

        return this.http.post<ApiResponse<Department>>(`${this.apiUrl}/update`, updateData).pipe(
            map(response => this.handleApiResponse(response)),
            catchError(this.httpErrorHandler.handleError('updateDepartment', null as any))
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
                    const departmentIndex = this.mockData.findIndex(dept => dept.deptId === id);
                    if (departmentIndex === -1) {
                        throw new Error(`Department with id ${id} not found`);
                    }

                    const currentUser = this.getCurrentUser();
                    // Soft delete by setting is_active to false
                    this.mockData[departmentIndex] = {
                        ...this.mockData[departmentIndex],
                        isActive: false,
                        updateTime: new Date().toISOString(),
                        updateUser: currentUser
                    };

                    this.departmentsSignal.set([...this.mockData]);
                    return true;
                }),
                catchError(this.httpErrorHandler.handleError('deleteDepartment', false))
            );
        }

        const deleteData = { deptId: id };

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/delete`, deleteData).pipe(
            map(response => {
                this.handleApiResponse(response);
                return true;
            }),
            catchError(this.httpErrorHandler.handleError('deleteDepartment', false))
        );
    }

    /**
     * 批量刪除部門 (後端目前無此 API，使用逐一刪除方式)
     */
    bulkDeleteDepartments(ids: number[]): Observable<boolean> {
        if (this.useMockData) {
            return of(null).pipe(
                delay(800),
                map(() => {
                    const currentUser = this.getCurrentUser();
                    ids.forEach(id => {
                        const departmentIndex = this.mockData.findIndex(dept => dept.deptId === id);
                        if (departmentIndex !== -1) {
                            this.mockData[departmentIndex] = {
                                ...this.mockData[departmentIndex],
                                isActive: false,
                                updateTime: new Date().toISOString(),
                                updateUser: currentUser
                            };
                        }
                    });
                    this.departmentsSignal.set([...this.mockData]);
                    return true;
                }),
                catchError(this.httpErrorHandler.handleError('bulkDeleteDepartments', false))
            );
        }

        // 由於後端目前沒有 bulk-delete API，使用逐一刪除方式
        const deleteRequests = ids.map(id =>
            this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/delete`, { deptId: id })
                .pipe(
                    map(response => response.code === 1000),
                    catchError(() => of(false))
                )
        );

        return forkJoin(deleteRequests).pipe(
            map((results: boolean[]) => results.every(result => result === true)),
            catchError(this.httpErrorHandler.handleError('bulkDeleteDepartments', false))
        );
    }

    /**
     * Toggle department active status
     */
    toggleActiveStatus(departmentId: number): Observable<Department> {
        return this.getDepartmentById(departmentId).pipe(
            switchMap((dept: Department | null) => {
                if (!dept) throw new Error(`Department with id ${departmentId} not found`);

                return this.updateDepartment(dept.deptId, {
                    deptId: dept.deptId,
                    deptCode: dept.deptCode,
                    deptName: dept.deptName,
                    deptLevel: dept.deptLevel,
                    parentDeptId: dept.parentDeptId,
                    managerEmpId: dept.managerEmpId,
                    isActive: !dept.isActive
                });
            }),
            catchError(this.httpErrorHandler.handleError('toggleActiveStatus', null as any))
        );
    }

    /**
     * Toggle department active status (別名，保持向後相容)
     */
    toggleDepartmentStatus(departmentId: number): Observable<Department> {
        return this.toggleActiveStatus(departmentId);
    }

    /**
     * Check if department code is unique (使用前端邏輯檢查)
     */
    isDepartmentCodeUnique(code: string, excludeId?: number): Observable<boolean> {
        // 使用現有的部門查詢來檢查唯一性
        return this.getActiveDepartments().pipe(
            map((departments: Department[]) => {
                const existingDept = departments.find((dept: Department) =>
                    dept.deptCode.toLowerCase() === code.toLowerCase() &&
                    dept.deptId !== excludeId
                );
                return !existingDept;
            }),
            catchError(this.httpErrorHandler.handleError('isDepartmentCodeUnique', true))
        );
    }
}
