import { computed, inject, Injectable, signal } from '@angular/core';
import { JobRole, JobRoleSearchParams } from '../models/job-role.model';
import { JobRoleService } from '../services/job-role.service';
import { PagerDto } from '../../../core/models/common.model';

export interface JobRoleState {
    jobRoles: JobRole[];
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    pageSize: number;
    searchParams: JobRoleSearchParams;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}

const initialState: JobRoleState = {
    jobRoles: [],
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 10,
    searchParams: {},
    sortBy: '',
    sortDirection: 'asc'
};

@Injectable({
    providedIn: 'root'
})
export class JobRoleStore {
    private readonly jobRoleService = inject(JobRoleService);

    // 狀態信號
    private state = signal<JobRoleState>(initialState);

    // 計算屬性
    jobRoles = computed(() => this.state().jobRoles);
    loading = computed(() => this.state().loading);
    error = computed(() => this.state().error);
    total = computed(() => this.state().total);
    currentPage = computed(() => this.state().currentPage);
    pageSize = computed(() => this.state().pageSize);
    searchParams = computed(() => this.state().searchParams);
    sortBy = computed(() => this.state().sortBy);
    sortDirection = computed(() => this.state().sortDirection);

    // 計算派生狀態
    totalPages = computed(() => Math.ceil(this.state().total / this.state().pageSize));
    hasNextPage = computed(() => this.state().currentPage < this.totalPages());
    hasPreviousPage = computed(() => this.state().currentPage > 1);

    /**
     * 載入職務角色列表
     */
    loadJobRoles(params?: JobRoleSearchParams): void {
        const searchParams = params || this.state().searchParams;

        this.state.update(state => ({
            ...state,
            loading: true,
            error: null,
            searchParams
        }));

        const queryParams = {
            ...searchParams,
            page: this.state().currentPage,
            size: this.state().pageSize,
            sortBy: this.state().sortBy,
            sortDirection: this.state().sortDirection
        };

        this.jobRoleService.getPagedData(queryParams).subscribe({
            next: (response) => {
                this.state.update(state => ({
                    ...state,
                    jobRoles: response.data.dataList,
                    total: response.data.totalRecords,
                    loading: false,
                    error: null
                }));
            },
            error: (error) => {
                this.state.update(state => ({
                    ...state,
                    loading: false,
                    error: error.message || '載入職務角色失敗'
                }));
            }
        });
    }

    /**
     * 搜尋職務角色
     */
    searchJobRoles(keyword: string): void {
        this.state.update(state => ({
            ...state,
            currentPage: 1,
            searchParams: { ...state.searchParams, keyword }
        }));
        this.loadJobRoles();
    }

    /**
     * 按狀態篩選
     */
    filterByStatus(isActive: boolean | null): void {
        this.state.update(state => ({
            ...state,
            currentPage: 1,
            searchParams: {
                ...state.searchParams,
                isActive: isActive !== null ? isActive : undefined
            }
        }));
        this.loadJobRoles();
    }

    /**
     * 前往指定頁面
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.state.update(state => ({
                ...state,
                currentPage: page
            }));
            this.loadJobRoles();
        }
    }

    /**
     * 設定每頁筆數
     */
    setPageSize(pageSize: number): void {
        this.state.update(state => ({
            ...state,
            pageSize,
            currentPage: 1
        }));
        this.loadJobRoles();
    }

    /**
     * 排序職務角色
     */
    sortJobRoles(column: string, direction: 'asc' | 'desc'): void {
        this.state.update(state => ({
            ...state,
            sortBy: column,
            sortDirection: direction,
            currentPage: 1
        }));
        this.loadJobRoles();
    }

    /**
     * 新增職務角色
     */
    addJobRole(jobRole: JobRole): void {
        this.state.update(state => ({
            ...state,
            jobRoles: [...state.jobRoles, jobRole],
            total: state.total + 1
        }));
    }

    /**
     * 更新職務角色
     */
    updateJobRole(updatedJobRole: JobRole): void {
        this.state.update(state => ({
            ...state,
            jobRoles: state.jobRoles.map(jr =>
                jr.jobRoleId === updatedJobRole.jobRoleId ? updatedJobRole : jr
            )
        }));
    }

    /**
     * 刪除職務角色
     */
    removeJobRole(jobRoleId: number): void {
        this.state.update(state => ({
            ...state,
            jobRoles: state.jobRoles.filter(jr => jr.jobRoleId !== jobRoleId),
            total: state.total - 1
        }));
    }

    /**
     * 切換職務角色狀態
     */
    toggleJobRoleStatus(jobRoleId: number): void {
        this.state.update(state => ({
            ...state,
            jobRoles: state.jobRoles.map(jr =>
                jr.jobRoleId === jobRoleId ? { ...jr, isActive: !jr.isActive } : jr
            )
        }));
    }

    /**
     * 清除錯誤
     */
    clearError(): void {
        this.state.update(state => ({
            ...state,
            error: null
        }));
    }

    /**
     * 重置狀態
     */
    reset(): void {
        this.state.set(initialState);
    }
}
