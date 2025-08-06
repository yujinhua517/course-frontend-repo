import { Injectable, signal, computed, inject } from '@angular/core';
import { EmployeeService } from '../services/employee.service';
import { Employee, EmployeeSearchParams } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeStore {
    private readonly employeeService = inject(EmployeeService);

    // State signals
    private readonly _employees = signal<Employee[]>([]);
    private readonly _loading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);
    private readonly _total = signal<number>(0);
    private readonly _currentPage = signal<number>(1);
    private readonly _pageSize = signal<number>(10);
    private readonly _searchParams = signal<EmployeeSearchParams>({});

    // Public readonly signals
    employees = this._employees.asReadonly();
    loading = this._loading.asReadonly();
    error = this._error.asReadonly();
    total = this._total.asReadonly();
    currentPage = this._currentPage.asReadonly();
    pageSize = this._pageSize.asReadonly();
    searchParams = this._searchParams.asReadonly();

    // Computed signals
    readonly totalPages = computed(() => Math.ceil(this._total() / this._pageSize()));
    readonly hasNextPage = computed(() => this._currentPage() < this.totalPages());
    readonly hasPreviousPage = computed(() => this._currentPage() > 1);

    loadEmployees(params?: EmployeeSearchParams): void {
        this._loading.set(true);
        this._error.set(null);

        const searchParams = {
            ...this._searchParams(),
            ...params,
            page: params?.page || this._currentPage(),
            pageSize: this._pageSize(),
            pageable: true
        };

        // 只有當明確傳入時才覆蓋，避免清除現有的搜尋條件
        if (params?.keyword !== undefined) {
            searchParams.keyword = params.keyword;
        }
        if (params?.isActive !== undefined) {
            searchParams.isActive = params.isActive;
        }

        this._searchParams.set(searchParams);

        // 使用 BaseQueryService 的統一查詢方法，依賴 interceptor 自動轉換
        this.employeeService.getPagedData(searchParams).subscribe({
            next: (response) => {
                this._employees.set(response.data.dataList);
                this._total.set(response.data.totalRecords);
                this._currentPage.set(params?.page || this._currentPage());
                this._loading.set(false);
            },
            error: (error) => {
                this._error.set('載入員工資料失敗');
                this._loading.set(false);
            }
        });
    }

    searchEmployees(keyword: string): void {
        this.loadEmployees({
            ...this._searchParams(),
            keyword,
            page: 1
        });
    }

    filterByDepartment(deptId?: number): void {
        this.loadEmployees({
            ...this._searchParams(),
            deptId: deptId,
            page: 1
        });
    }

    filterByStatus(isActive?: boolean): void {
        this.loadEmployees({
            ...this._searchParams(),
            isActive,
            page: 1
        });
    }

    sortEmployees(sortColumn: keyof Employee, sortDirection: 'asc' | 'desc'): void {
        this.loadEmployees({
            ...this._searchParams(),
            sortColumn: sortColumn as string,
            sortDirection: sortDirection.toUpperCase()
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.loadEmployees({
                ...this._searchParams(),
                page
            });
        }
    }

    setPageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this.loadEmployees({
            ...this._searchParams(),
            page: 1,
            pageSize
        });
    }

    addEmployee(employee: Employee): void {
        const current = this._employees();
        this._employees.set([employee, ...current]);
        this._total.set(this._total() + 1);
    }

    updateEmployee(updatedEmployee: Employee): void {
        const employees = this._employees();
        const index = employees.findIndex((e: Employee) => e.empId === updatedEmployee.empId);

        if (index !== -1) {
            const updated = [...employees];
            updated[index] = updatedEmployee;
            this._employees.set(updated);
        }
    }

    removeEmployee(id: number): void {
        const filtered = this._employees().filter((e: Employee) => e.empId !== id);
        this._employees.set(filtered);
        this._total.set(this._total() - 1);
    }

    toggleEmployeeStatus(id: number): void {
        const employees = this._employees();
        const index = employees.findIndex((e: Employee) => e.empId === id);

        if (index !== -1) {
            const updated = [...employees];
            updated[index] = {
                ...updated[index],
                isActive: !updated[index].isActive,
                updateTime: new Date().toISOString(),
                updateUser: 'current_user'
            };
            this._employees.set(updated);
        }
    }

    clearError(): void {
        this._error.set(null);
    }

    reset(): void {
        this._employees.set([]);
        this._total.set(0);
        this._currentPage.set(1);
        this._searchParams.set({});
        this._error.set(null);
        this._loading.set(false);
    }
}
