import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
import { UserStore } from '../../../core/auth/user.store';

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

    private userStore = inject(UserStore);

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
                // 1. 判斷是否為工號（至少一個字母 + 至少一個數字）
                if (/^[A-Za-z]{1,}\d+$/.test(keyword)) {
                    customParams['empCode'] = keyword;

                    // 2. 判斷是否為 empId（純數字，且長度 <= 10 避免誤判電話）
                } else if (/^\d{1,10}$/.test(keyword)) {
                    customParams['empId'] = parseInt(keyword, 10);

                    // 3. 判斷是否為 Email（比較嚴謹的格式檢查）
                } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(keyword)) {
                    customParams['empEmail'] = keyword;

                    // 4. 判斷是否為台灣手機號碼（09 開頭 + 8 位數字）
                } else if (/^09\d{8}$/.test(keyword)) {
                    customParams['empPhone'] = keyword;

                    // 5. 判斷是否為日期（yyyy-mm-dd）
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(keyword)) {
                    customParams['hireDate'] = keyword;

                    // 6. 預設搜尋姓名
                } else {
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

        // 自動補上 createUser
        const createPayload = {
            ...employeeData,
            createUser: this.userStore.user()?.username
        };

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/create`, createPayload)
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

        // 自動補上 updateUser
        const updatePayload = {
            ...employeeData,
            empId: id,
            updateUser: this.userStore.user()?.username
        };

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/update`, updatePayload)
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
     * 批量刪除員工 (後端目前無此 API，使用逐一刪除方式)
     */
    bulkDeleteEmployees(ids: number[]): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(800));
        }

        // 由於後端目前沒有 bulk-delete API，使用逐一刪除方式
        const deleteRequests = ids.map(id =>
            this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { empId: id })
                .pipe(
                    map(response => response.code === 1000),
                    catchError(() => of(false))
                )
        );

        return forkJoin(deleteRequests).pipe(
            map((results: boolean[]) => results.every(result => result === true)),
            catchError(this.httpErrorHandler.handleError('bulkDeleteEmployees', false))
        );
    }

    /**
     * 切換員工啟用狀態 - 使用直接 API 調用避免併發問題
     */
    toggleActiveStatus(id: number): Observable<Employee | null> {
        console.group('[EmployeeService] toggleActiveStatus');
        console.debug('Step 1: input id =', id);
        if (this.useMockData) {
            console.debug('Step 2: useMockData = true, call toggleMockEmployeeStatus');
            const result = of(this.toggleMockEmployeeStatus(id)).pipe(delay(500));
            console.debug('Step 3: mock result Observable =', result);
            console.groupEnd();
            return result;
        }

        // 直接調用後端的切換 API，讓後端處理狀態邏輯
        const user = this.userStore.user();
        const togglePayload = {
            empId: id,
            updateUser: user?.username
        };

        console.debug('Step 2: togglePayload =', togglePayload);

        const obs = this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/toggle-status`, togglePayload)
            .pipe(
                map(response => {
                    console.debug('Step 3: API response =', response);
                    return response.data || null;
                }),
                catchError(err => {
                    console.error('Step 4: API error =', err);
                    // 如果後端沒有 toggle-status API，回退到原來的方式
                    if (err.status === 404) {
                        console.debug('Step 5: Fallback to get-then-update approach');
                        return this.getEmployeeById(id).pipe(
                            switchMap((employee: Employee | null) => {
                                if (!employee) {
                                    throw new Error('Employee not found');
                                }

                                const updateDto = {
                                    empId: id,
                                    empCode: employee.empCode,
                                    empName: employee.empName,
                                    empEmail: employee.empEmail,
                                    empPhone: employee.empPhone,
                                    deptId: employee.deptId,
                                    jobTitle: employee.jobTitle,
                                    hireDate: employee.hireDate,
                                    isActive: !employee.isActive,
                                    updateUser: user?.username
                                };

                                return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/update`, updateDto)
                                    .pipe(
                                        map(response => response.data || null)
                                    );
                            })
                        );
                    }
                    return this.httpErrorHandler.handleError('toggleActiveStatus', null)(err);
                })
            );

        obs.subscribe({
            next: (data) => console.debug('Step 6: toggleActiveStatus result =', data),
            error: (err) => console.error('Step 7: toggleActiveStatus error =', err),
            complete: () => console.groupEnd()
        });
        return obs;
    }

    // Mock 資料處理方法
    private getMockEmployeeById(id: number): Employee | null {
        return this.mockData.find((emp: Employee) => emp.empId === id) || null;
    }

    private createMockEmployee(employeeData: EmployeeCreateDto): Employee {
        const newId = Math.max(...this.mockData.map((e: Employee) => e.empId)) + 1;
        const now = new Date().toISOString();
        const currentUser = this.userStore.user()?.username || 'system_service_1';

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
            createUser: currentUser,
            updateTime: now,
            updateUser: currentUser
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
            updateUser: this.userStore.user()?.username || 'system_service_2'
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
            updateUser: this.userStore.user()?.username || 'system'
        };
    }
}
