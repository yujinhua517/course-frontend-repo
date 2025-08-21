import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
import { JobRoleStore } from '../../store/job-role.store';
import { JobRoleService } from '../../services/job-role.service';
import { JobRoleFormComponent } from '../../components/job-role-form/job-role-form.component';
import { JobRoleViewComponent } from '../../components/job-role-view/job-role-view.component';
import { JobRole } from '../../models/job-role.model';
import { UserStore } from '../../../../core/auth/user.store';
import type { User, Permission } from '../../../../models/user.model';
import { TableHeaderComponent, TableHeaderConfig, TableColumn } from '../../../../shared/components/table-header/table-header.component';
import { TableBodyComponent, TableBodyConfig, TableBodyColumn } from '../../../../shared/components/table-body/table-body.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ActionButtonGroupComponent } from '../../../../shared/components/action-buttons/action-button-group.component';
import { SearchFilterComponent, SearchFilterConfig } from '../../../../shared/components/search-filter/search-filter.component';
import { PaginationComponent, PaginationConfig } from '../../../../shared/components/pagination/pagination.component';
import { LoadingStateComponent, LoadingStateConfig } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageComponent, ErrorMessageConfig } from '../../../../shared/components/error-message/error-message.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';
import type { StatusConfig } from '../../../../shared/components/status-badge/status-badge.component';
import type { ActionButtonConfig } from '../../../../shared/components/action-buttons/action-button-group.component';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';
import { GlobalMessageService } from '../../../../core/message/global-message.service';

@Component({
    selector: 'app-job-role-list',
    templateUrl: './job-role-list.component.html',
    styleUrls: ['./job-role-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        // FormsModule,
        // RouterModule,
        JobRoleFormComponent,
        JobRoleViewComponent,
        TableHeaderComponent,
        TableBodyComponent,
        StatusBadgeComponent,
        ActionButtonGroupComponent,
        SearchFilterComponent,
        PaginationComponent,
        LoadingStateComponent,
        ErrorMessageComponent,
        EmptyStateComponent,
        ConfirmationModalComponent,
        HighlightPipe
    ]
})
export class JobRoleListComponent implements OnInit {
    private jobRoleStore = inject(JobRoleStore);
    private jobRoleService = inject(JobRoleService);
    private messageService = inject(GlobalMessageService);
    // 權限判斷：基於 action 欄位的細緻權限控制
    private readonly userStore = inject(UserStore);

    private readonly hasResourceActionPermission = computed(() => {
        return (resource: string, action: string): boolean => {
            const user = this.userStore.user() as User | null;
            if (!user) return false;
            return (user.permissions ?? []).some((p: Permission) =>
                p.resource === resource && p.action === action
            );
        };
    });

    // 權限快捷計算屬性
    readonly permissions = computed(() => {
        const hasPermission = this.hasResourceActionPermission();
        return {
            create: hasPermission('jobrole', 'create'),
            read: hasPermission('jobrole', 'read'),
            update: hasPermission('jobrole', 'update'),
            delete: hasPermission('jobrole', 'delete')
        };
    });

    // Store signals
    jobRoles = this.jobRoleStore.jobRoles;
    loading = this.jobRoleStore.loading;
    error = this.jobRoleStore.error;
    total = this.jobRoleStore.total;
    currentPage = this.jobRoleStore.currentPage;
    pageSize = this.jobRoleStore.pageSize;
    totalPages = this.jobRoleStore.totalPages;
    hasNextPage = this.jobRoleStore.hasNextPage;
    hasPreviousPage = this.jobRoleStore.hasPreviousPage;

