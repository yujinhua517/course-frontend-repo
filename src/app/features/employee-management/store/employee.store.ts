import { Injectable, signal, computed } from '@angular/core';
import { EmployeeService } from '../services/employee.service';
import { Employee, EmployeeSearchParams } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeStore {
    // State signals
    private _employees = signal<Employee[]>([]);
    private _loading = signal<boolean>(false);
    private _error = signal<string | null>(null);
    private _total = signal<number>(0);
    private _currentPage = signal<number>(1);
    private _pageSize = signal<number>(10);
    private _searchParams = signal<EmployeeSearchParams>({});

    // Public readonly signals
    employees = this._employees.asReadonly();
    loading = this._loading.asReadonly();
    error = this._error.asReadonly();
    total = this._total.asReadonly();
    currentPage = this._currentPage.asReadonly();
    pageSize = this._pageSize.asReadonly();
    searchParams = this._searchParams.asReadonly();

    // Computed signals
    totalPages = computed(() => Math.ceil(this._total() / this._pageSize()));
    hasNextPage = computed(() => this._currentPage() < this.totalPages());
    hasPreviousPage = computed(() => this._currentPage() > 1);

    constructor(private employeeService: EmployeeService) { }

    loadEmployees(params?: EmployeeSearchParams): void {
        console.log('Employee Store: Setting loading to true');
        this._loading.set(true);
        this._error.set(null);

        const searchParams = {
            ...this._searchParams(),
            ...params,
            first_index_in_page: ((params?.first_index_in_page || this._currentPage()) - 1) * this._pageSize() + 1,
            pageable: true
        };

        // 只有當明確傳入時才覆蓋，避免清除現有的搜尋條件
        if (params?.keyword !== undefined) {
            searchParams.keyword = params.keyword;
        }
        if (params?.is_active !== undefined) {
            searchParams.is_active = params.is_active;
        }

        console.log('Employee Store loadEmployees called with params:', searchParams);

        this._searchParams.set(searchParams);

        this.employeeService.getEmployees(searchParams).subscribe({
            next: (response) => {
                //console.log('Employee Service response:', response);

                const totalRecords = response.total_records || response.data_list.length;

                this._employees.set(response.data_list);
                this._total.set(totalRecords);
                const currentPage = Math.floor((response.first_index_in_page - 1) / this._pageSize()) + 1;
                //console.log('Calculated Current Page:', currentPage);
                this._currentPage.set(currentPage);
                this._loading.set(false);

                //console.log('API Response Total Records:', totalRecords);
                //console.log('API Response Data List:', response.data_list);
            },
            error: (error) => {
                //console.log('Employee Store: Setting loading to false (error)');
                this._error.set('載入員工資料失敗');
                this._loading.set(false);
                //console.error('Error loading employees:', error);
            }
        });
    }

    searchEmployees(keyword: string): void {
        this.loadEmployees({
            ...this._searchParams(),
            emp_name: keyword,
            first_index_in_page: 1
        });
    }

    filterByDepartment(dept_id?: number): void {
        this.loadEmployees({
            ...this._searchParams(),
            dept_id,
            first_index_in_page: 1
        });
    }

    filterByStatus(is_active?: boolean): void {
        console.log('Employee Store filterByStatus called with:', is_active, 'Type:', typeof is_active);

        this.loadEmployees({
            ...this._searchParams(),
            is_active,
            first_index_in_page: 1
        });
    }

    sortEmployees(sortBy: keyof Employee, sortDirection: 'asc' | 'desc'): void {
        this.loadEmployees({
            ...this._searchParams(),
            sort_column: sortBy as string,
            sort_direction: sortDirection.toUpperCase()
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.loadEmployees({
                ...this._searchParams(),
                page,
                pageSize: this._pageSize(),
                first_index_in_page: (page - 1) * this._pageSize() + 1
            });
        }
    }

    setPageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this.loadEmployees({
            ...this._searchParams(),
            page: 1,
            pageSize,
            first_index_in_page: 1
        });
    }

    addEmployee(employee: Employee): void {
        const current = this._employees();
        this._employees.set([employee, ...current]);
        this._total.set(this._total() + 1);
    }

    updateEmployee(updatedEmployee: Employee): void {
        const employees = this._employees();
        const index = employees.findIndex((e: Employee) => e.emp_id === updatedEmployee.emp_id);

        if (index !== -1) {
            const updated = [...employees];
            updated[index] = updatedEmployee;
            this._employees.set(updated);
        }
    }

    removeEmployee(id: number): void {
        const filtered = this._employees().filter((e: Employee) => e.emp_id !== id);
        this._employees.set(filtered);
        this._total.set(this._total() - 1);
    }

    toggleEmployeeStatus(id: number): void {
        const employees = this._employees();
        const index = employees.findIndex((e: Employee) => e.emp_id === id);

        if (index !== -1) {
            const updated = [...employees];
            updated[index] = {
                ...updated[index],
                is_active: !updated[index].is_active,
                update_time: new Date().toISOString(),
                update_user: 'current_user'
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
