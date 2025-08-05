import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, delay, catchError, switchMap } from 'rxjs';
import {
    Department,
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DepartmentListResponse,
    DepartmentLevel,
    ApiResponse,
    PagerDto,
    DepartmentSearchParams
} from '../models/department.model';
import {
    DEPARTMENT_LEVEL_ORDER,
    API_STATUS_CODES,
    PAGINATION_DEFAULTS,
    DepartmentStatusType
} from '../models/department.constants';
import { environment } from '../../../../environments/environment';
import { UserStore } from '../../../core/auth/user.store';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { MOCK_DEPARTMENTS } from '../services/mock-departments.data';

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

    private mockDepartments: Department[] = MOCK_DEPARTMENTS;
    // 使用 signals 替代 BehaviorSubject - 符合 Angular 19+ 規範
    private readonly departmentsSignal = signal<Department[]>(this.mockDepartments);
    public readonly departments = this.departmentsSignal.asReadonly();

    constructor() { }

    /**
     * Get current logged-in user's username
     */
    private getCurrentUser(): string {
        const currentUser = this.userStore.user();
        return currentUser?.username || 'system';
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
     * 統一的資料映射器 - HTTP 攔截器已處理 camelCase 轉換
     * 這裡主要用於 mock 資料或特殊情況的相容性處理
     */
    private mapApiToDepartment(apiDept: any): Department {
        // HTTP 攔截器已經處理 snake_case 到 camelCase 的轉換
        // 這裡主要確保資料格式的一致性
        return {
            deptId: apiDept.deptId ?? apiDept.dept_id,
            parentDeptId: apiDept.parentDeptId ?? apiDept.parent_dept_id ?? null,
            deptCode: apiDept.deptCode ?? apiDept.dept_code,
            deptName: apiDept.deptName ?? apiDept.dept_name,
            deptLevel: apiDept.deptLevel ?? apiDept.dept_level,
            managerEmpId: apiDept.managerEmpId ?? apiDept.manager_emp_id ?? null,
            isActive: apiDept.isActive ?? apiDept.is_active ?? false,
            deptDesc: apiDept.deptDesc ?? apiDept.dept_desc,
            createTime: apiDept.createTime ?? apiDept.create_time ?? new Date().toISOString(),
            createUser: apiDept.createUser ?? apiDept.create_user ?? 'system',
            updateTime: apiDept.updateTime ?? apiDept.update_time,
            updateUser: apiDept.updateUser ?? apiDept.update_user
        };
    }

    /**
     * 統一的 API 回應列表處理器
     */
    private mapApiResponseToList(response: ApiResponse<any[]>): Department[] {
        const data = this.handleApiResponse(response);
        return data.map(item => this.mapApiToDepartment(item));
    }

    /**
     * 統一的部門查詢方法 - 支援所有查詢需求
     * 支援分頁、排序、篩選，與employee service保持一致
     */
    getDepartments(
        page: number = PAGINATION_DEFAULTS.PAGE,
        pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
        searchTerm = '',
        filters: DepartmentSearchParams & {
            activeOnly?: boolean,
            rootOnly?: boolean,
            childrenOf?: number
        } = {},
        sortBy?: keyof Department,
        sortDirection?: 'ASC' | 'DESC'
    ): Observable<DepartmentListResponse> {
        if (this.useMockData) {
            return this.getMockDepartments(page, pageSize, searchTerm, filters, sortBy, sortDirection);
        }

        return this.getRealDepartmentsPaged(page, pageSize, searchTerm, filters, sortBy, sortDirection);
    }

    private getRealDepartmentsPaged(
        page: number,
        pageSize: number,
        searchTerm: string,
        filters: DepartmentSearchParams & {
            activeOnly?: boolean,
            rootOnly?: boolean,
            childrenOf?: number
        },
        sortBy?: keyof Department,
        sortDirection?: 'ASC' | 'DESC'
    ): Observable<DepartmentListResponse> {
        const firstIndex = (page - 1) * pageSize + 1;
        const lastIndex = page * pageSize;

        const requestParams = {
            page,
            pageSize,
            firstIndexInPage: firstIndex,
            lastIndexInPage: lastIndex,
            pageable: true,
            sortColumn: sortBy || 'deptCode',
            sortDirection: sortDirection?.toUpperCase() || 'ASC',
            ...(searchTerm && { keyword: searchTerm }),
            ...(filters.deptLevel && { deptLevel: filters.deptLevel }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(filters.parentDeptId !== undefined && { parentDeptId: filters.parentDeptId }),
            ...(filters.activeOnly && { isActive: true }),
            ...(filters.rootOnly && { parentDeptId: null }),
            ...(filters.childrenOf && { parentDeptId: filters.childrenOf })
        };

        return this.http.post<ApiResponse<PagerDto<Department>>>(`${this.apiUrl}/query`, requestParams)
            .pipe(
                map(response => this.adaptBackendResponse(response, page, pageSize)),
                catchError(this.httpErrorHandler.handleError('getDepartments', this.getEmptyDepartmentListResponse(page, pageSize)))
            );
    }

    private adaptBackendResponse(
        response: ApiResponse<PagerDto<Department>>,
        page: number,
        pageSize: number
    ): DepartmentListResponse {
        if (response.code !== 1000) {
            throw new Error(response.message || '查詢失敗');
        }

        const backendData = response.data;
        return {
            data: backendData.dataList || [],
            total: backendData.totalRecords || 0,
            page: page,
            pageSize: pageSize
        };
    }

    private getEmptyDepartmentListResponse(page: number, pageSize: number): DepartmentListResponse {
        return {
            data: [],
            total: 0,
            page: page,
            pageSize: pageSize
        };
    }

    /**
     * 簡化的活躍部門查詢 - 使用統一的 getDepartments 方法
     */
    getActiveDepartments(): Observable<Department[]> {
        return this.getDepartments(1, PAGINATION_DEFAULTS.MAX_PAGE_SIZE, '', { activeOnly: true }).pipe(
            map(response => response.data),
            catchError(this.httpErrorHandler.handleError('getActiveDepartments', []))
        );
    }

    /**
     * 簡化的根部門查詢 - 使用統一的 getDepartments 方法
     */
    getRootDepartments(): Observable<Department[]> {
        return this.getDepartments(1, PAGINATION_DEFAULTS.MAX_PAGE_SIZE, '', { rootOnly: true, activeOnly: true }).pipe(
            map(response => response.data),
            catchError(this.httpErrorHandler.handleError('getRootDepartments', []))
        );
    }

    /**
     * 簡化的子部門查詢 - 使用統一的 getDepartments 方法
     */
    getChildDepartments(parentId: number): Observable<Department[]> {
        return this.getDepartments(1, PAGINATION_DEFAULTS.MAX_PAGE_SIZE, '', { childrenOf: parentId, activeOnly: true }).pipe(
            map(response => response.data),
            catchError(this.httpErrorHandler.handleError('getChildDepartments', []))
        );
    }

    /**
     * 取得部門作為 Observable - 使用統一方法
     */
    getDepartmentsAsObservable(): Observable<Department[]> {

        if (this.useMockData) {
            const activeData = this.mockDepartments.filter(dept => dept.isActive);
            // 在 mock 模式下，返回所有活躍的部門資料
            return of(activeData).pipe(delay(100));
        }

        return this.getDepartments(1, PAGINATION_DEFAULTS.MAX_PAGE_SIZE, '', { activeOnly: true }).pipe(
            map(response => response.data),
            catchError(this.httpErrorHandler.handleError('getDepartmentsAsObservable', []))
        );
    }

    /**
     * 優化的 Mock 資料處理方法 - 支援排序功能
     */
    private getMockDepartments(
        page: number,
        pageSize: number,
        searchTerm: string,
        filters: DepartmentSearchParams & {
            activeOnly?: boolean,
            rootOnly?: boolean,
            childrenOf?: number
        },
        sortBy?: keyof Department,
        sortDirection?: 'ASC' | 'DESC'
    ): Observable<DepartmentListResponse> {
        return of(null).pipe(
            delay(300),
            map(() => {
                let filteredDepartments = [...this.mockDepartments];

                // Apply search filter
                if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    filteredDepartments = filteredDepartments.filter(dept =>
                        dept.deptName.toLowerCase().includes(term) ||
                        dept.deptCode.toLowerCase().includes(term)
                    );
                }

                // Apply filters
                if (filters.deptLevel) {
                    filteredDepartments = filteredDepartments.filter(dept => dept.deptLevel === filters.deptLevel);
                }

                if (filters.isActive !== undefined || filters.activeOnly) {
                    const targetStatus = filters.activeOnly || filters.isActive;
                    filteredDepartments = filteredDepartments.filter(dept => dept.isActive === targetStatus);
                }

                if (filters.parentDeptId !== undefined) {
                    filteredDepartments = filteredDepartments.filter(dept => dept.parentDeptId === filters.parentDeptId);
                }

                if (filters.rootOnly) {
                    filteredDepartments = filteredDepartments.filter(dept => dept.parentDeptId === null);
                }

                if (filters.childrenOf) {
                    filteredDepartments = filteredDepartments.filter(dept => dept.parentDeptId === filters.childrenOf);
                }

                // Apply sorting
                if (sortBy && sortDirection) {
                    filteredDepartments.sort((a, b) => {
                        let aValue: any = a[sortBy];
                        let bValue: any = b[sortBy];

                        // Handle different data types
                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            aValue = aValue.toLowerCase();
                            bValue = bValue.toLowerCase();
                        }

                        if (aValue < bValue) {
                            return sortDirection === 'ASC' ? -1 : 1;
                        }
                        if (aValue > bValue) {
                            return sortDirection === 'ASC' ? 1 : -1;
                        }
                        return 0;
                    });
                }

                // Calculate pagination
                const totalItems = filteredDepartments.length;
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

                return {
                    data: paginatedDepartments,
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
                catchError(this.httpErrorHandler.handleError('getDepartmentById', null))
            );
        }

        return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/find/${id}`).pipe(
            map(response => this.mapApiToDepartment(this.handleApiResponse(response))),
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
                    this.departmentsSignal.set([...this.mockDepartments]);

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
            map(response => this.mapApiToDepartment(this.handleApiResponse(response))),
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
                    this.departmentsSignal.set([...this.mockDepartments]);

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
            map(response => this.mapApiToDepartment(this.handleApiResponse(response))),
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

                    this.departmentsSignal.set([...this.mockDepartments]);
                    return true;
                }),
                catchError(this.httpErrorHandler.handleError('deleteDepartment', false))
            );
        }

        const deleteData = { dept_id: id };

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/delete`, deleteData).pipe(
            map(response => {
                this.handleApiResponse(response);
                return true;
            }),
            catchError(this.httpErrorHandler.handleError('deleteDepartment', false))
        );
    }

    /**
     * Toggle department active status
     */
    toggleDepartmentStatus(departmentId: number): Observable<Department> {
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
            catchError(this.httpErrorHandler.handleError('toggleDepartmentStatus', null as any))
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
                }),
                catchError(this.httpErrorHandler.handleError('isDepartmentCodeUnique', true))
            );
        }

        const params = excludeId ? `?code=${code}&excludeId=${excludeId}` : `?code=${code}`;

        return this.http.get<ApiResponse<{ isUnique: boolean }>>(`${this.apiUrl}/check-code${params}`).pipe(
            map(response => this.handleApiResponse(response).isUnique),
            catchError(this.httpErrorHandler.handleError('isDepartmentCodeUnique', true))
        );
    }
}