    // Computed
    pageSizeOptions = signal([10, 25, 50, 100]);
    pageNumbers = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
            range.push(i);
        }

        if (current - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (current + delta < total - 1) {
            rangeWithDots.push('...', total);
        } else {
            rangeWithDots.push(total);
        }

        return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
    });

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    categoryFilter = signal<string | undefined>(undefined);
    showForm = signal(false);
    showView = signal(false);
    selectedJobRole = signal<JobRole | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortColumn = signal<keyof JobRole>('jobRoleId');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedJobRoles = signal<JobRole[]>([]);
    showBulkDeleteConfirm = signal(false);
    bulkDeleteLoading = signal(false);

    // Individual action signals
    showDeleteConfirm = signal(false);
    showStatusConfirm = signal(false);
    actionJobRole = signal<JobRole | null>(null);
    actionLoading = signal(false);

    // 共用元件配置
    readonly loadingConfig = computed<LoadingStateConfig>(() => ({
        size: 'md',
        text: '載入職務資料中...',
        showText: true,
        variant: 'primary',
        center: true
    }));

    readonly errorConfig = computed<ErrorMessageConfig>(() => ({
        show: !!this.error(),
        message: this.error() || '載入職務資料失敗',
        type: 'danger',
        title: '載入錯誤',
        dismissible: true,
        actions: [{
            label: '重試',
            action: 'retry',
            variant: 'outline-primary'
        }]
    }));

    readonly emptyStateConfig = computed<EmptyStateConfig>(() => ({
        icon: 'person-workspace',
        title: this.searchKeyword() || this.statusFilter() !== undefined ? '無符合條件的職務' : '尚無職務資料',
        message: this.searchKeyword() || this.statusFilter() !== undefined
            ? '請嘗試調整搜尋條件或篩選器'
            : '開始建立您的第一個職務',
        primaryAction: this.permissions().create ? {
            label: '新增職務',
            action: 'create',
            icon: 'plus-circle',
            variant: 'primary'
        } : undefined,
        secondaryAction: this.searchKeyword() || this.statusFilter() !== undefined ? {
            label: '清除篩選',
            action: 'clear',
            icon: 'x-circle',
            variant: 'outline-secondary'
        } : undefined
    }));

    readonly bulkDeleteConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認批量刪除',
        message: `您確定要刪除選中的 ${this.selectedJobRoles().length} 個職務嗎？此操作無法復原。`,
        type: 'danger',
        confirmText: '確認刪除',
        cancelText: '取消',
        items: this.selectedJobRoles().map(item => ({
            id: item.jobRoleCode,
            text: item.jobRoleName,
            subText: item.jobRoleCode
        })),
        maxItemsToShow: 100,
        showItemIcon: true
    }));

    readonly deleteConfirmConfig = computed<ConfirmationModalConfig>(() => {
        const jobRole = this.actionJobRole();
        return {
            title: '確認刪除職務',
            message: `您確定要刪除職務「${jobRole?.jobRoleName}」嗎？此操作無法復原。`,
            type: 'danger',
            confirmText: '確認刪除',
            cancelText: '取消'
        };
    });

    readonly statusConfirmConfig = computed<ConfirmationModalConfig>(() => {
        const jobRole = this.actionJobRole();
        const isActive = jobRole?.isActive;
        return {
            title: `確認${isActive ? '停用' : '啟用'}職務`,
            message: `您確定要${isActive ? '停用' : '啟用'}職務「${jobRole?.jobRoleName}」嗎？`,
            type: isActive ? 'warning' : 'info',
            confirmText: `確認${isActive ? '停用' : '啟用'}`,
            cancelText: '取消'
        };
    });

    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋No.、職務名稱或代碼',
        searchLabel: '關鍵字搜尋',
        filters: [
            {
                key: 'isActive',
                label: '啟用狀態',
                options: [
                    { value: true, text: '啟用' },
                    { value: false, text: '停用' }
                ]
            }
        ],
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        totalCountLabel: '筆職務資料',
        showClearButton: true
    }));

    // 計算當前篩選器值
    readonly currentFilterValues = computed(() => ({
        isActive: this.statusFilter(),
        category: this.categoryFilter()
    }));

    // 分頁配置
    readonly paginationConfig = computed<PaginationConfig>(() => ({
        currentPage: this.currentPage(),
        totalPages: this.totalPages(),
        totalCount: this.total(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: false,
        showTotalCount: false,
        showFirstLast: true,
        showPrevNext: true,
        maxVisiblePages: 7,
        ariaLabel: '職務列表分頁',
        disabled: this.loading()
    }));

    // 表頭配置
    readonly tableHeaderConfig = computed<TableHeaderConfig>(() => ({
        showSelectColumn: this.permissions().delete,
        isAllSelected: this.isAllSelected(),
        isPartiallySelected: this.isPartiallySelected(),
        sortColumn: this.sortColumn(),
        sortDirection: this.sortDirection(),
        columns: [
            {
                key: 'jobRoleId',
                label: 'No.',
                sortable: true,
                width: '8%'
            },
            {
                key: 'jobRoleCode',
                label: '職務代碼',
                sortable: true,
                width: '11%'
            },
            {
                key: 'jobRoleName',
                label: '職務名稱',
                sortable: true,
                width: '20%'
            },
            {
                key: 'description',
                label: '職務描述',
                sortable: false,
                width: '21%'
            },
            {
                key: 'isActive',
                label: '狀態',
                sortable: false,
                align: 'center',
                width: '10%'
            },
            {
                key: 'createTime',
                label: '建立時間',
                sortable: true,
                width: '15%'
            },
            {
                key: 'actions',
                label: '操作',
                sortable: false,
                align: 'center',
                width: '15%'
            }
        ]
    }));

    // Table Body 配置
    @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
    @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
    @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
    @ViewChild('descriptionTemplate', { static: true }) descriptionTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('timeTemplate', { static: true }) timeTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    readonly tableBodyConfig = computed<TableBodyConfig>(() => {
        // 確保模板已經初始化
        if (!this.codeTemplate) {
            return {
                data: [],
                showSelectColumn: false,
                columns: []
            };
        }

        return {
            data: this.jobRoles(),
            showSelectColumn: this.permissions().delete,
            trackByFn: (index: number, item: JobRole) => item.jobRoleCode,
            rowCssClass: (item: JobRole) => this.isSelected(item) ? 'table-active' : '',
            columns: [
                {
                    key: 'jobRoleId',
                    template: this.idTemplate,
                    cssClass: 'fw-normal',
                    width: '8%'
                },
                {
                    key: 'jobRoleCode',
                    template: this.codeTemplate,
                    cssClass: 'fw-medium text-primary',
                    width: '11%'
                },
                {
                    key: 'jobRoleName',
                    template: this.nameTemplate,
                    cssClass: 'fw-medium',
                    width: '20%'
                },
                {
                    key: 'description',
                    template: this.descriptionTemplate,
                    cssClass: 'text-muted',
                    width: '21%'
                },
                {
                    key: 'isActive',
                    template: this.statusTemplate,
                    align: 'center',
                    width: '10%'
                },
                {
                    key: 'createTime',
                    template: this.timeTemplate,
                    cssClass: 'text-muted small',
                    width: '15%'
                },
                {
                    key: 'actions',
                    template: this.actionsTemplate,
                    align: 'center',
                    width: '15%'
                }
            ]
        };
    });

    // Computed for shared components
    selectedFilters = computed(() => ({
        isActive: this.statusFilter(),
        category: this.categoryFilter()
    }));

    ngOnInit(): void {
        this.loadJobRoles();
    }

    loadJobRoles(): void {
        this.jobRoleStore.loadJobRoles({
            keyword: this.searchKeyword() || undefined,
            isActive: this.statusFilter(),
            sortColumn: this.sortColumn(),
            sortDirection: this.sortDirection()
        });
    }

    // 搜尋處理
    onSearch(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.jobRoleStore.searchJobRoles(keyword);
        this.clearSelection();
    }

    // 篩選處理
    onFilter(filters: Record<string, any>): void {
        this.statusFilter.set(filters['isActive']);
        this.jobRoleStore.filterByStatus(filters['isActive']);
        this.clearSelection();
    }

    // 分頁處理
    onPageChange(page: number): void {
        this.jobRoleStore.goToPage(page);
        this.clearSelection();
    }

    onPageSizeChange(pageSize: number): void {
        this.jobRoleStore.setPageSize(pageSize);
        this.clearSelection();
    }

    // 排序處理
    onSort(column: keyof JobRole): void {
        const currentSort = this.sortColumn();
        const currentDirection = this.sortDirection();

        let newDirection: 'asc' | 'desc' = 'asc';
        if (column === currentSort) {
            newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        }

        this.sortColumn.set(column);
        this.sortDirection.set(newDirection);
        this.jobRoleStore.sortJobRoles(column, newDirection);
        this.clearSelection();
    }

    getSortIcon(column: keyof JobRole): string {
        if (this.sortColumn() !== column) return 'bi-chevron-expand';
        return this.sortDirection() === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down';
    }

    onFilterByStatus(status: boolean | undefined): void {
        this.statusFilter.set(status);
        this.jobRoleStore.filterByStatus(status !== undefined ? status : null);
    }

    // 表頭排序處理
    onTableSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        if (event.direction === null) {
            // 重設排序到預設值
            this.sortColumn.set('jobRoleId');
            this.sortDirection.set('asc');
            // 直接傳遞重置後的值，而不是依賴本地 signals
            this.jobRoleStore.loadJobRoles({
                keyword: this.searchKeyword() || undefined,
                isActive: this.statusFilter(),
                sortColumn: 'jobRoleId',
                sortDirection: 'asc'
            });
        } else {
            this.sortColumn.set(event.column as keyof JobRole);
            this.sortDirection.set(event.direction);
            this.jobRoleStore.sortJobRoles(this.sortColumn(), this.sortDirection());
        }
    }

    // 全選/取消全選
    onTableSelectAll(selected: boolean): void {
        if (selected) {
            this.selectedJobRoles.set([...this.jobRoles()]);
        } else {
            this.selectedJobRoles.set([]);
        }
    }

    // 單項選擇
    onSelectItem(jobRole: JobRole, selected: boolean): void {
        const current = this.selectedJobRoles();
        if (selected) {
            this.selectedJobRoles.set([...current, jobRole]);
        } else {
            this.selectedJobRoles.set(current.filter(item => item.jobRoleCode !== jobRole.jobRoleCode));
        }
    }

    // TableBody 事件處理
    onTableItemSelected(event: { item: JobRole; selected: boolean }): void {
        this.onSelectItem(event.item, event.selected);
    }

    // 已取消表格行點擊自動開啟檢視視窗
    // onTableRowClicked(jobRole: JobRole): void {
    //     this.onViewJobRole(jobRole);
    // }

    // 檢查項目是否被選中
    isSelected(jobRole: JobRole): boolean {
        return this.selectedJobRoles().some(item => item.jobRoleCode === jobRole.jobRoleCode);
    }

    isAllSelected(): boolean {
        const jobRoles = this.jobRoles();
        const selected = this.selectedJobRoles();
        return jobRoles.length > 0 && selected.length === jobRoles.length;
    }

    isPartiallySelected(): boolean {
        const selected = this.selectedJobRoles();
        return selected.length > 0 && !this.isAllSelected();
    }

    // 檢查是否需要固定高度 (數據行數 >= 10)
    shouldUseFixedHeight = computed(() => this.jobRoles().length >= 10);

    // 清除選擇
    clearSelection(): void {
        this.selectedJobRoles.set([]);
    }

    // 新增職務
    onCreateNew(): void {
        this.formMode.set('create');
        this.selectedJobRole.set(null);
        this.showForm.set(true);
    }

    // 編輯職務
    onEdit(jobRole: JobRole): void {
        this.formMode.set('edit');
        this.selectedJobRole.set(jobRole);
        this.showForm.set(true);
    }

    // 檢視職務
    onView(jobRole: JobRole): void {
        this.selectedJobRole.set(jobRole);
        this.showView.set(true);
    }

    // 刪除職務
    onDelete(jobRole: JobRole): void {
        this.actionJobRole.set(jobRole);
        this.showDeleteConfirm.set(true);
    }

    // 確認刪除職務
    onConfirmDelete(): void {
        const jobRole = this.actionJobRole();
        if (!jobRole) return;

        this.actionLoading.set(true);
        this.jobRoleService.deleteJobRole(jobRole.jobRoleId!).subscribe({
            next: (success) => {
                this.actionLoading.set(false);
                this.showDeleteConfirm.set(false);
                if (success) {
                    this.jobRoleStore.removeJobRole(jobRole.jobRoleId!);
                    this.messageService.success('職務已成功刪除');
                } else {
                    this.messageService.error('刪除失敗');
                }
            },
            error: (error) => {
                this.actionLoading.set(false);
                this.showDeleteConfirm.set(false);
                console.error('Delete job role error:', error);
                this.messageService.error('刪除失敗，請稍後再試');
            }
        });
    }

    // 切換職務狀態
    // onToggleStatus(jobRole: JobRole): void {
    //     const newStatus = !jobRole.isActive;
    //     const updateDto = {
    //         jobRoleId: jobRole.jobRoleId!,
    //         jobRoleCode: jobRole.jobRoleCode,
    //         jobRoleName: jobRole.jobRoleName,
    //         description: jobRole.description,
    //         isActive: newStatus
    //     };

    //     this.jobRoleService.updateJobRole(jobRole.jobRoleId!, updateDto).subscribe({
    //         next: (response) => {
    //             if (response) {
    //                 this.jobRoleStore.updateJobRole(response);
    //             }
    //         },
    //         error: (error) => {
    //             console.error('Toggle status error:', error);
    //         }
    //     });
    // }

    onToggleStatus(jobRole: JobRole): void {
        this.actionJobRole.set(jobRole);
        this.showStatusConfirm.set(true);
    }

    // 確認切換狀態
    onConfirmToggleStatus(): void {
        const jobRole = this.actionJobRole();
        if (!jobRole) return;

        this.actionLoading.set(true);
        this.jobRoleService.toggleActiveStatus(jobRole.jobRoleId!).subscribe({
            next: (updatedJobRole) => {
                this.actionLoading.set(false);
                this.showStatusConfirm.set(false);
                if (updatedJobRole) {
                    this.jobRoleStore.updateJobRole(updatedJobRole);
                    const targetStatus = updatedJobRole.isActive ? '啟用' : '停用';
                    this.messageService.success(`職務狀態已切換為${targetStatus}`);
                } else {
                    this.messageService.error('狀態切換失敗');
                }
            },
            error: (error) => {
                this.actionLoading.set(false);
                this.showStatusConfirm.set(false);
                console.error('切換狀態失敗:', error);
                this.messageService.error('狀態切換失敗，請稍後再試');
            }
        });
    }

    // Modal 關閉方法
    onCancelDelete(): void {
        this.showDeleteConfirm.set(false);
        this.actionJobRole.set(null);
    }

    onCancelStatusToggle(): void {
        this.showStatusConfirm.set(false);
        this.actionJobRole.set(null);
    }

    // 建立舊方法的別名以保持向後相容
    onCreateJobRole(): void { this.onCreateNew(); }
    onEditJobRole(jobRole: JobRole): void { this.onEdit(jobRole); }
    onViewJobRole(jobRole: JobRole): void { this.onView(jobRole); }
    onDeleteJobRole(jobRole: JobRole): void { this.onDelete(jobRole); }

    // 批量刪除
    onBulkDelete(): void {
        this.showBulkDeleteConfirm.set(true);
    }

    // 確認批量刪除
    onConfirmBulkDelete(): void {
        this.confirmBulkDelete();
    }

    // 統一命名 (與 competency-list 統一)
    confirmBulkDelete(): void {
        this.bulkDeleteLoading.set(true);
        this.showBulkDeleteConfirm.set(false);
        this.performBulkDelete();
    }

    private performBulkDelete(): void {
        const selectedJobRoles = this.selectedJobRoles();
        const ids = selectedJobRoles.map(jr => jr.jobRoleId).filter(id => id !== undefined) as number[];

        if (ids.length === 0) {
            this.bulkDeleteLoading.set(false);
            return;
        }

        // 使用新的 bulkDelete 方法
        this.jobRoleService.bulkDeleteJobRoles(ids).subscribe({
            next: (success) => {
                this.bulkDeleteLoading.set(false);
                if (success) {
                    // 重新載入資料
                    this.jobRoleStore.loadJobRoles();
                    this.clearSelection();
                }
            },
            error: (error) => {
                this.bulkDeleteLoading.set(false);
                console.error('Bulk delete error:', error);
            }
        });
    }

    // 匯出資料
    exportData(): void {
        // TODO: 實現匯出功能
        console.log('Export data');
    }

    // 全選處理 (與 competency-list 統一命名)
    onSelectAll(event: Event): void {
        const target = event.target as HTMLInputElement;
        const checked = target.checked;

        if (checked) {
            this.selectedJobRoles.set([...this.jobRoles()]);
        } else {
            this.selectedJobRoles.set([]);
        }
    }

    // 切換單項選擇 (與 competency-list 統一命名)
    onToggleSelection(jobRole: JobRole): void {
        const current = this.selectedJobRoles();
        const isSelected = current.some(s => s.jobRoleCode === jobRole.jobRoleCode);

        if (isSelected) {
            this.selectedJobRoles.set(current.filter(s => s.jobRoleCode !== jobRole.jobRoleCode));
        } else {
            this.selectedJobRoles.set([...current, jobRole]);
        }
    }

    // 清除搜尋
    clearSearch(): void {
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.loadJobRoles();
        this.clearSelection();
    }

    // 表單儲存處理
    onJobRoleSaved(jobRole: JobRole): void {
        if (this.formMode() === 'create') {
            this.jobRoleStore.addJobRole(jobRole);
        } else {
            this.jobRoleStore.updateJobRole(jobRole);
        }
        this.showForm.set(false);
        this.selectedJobRole.set(null);
    }

    // 錯誤處理
    onRetry(): void {
        this.loadJobRoles();
    }

    // 清除錯誤
    clearError(): void {
        this.jobRoleStore.clearError();
    }

    // 動作按鈕事件處理 (與 competency-list 統一命名)
    onActionView(jobRole: JobRole): void {
        this.onView(jobRole);
    }

    onActionEdit(jobRole: JobRole): void {
        this.onEdit(jobRole);
    }

    onActionDelete(jobRole: JobRole): void {
        this.onDelete(jobRole);
    }

    // 表單事件處理 (與 competency-list 統一命名)
    onFormSaved(jobRole: JobRole): void {
        this.onJobRoleSaved(jobRole);
    }

    onFormCancelled(): void {
        this.showForm.set(false);
        this.selectedJobRole.set(null);
    }

    onViewClosed(): void {
        this.showView.set(false);
        this.selectedJobRole.set(null);
    }

    // 狀態切換處理 (使用新的 toggleActiveStatus 方法)
    onStatusToggled(jobRole: JobRole, newStatus: boolean): void {
        if (jobRole.jobRoleId) {
            this.jobRoleService.toggleActiveStatus(jobRole.jobRoleId).subscribe({
                next: (response) => {
                    if (response) {
                        this.jobRoleStore.updateJobRole(response);
                    }
                },
                error: (error) => {
                    console.error('Toggle job role status error:', error);
                }
            });
        }
    }

    // 獲取行動按鈕配置
    getActionConfig(jobRole: JobRole): ActionButtonConfig {
        return {
            buttons: [
                {
                    type: 'view' as const,
                    visible: this.permissions().read
                },
                {
                    type: 'edit' as const,
                    visible: this.permissions().update
                },
                {
                    type: 'delete' as const,
                    visible: this.permissions().delete
                }
            ],
            size: 'sm' as const,
            orientation: 'horizontal' as const,
            itemName: jobRole.jobRoleName
        };
    }

    // 獲取狀態配置
    getStatusConfig(jobRole: JobRole): StatusConfig {
        return {
            value: jobRole.isActive,
            activeValue: true,
            inactiveValue: false,
            activeText: '啟用',
            inactiveText: '停用',
            clickable: true,
            size: 'sm'
        };
    }

    // 共享組件事件處理方法 (與 competency-list 統一命名)
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.jobRoleStore.searchJobRoles(keyword);
    }

    onFilterChange(event: { key: string; value: any }): void {
        switch (event.key) {
            case 'isActive':
                this.statusFilter.set(event.value as boolean | undefined);
                this.jobRoleStore.filterByStatus(event.value !== undefined ? event.value as boolean : null);
                break;
            case 'category':
                // 這裡暫時只設定過濾器值，如果需要可以添加類別過濾
                break;
        }
    }

    onEmptyStateAction(action: string): void {
        switch (action) {
            case 'clear-filters':
                this.clearSearch();
                break;
            case 'create-new':
                this.onCreateNew();
                break;
        }
    }
}
