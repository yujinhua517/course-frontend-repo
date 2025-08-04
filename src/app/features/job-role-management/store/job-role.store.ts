import { Injectable, signal, computed } from '@angular/core';
import { JobRoleService } from '../services/job-role.service';
import { JobRole, JobRoleSearchParams } from '../models/job-role.model';

@Injectable({
    providedIn: 'root'
})
export class JobRoleStore {
    // State signals
    private _jobRoles = signal<JobRole[]>([]);
    private _loading = signal<boolean>(false);
    private _error = signal<string | null>(null);
    private _total = signal<number>(0);
    private _currentPage = signal<number>(1);
    private _pageSize = signal<number>(10);
    private _searchParams = signal<JobRoleSearchParams>({});

    // Public readonly signals
    jobRoles = this._jobRoles.asReadonly();
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

    constructor(private jobRoleService: JobRoleService) { }

    loadJobRoles(params?: JobRoleSearchParams): void {
        this._loading.set(true);
        this._error.set(null);

        const searchParams: JobRoleSearchParams = {
            ...this._searchParams(),
            ...params,
            pageIndex: params?.pageIndex ?? (this._currentPage() - 1), // 轉換為 0-based
            pageSize: params?.pageSize ?? this._pageSize(),
            pageable: true
        };

        this._searchParams.set(searchParams);

        this.jobRoleService.getJobRoles(searchParams).subscribe({
            next: (response) => {
                if (response.code === 200) {
                    this._jobRoles.set(response.data.dataList);
                    this._total.set(response.data.totalRecords);
                    // 將 0-based 轉換為 1-based 顯示
                    this._currentPage.set((response.data.page || 0) + 1);
                    this._pageSize.set(response.data.size || 10);
                }
                this._loading.set(false);
            },
            error: (error) => {
                this._error.set('載入職務資料失敗');
                this._loading.set(false);
                console.error('Error loading job roles:', error);
            }
        });
    }

    searchJobRoles(keyword: string): void {
        this._currentPage.set(1); // 重設為第一頁
        this.loadJobRoles({
            ...this._searchParams(),
            keyword,
            pageIndex: 0
        });
    }

    filterByStatus(isActive?: boolean): void {
        this._currentPage.set(1); // 重設為第一頁
        this.loadJobRoles({
            ...this._searchParams(),
            isActive,
            pageIndex: 0
        });
    }

    sortJobRoles(sortBy: keyof JobRole, sortDirection: 'asc' | 'desc'): void {
        this.loadJobRoles({
            ...this._searchParams(),
            sortColumn: sortBy as string,
            sortDirection: sortDirection
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this._currentPage.set(page);
            this.loadJobRoles({
                ...this._searchParams(),
                pageIndex: page - 1 // 轉換為 0-based
            });
        }
    }

    setPageSize(pageSize: number): void {
        this._currentPage.set(1); // 重設為第一頁
        this._pageSize.set(pageSize);
        this.loadJobRoles({
            ...this._searchParams(),
            pageSize: pageSize,
            pageIndex: 0
        });
    }

    addJobRole(jobRole: JobRole): void {
        const current = this._jobRoles();
        this._jobRoles.set([jobRole, ...current]);
        this._total.set(this._total() + 1);
    }

    updateJobRole(updatedJobRole: JobRole): void {
        const jobRoles = this._jobRoles();
        const index = jobRoles.findIndex(c => c.jobRoleCode === updatedJobRole.jobRoleCode);

        if (index !== -1) {
            const updated = [...jobRoles];
            updated[index] = updatedJobRole;
            this._jobRoles.set(updated);
        }
    }

    removeJobRole(code: string): void {
        const filtered = this._jobRoles().filter(c => c.jobRoleCode !== code);
        this._jobRoles.set(filtered);
        this._total.set(this._total() - 1);
    }

    toggleJobRoleStatus(code: string): void {
        const jobRoles = this._jobRoles();
        const index = jobRoles.findIndex(c => c.jobRoleCode === code);

        if (index !== -1) {
            const updated = [...jobRoles];
            updated[index] = {
                ...updated[index],
                isActive: !updated[index].isActive,
                updateTime: new Date().toISOString(),
                updateUser: 'current_user'
            };
            this._jobRoles.set(updated);
        }
    }

    clearError(): void {
        this._error.set(null);
    }

    reset(): void {
        this._jobRoles.set([]);
        this._total.set(0);
        this._currentPage.set(1);
        this._searchParams.set({});
        this._error.set(null);
        this._loading.set(false);
    }
}
