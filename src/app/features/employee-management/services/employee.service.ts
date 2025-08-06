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
import { MOCK_EMPLOYEES } from '../services/mock-employees.data';
import { DepartmentService } from '../../department-management/services/department.service';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private readonly http = inject(HttpClient);
    private readonly httpErrorHandler = inject(HttpErrorHandlerService);
    private readonly apiUrl = `${environment.apiBaseUrl}/employees`;
    private mockEmployees: Employee[] = MOCK_EMPLOYEES;

    // 一鍵切換 mock data 和真實 API
    private readonly useMockData = false;
    private readonly departmentService = inject(DepartmentService);

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
        let allEmployees = [...this.mockEmployees];

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



    private getMockEmployeeById(id: number): Employee | null {
        return this.mockEmployees.find((emp: Employee) => emp.empId === id) || null;
    }

    private createMockEmployee(employeeData: EmployeeCreateDto): Employee {
        const newId = Math.max(...this.mockEmployees.map((e: Employee) => e.empId)) + 1;
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

    // private getDeptNameById(deptId: number): string {
    //     const deptMap: { [key: number]: string } = {
    //         1: '人力資源部',
    //         2: '財務部',
    //         3: '資訊部',
    //         4: '行銷部',
    //         5: '業務部'
    //     };
    //     return deptMap[deptId] || '未知部門';
    // }

    private getDeptNameById(deptId: number): string {
        if (this.useMockData) {
            const deptMap: { [key: number]: string } = {
                1: '人力資源部',
                2: '財務部',
                3: '資訊部',
                4: '行銷部',
                5: '業務部'
            };
            return deptMap[deptId] || '未知部門';
        }
        // API 模式下無法同步取得部門名稱，請於呼叫端處理 Observable
        return '';
    }
}
