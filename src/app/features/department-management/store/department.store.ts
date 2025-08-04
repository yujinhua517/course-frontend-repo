import { Injectable, computed, signal, inject } from '@angular/core';
import { Department, DepartmentSearchParams } from '../models/department.model';
import { DepartmentService } from '../services/department.service';

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
        // 只取一次全公司總數，使用現有的 getDepartments 方法
        this.departmentService.getDepartments(1, 1000, '', {}).subscribe({
            next: (response) => {
                // service 已經標準化回應格式
                const total = response.total || 0;
                this._allTotal.set(total);
                console.log('全公司總部門數:', total);
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

        console.log('Department Store loadDepartments called with params:', searchParams);

        this._searchParams.set(searchParams);

        // 使用現有的 service 方法簽名
        this.departmentService.getDepartments(
            searchParams.page || 1,
            searchParams.pageSize || 10,
            searchParams.keyword || '',
            {
                deptLevel: searchParams.deptLevel,
                isActive: searchParams.isActive,
                parentDeptId: searchParams.parentDeptId
            }
        ).subscribe({
            next: (response) => {
                console.log('Department Service response:', response);

                // service 已經標準化回應格式，直接使用
                const departments = response.data || [];
                this._departments.set(departments);
                this._total.set(response.total || departments.length);
                this._currentPage.set(response.page || searchParams.page || 1);
                this._pageSize.set(response.pageSize || searchParams.pageSize || 10);
                this._loading.set(false);
                console.log('載入部門資料:', {
                    count: departments.length,
                    total: response.total || departments.length
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

    // filterByActive(isActive: false | true | undefined): void {
    //     this.loadDepartments({
    //         ...this._searchParams(),
    //         is_active: isActive,
    //         page: 1
    //     });
    //     //console.log('filterByActive called', isActive);
    // }

    filterByStatus(isActive?: boolean): void {
        console.log('Department Store filterByStatus called with:', isActive, 'Type:', typeof isActive);

        this.loadDepartments({
            ...this._searchParams(),
            isActive,
            page: 1
        });
    }

    filterByLevel(level: string | undefined): void {
        console.log('Department Store filterByLevel called with:', level, 'Type:', typeof level);

        this.loadDepartments({
            ...this._searchParams(),
            deptLevel: level,
            page: 1
        });
    }

    sortDepartments(sortBy: keyof Department, sortDirection: 'asc' | 'desc'): void {
        this.loadDepartments({
            ...this._searchParams(),
            sortBy,
            sortDirection
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this._currentPage.set(page);
            this.loadDepartments();
        }
    }

    setPageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this._currentPage.set(1);
        this.loadDepartments();
    }

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
}
