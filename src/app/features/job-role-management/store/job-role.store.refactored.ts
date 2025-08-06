/**
 * Job-Role Store 重構版本
 * 
 * 示範如何使用統一的 Service 介面來重構 Store
 * 使用 Angular 19+ 的 Signal-based 狀態管理
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { JobRoleServiceRefactored } from '../services/job-role.service.refactored';
import { JobRole, JobRoleSearchParams, JobRoleCreateDto, JobRoleUpdateDto } from '../models/job-role.model';
import { PAGINATION_DEFAULTS } from '../../../core/models/common.model';
import { QueryParamsBuilder } from '../../../core/utils/query.util';

@Injectable({
    providedIn: 'root'
})
export class JobRoleStoreRefactored {
    private readonly jobRoleService = inject(JobRoleServiceRefactored);

    // === 狀態管理 (使用 Signals) ===
    private readonly _jobRoles = signal<JobRole[]>([]);
    private readonly _totalRecords = signal<number>(0);
    private readonly _currentPage = signal<number>(1);
    private readonly _pageSize = signal<number>(PAGINATION_DEFAULTS.PAGE_SIZE);
    private readonly _sortColumn = signal<string>('jobRoleCode');
    private readonly _sortDirection = signal<'asc' | 'desc'>('asc');
    private readonly _isLoading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);
    private readonly _searchParams = signal<JobRoleSearchParams>({
        page: 1,
        pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
        sortColumn: 'jobRoleCode',
        sortDirection: 'asc'
    });

    // === 公開的唯讀 Signals ===
    readonly jobRoles = this._jobRoles.asReadonly();
    readonly totalRecords = this._totalRecords.asReadonly();
    readonly currentPage = this._currentPage.asReadonly();
    readonly pageSize = this._pageSize.asReadonly();
    readonly sortColumn = this._sortColumn.asReadonly();
    readonly sortDirection = this._sortDirection.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly searchParams = this._searchParams.asReadonly();

    // === 計算屬性 ===
    readonly totalPages = computed(() =>
        Math.ceil(this._totalRecords() / this._pageSize())
    );
    readonly hasNextPage = computed(() =>
        this._currentPage() < this.totalPages()
    );
    readonly hasPreviousPage = computed(() =>
        this._currentPage() > 1
    );
    readonly isEmpty = computed(() =>
        this._jobRoles().length === 0 && !this._isLoading()
    );

    // === 查詢操作 ===

    /**
     * 載入職務列表
     */
    loadJobRoles(params?: JobRoleSearchParams): void {
        this._isLoading.set(true);
        this._error.set(null);

        const searchParams = params || this._searchParams();

        this.jobRoleService.getPagedData(searchParams).subscribe({
            next: (response) => {
                const data = response.data;
                this._jobRoles.set(data.dataList);
                this._totalRecords.set(data.totalRecords);
                this._currentPage.set(searchParams.page || 1);
                this._pageSize.set(searchParams.pageSize || PAGINATION_DEFAULTS.PAGE_SIZE);
                this._sortColumn.set(searchParams.sortColumn || 'jobRoleCode');
                this._sortDirection.set(searchParams.sortDirection as 'asc' | 'desc' || 'asc');
                this._searchParams.set(searchParams);
                this._isLoading.set(false);
            },
            error: (error) => {
                console.error('載入職務列表失敗:', error);
                this._error.set('載入職務列表失敗，請稍後再試');
                this._isLoading.set(false);
            }
        });
    }

    /**
     * 搜尋職務
     */
    searchJobRoles(keyword: string): void {
        const params = QueryParamsBuilder.resetToFirstPage({
            ...this._searchParams(),
            keyword
        });
        this.loadJobRoles(params);
    }

    /**
     * 按狀態篩選
     */
    filterByStatus(isActive?: boolean): void {
        const params = QueryParamsBuilder.resetToFirstPage({
            ...this._searchParams(),
            isActive
        });
        this.loadJobRoles(params);
    }

    /**
     * 排序職務
     */
    sortJobRoles(sortColumn: string, sortDirection: 'asc' | 'desc'): void {
        const params = {
            ...this._searchParams(),
            sortColumn,
            sortDirection
        };
        this.loadJobRoles(params);
    }

    /**
     * 切換排序方向
     */
    toggleSort(column: string): void {
        const currentSort = this._sortColumn();
        const currentDirection = this._sortDirection();

        let newDirection: 'asc' | 'desc' = 'asc';
        if (column === currentSort) {
            newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        }

        this.sortJobRoles(column, newDirection);
    }

    // === 分頁操作 ===

    /**
     * 跳轉到指定頁面
     */
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages()) return;

        const params = {
            ...this._searchParams(),
            page
        };
        this.loadJobRoles(params);
    }

    /**
     * 設置每頁筆數
     */
    setPageSize(pageSize: number): void {
        const params = QueryParamsBuilder.resetToFirstPage({
            ...this._searchParams(),
            pageSize
        });
        this.loadJobRoles(params);
    }

    /**
     * 下一頁
     */
    nextPage(): void {
        if (this.hasNextPage()) {
            this.goToPage(this._currentPage() + 1);
        }
    }

    /**
     * 上一頁
     */
    previousPage(): void {
        if (this.hasPreviousPage()) {
            this.goToPage(this._currentPage() - 1);
        }
    }

    // === CRUD 操作 ===

    /**
     * 創建職務
     */
    createJobRole(dto: JobRoleCreateDto): void {
        this._isLoading.set(true);
        this._error.set(null);

        this.jobRoleService.createJobRole(dto).subscribe({
            next: (response) => {
                if (response.code === 200) {
                    // 重新載入當前頁面
                    this.loadJobRoles(this._searchParams());
                } else {
                    this._error.set(response.message || '創建失敗');
                    this._isLoading.set(false);
                }
            },
            error: (error) => {
                console.error('創建職務失敗:', error);
                this._error.set('創建職務失敗，請稍後再試');
                this._isLoading.set(false);
            }
        });
    }

    /**
     * 更新職務
     */
    updateJobRole(dto: JobRoleUpdateDto): void {
        this._isLoading.set(true);
        this._error.set(null);

        this.jobRoleService.updateJobRole(dto).subscribe({
            next: (response) => {
                if (response.code === 200) {
                    // 更新本地狀態
                    const updatedJobRoles = this._jobRoles().map(role =>
                        role.jobRoleId === dto.jobRoleId ? { ...role, ...dto } : role
                    );
                    this._jobRoles.set(updatedJobRoles);
                } else {
                    this._error.set(response.message || '更新失敗');
                }
                this._isLoading.set(false);
            },
            error: (error) => {
                console.error('更新職務失敗:', error);
                this._error.set('更新職務失敗，請稍後再試');
                this._isLoading.set(false);
            }
        });
    }

    /**
     * 刪除職務
     */
    deleteJobRole(id: number): void {
        this._isLoading.set(true);
        this._error.set(null);

        this.jobRoleService.deleteJobRole(id).subscribe({
            next: (response) => {
                if (response.code === 200) {
                    // 移除本地狀態中的項目
                    const filteredJobRoles = this._jobRoles().filter(role => role.jobRoleId !== id);
                    this._jobRoles.set(filteredJobRoles);
                    this._totalRecords.set(this._totalRecords() - 1);

                    // 如果當前頁沒有資料且不是第一頁，回到上一頁
                    if (filteredJobRoles.length === 0 && this._currentPage() > 1) {
                        this.goToPage(this._currentPage() - 1);
                    }
                } else {
                    this._error.set(response.message || '刪除失敗');
                }
                this._isLoading.set(false);
            },
            error: (error) => {
                console.error('刪除職務失敗:', error);
                this._error.set('刪除職務失敗，請稍後再試');
                this._isLoading.set(false);
            }
        });
    }

    // === 工具方法 ===

    /**
     * 重設狀態
     */
    reset(): void {
        this._jobRoles.set([]);
        this._totalRecords.set(0);
        this._currentPage.set(1);
        this._pageSize.set(PAGINATION_DEFAULTS.PAGE_SIZE);
        this._sortColumn.set('jobRoleCode');
        this._sortDirection.set('asc');
        this._isLoading.set(false);
        this._error.set(null);
        this._searchParams.set({
            page: 1,
            pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
            sortColumn: 'jobRoleCode',
            sortDirection: 'asc'
        });
    }

    /**
     * 清除錯誤
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * 刷新當前頁面
     */
    refresh(): void {
        this.loadJobRoles(this._searchParams());
    }
}
