import { Injectable, computed, signal, inject } from '@angular/core';
import { Department, DepartmentSearchParams, DepartmentQueryOptions } from '../models/department.model';
import { DepartmentService } from '../services/department.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DepartmentStore {
    private departmentService = inject(DepartmentService);

    // State signals
    private _departments = signal<Department[]>([]);
    private _loading = signal<boolean>(false);
    private _error = signal<string | null>(null);
    private _total = signal<number>(0);
    private _allTotal = signal<number>(0); // 全公司總部門數
    private _currentPage = signal<number>(1);
    private _pageSize = signal<number>(10);
    private _searchParams = signal<DepartmentSearchParams>({});

    // Public readonly signals
    departments = this._departments.asReadonly();
    loading = this._loading.asReadonly();
    error = this._error.asReadonly();
    total = this._total.asReadonly(); // 分頁查詢下的總數
    allTotal = this._allTotal.asReadonly(); // 全公司總部門數
    currentPage = this._currentPage.asReadonly();
    pageSize = this._pageSize.asReadonly();
    searchParams = this._searchParams.asReadonly();

    // Computed signals
    totalPages = computed(() => Math.ceil(this._total() / this._pageSize()));
    hasNextPage = computed(() => this._currentPage() < this.totalPages());
    hasPreviousPage = computed(() => this._currentPage() > 1);

    constructor() {
        this.loadAllDepartmentsCount();
    }

    private loadAllDepartmentsCount(): void {
        // 只取一次全公司總數，使用新的統一查詢介面
        this.departmentService.getDepartments({
            page: 1,
            pageSize: 1000
        }).subscribe({
            next: (response) => {
                const total = response.data?.totalRecords || 0;
                this._allTotal.set(total);
            },
            error: (error: any) => {
                console.error('取得全公司總部門數失敗', error);
                this._allTotal.set(0);
            }
        });
    }

    loadDepartments(params?: DepartmentSearchParams): void {
        this._loading.set(true);
        this._error.set(null);

        const searchParams = {
            ...this._searchParams(),
            ...params,
            page: params?.page || this._currentPage(),
            pageSize: params?.pageSize || this._pageSize()
        };

        this._searchParams.set(searchParams);
        console.log('Department Store loadDepartments called with params:', searchParams);

        // 使用新的統一查詢介面
        this.departmentService.getDepartments({
            page: searchParams.page || 1,
            pageSize: searchParams.pageSize || 10,
            searchTerm: searchParams.keyword || '',
            filters: {
                level: searchParams.deptLevel,
                isActive: searchParams.isActive,
                parentId: searchParams.parentDeptId
            },
            sort: searchParams.sortColumn && searchParams.sortDirection ? {
                field: searchParams.sortColumn as keyof Department,
                direction: searchParams.sortDirection as 'asc' | 'desc'
            } : undefined
        }).subscribe({
            next: (response) => {
                console.log('Department Service response:', response);

                // response.data 是 PagerDto<Department> 類型
                const pagerData = response.data;
                const departments = pagerData?.dataList || [];
                this._departments.set(departments);
                this._total.set(pagerData?.totalRecords || 0);
                this._currentPage.set(searchParams.page || 1);
                this._pageSize.set(searchParams.pageSize || 10);
                this._loading.set(false);
                console.log('載入部門資料:', {
                    count: departments.length,
                    total: pagerData?.totalRecords || 0
                });
            },
            error: (error) => {
                this._error.set('載入部門資料失敗');
                this._loading.set(false);
                console.error('Error loading departments:', error);
            }
        });
    }

    searchDepartments(keyword: string): void {
        if (keyword && keyword.trim()) {
            this.loadDepartments({
                ...this._searchParams(),
                keyword: keyword.trim(),
                page: 1
            });
        } else {
            this.loadDepartments({
                ...this._searchParams(),
                keyword: undefined,
                page: 1
            });
        }
    }

    filterByStatus(isActive?: boolean): void {
        if (!environment.production) {
            console.log('Department Store filterByStatus called with:', isActive, 'Type:', typeof isActive);
        }

        this.loadDepartments({
            ...this._searchParams(),
            isActive,
            page: 1
        });
    }

    filterByLevel(level: string | undefined): void {
        if (!environment.production) {
            console.log('Department Store filterByLevel called with:', level, 'Type:', typeof level);
        }

        this.loadDepartments({
            ...this._searchParams(),
            deptLevel: level,
            page: 1
        });
    }

    sortDepartments(sortColumn: keyof Department, sortDirection: 'asc' | 'desc'): void {
        this.loadDepartments({
            ...this._searchParams(),
            sortColumn: sortColumn,
            sortDirection
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this._currentPage.set(page);
            this.loadDepartments();
        }
    }

    // 頁面大小變更 - 統一方法名稱
    changePageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this._currentPage.set(1);
        this.loadDepartments();
    }

    // CRUD 操作方法
    addDepartment(department: Department): void {
        this._departments.update(departments => [...departments, department]);
        this._total.update(total => total + 1);
        this._allTotal.update(total => total + 1);
    }

    updateDepartment(updatedDepartment: Department): void {
        this._departments.update(departments =>
            departments.map(dept =>
                dept.deptId === updatedDepartment.deptId ? updatedDepartment : dept
            )
        );
    }

    removeDepartment(deptId: number): void {
        this._departments.update(departments =>
            departments.filter(dept => dept.deptId !== deptId)
        );
        this._total.update(total => total - 1);
        this._allTotal.update(total => total - 1);
    }

    // 錯誤處理方法
    clearError(): void {
        this._error.set(null);
    }

    // 清除篩選條件
    clearFilters(): void {
        this._searchParams.set({});
        this._currentPage.set(1);
        this.loadDepartments();
    }

    // 重設所有狀態
    reset(): void {
        this._departments.set([]);
        this._total.set(0);
        this._currentPage.set(1);
        this._searchParams.set({});
        this._error.set(null);
        this._loading.set(false);
    }
}