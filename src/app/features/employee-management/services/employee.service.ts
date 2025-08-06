import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { camelToSnake } from '../../../core/utils/object-case.util';
import {
    Employee,
    EmployeeCreateDto,
    EmployeeUpdateDto,
    EmployeeSearchParams,
    ApiResponse
} from '../models/employee.model';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { MOCK_EMPLOYEES } from '../services/mock-employees.data';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService extends BaseQueryService<Employee, EmployeeSearchParams> {
    protected override readonly http = inject(HttpClient);
    protected override readonly httpErrorHandler = inject(HttpErrorHandlerService);
    protected override readonly apiUrl = `${environment.apiBaseUrl}/employees`;
    protected override readonly defaultSortColumn = 'empId';
    protected override readonly mockData: Employee[] = MOCK_EMPLOYEES;
    protected override readonly useMockData = false; // 切換到真實 API

    /**
     * 覆寫排序欄位映射：前端 camelCase -> 後端 snake_case
     * 使用自動轉換方式
     */
    protected override mapSortColumn(frontendColumn: string): string {
        if (!frontendColumn) {
            return this.defaultSortColumn;
        }
        return camelToSnake(frontendColumn);
    }

    /**
     * 建構自訂 API 參數 - 將 keyword 轉換為具體欄位搜尋
     */
    protected override buildCustomApiParams(params?: EmployeeSearchParams): Record<string, any> {
        const customParams: Record<string, any> = {};

        // 處理 keyword 搜尋 - 轉換為具體欄位，不傳送 keyword 本身
        if (params?.keyword) {
            const keyword = params.keyword.trim();
            if (keyword) {
                // 根據關鍵字特性決定搜尋策略
                if (/^[A-Z]{1,}\d+$/i.test(keyword)) {
                    // 如果看起來像員工代碼 (如 EMP001, DEV001)，搜尋 empCode
                    customParams['empCode'] = keyword;
                } else if (/^\d+$/.test(keyword)) {
                    // 如果是純數字，搜尋 empId
                    customParams['empId'] = parseInt(keyword, 10);
                } else if (keyword.includes('@')) {
                    // 如果包含 @，搜尋 empEmail
                    customParams['empEmail'] = keyword;
                } else {
                    // 否則搜尋員工姓名
                    customParams['empName'] = keyword;
                }
            }
        }

        // 處理其他具體搜尋欄位
        if (params?.empId !== undefined) {
            customParams['empId'] = params.empId;
        }

        if (params?.empCode) {
            customParams['empCode'] = params.empCode;
        }

        if (params?.empName) {
            customParams['empName'] = params.empName;
        }

        if (params?.empEmail) {
            customParams['empEmail'] = params.empEmail;
        }

        if (params?.deptId !== undefined) {
            customParams['deptId'] = params.deptId;
        }

        return customParams;
    }

    protected override applyMockFilters(data: Employee[], params?: EmployeeSearchParams): Employee[] {
        let filtered = [...data];

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

        if (params?.empCode) {
            filtered = filtered.filter(e => e.empCode.includes(params.empCode as string));
        }

        if (params?.empEmail) {
            filtered = filtered.filter(e => e.empEmail?.includes(params.empEmail as string));
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

    /**
     * 根據 ID 取得單一員工
     */
    getEmployeeById(id: number): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.getMockEmployeeById(id)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/find/${id}`)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('getEmployeeById', null))
            );
    }

    /**
     * 建立新員工
     */
    createEmployee(employeeData: EmployeeCreateDto): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.createMockEmployee(employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/create`, employeeData)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('createEmployee', null))
            );
    }

    /**
     * 更新員工資料
     */
    updateEmployee(id: number, employeeData: EmployeeUpdateDto): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.updateMockEmployee(id, employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/update`, {
            ...employeeData,
            empId: id
        })
            .pipe(
                map(response => response.data || null),
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

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { empId: id })
            .pipe(
                map(response => response.code === 1000),
                catchError(this.httpErrorHandler.handleError('deleteEmployee', false))
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
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('toggleEmployeeStatus', null))
            );
    }

    // Mock 資料處理方法
    private getMockEmployeeById(id: number): Employee | null {
        return this.mockData.find((emp: Employee) => emp.empId === id) || null;
    }

    private createMockEmployee(employeeData: EmployeeCreateDto): Employee {
        const newId = Math.max(...this.mockData.map((e: Employee) => e.empId)) + 1;
        const now = new Date().toISOString();

        return {
            empId: newId,
            empCode: employeeData.empCode,
            empName: employeeData.empName,
            empEmail: employeeData.empEmail,
            empPhone: employeeData.empPhone,
            deptId: employeeData.deptId,
            jobTitle: employeeData.jobTitle,
            hireDate: employeeData.hireDate,
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
            empEmail: employeeData.empEmail ?? existing.empEmail,
            empPhone: employeeData.empPhone ?? existing.empPhone,
            deptId: employeeData.deptId ?? existing.deptId,
            jobTitle: employeeData.jobTitle ?? existing.jobTitle,
            hireDate: employeeData.hireDate ?? existing.hireDate,
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
}
