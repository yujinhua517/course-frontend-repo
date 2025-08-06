import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CompetencyStore } from '../../store/competency.store';
import { CompetencyService } from '../../services/competency.service';
import { CompetencyFormComponent } from '../../components/competency-form/competency-form.component';
import { CompetencyViewComponent } from '../../components/competency-view/competency-view.component';
import { Competency } from '../../models/competency.model';
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

@Component({
    selector: 'app-competency-list',
    templateUrl: './competency-list.component.html',
    styleUrls: ['./competency-list.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        CompetencyFormComponent,
        CompetencyViewComponent,
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
export class CompetencyListComponent implements OnInit {
    private competencyStore = inject(CompetencyStore);
    private competencyService = inject(CompetencyService);
    // 權限判斷：基於 action 欄位的細緻權限控制
    private readonly userStore = inject(UserStore);

    // 檢查是否有指定 resource + action 的權限
    private hasResourceActionPermission(resource: string, action: string): boolean {
        const user = this.userStore.user() as User | null;
        if (!user) return false;
        return (user.permissions ?? []).some((p: Permission) =>
            p.resource === resource && p.action === action
        );
    }
    readonly hasCreatePermission = computed(() => this.hasResourceActionPermission('competency', 'create'));
    readonly hasUpdatePermission = computed(() => this.hasResourceActionPermission('competency', 'update'));
    readonly hasDeletePermission = computed(() => this.hasResourceActionPermission('competency', 'delete'));
    readonly hasReadPermission = computed(() => this.hasResourceActionPermission('competency', 'read'));

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    categoryFilter = signal<string | undefined>(undefined);
    showForm = signal(false);
    showView = signal(false);
    selectedCompetency = signal<Competency | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortBy = signal<keyof Competency>('job_role_code');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedCompetencies = signal<Competency[]>([]);
    showBulkDeleteConfirm = signal(false);


    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋職能名稱或代碼...',
        searchLabel: '關鍵字搜尋',
        filters: [
            {
                key: 'is_active',
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
        totalCountLabel: '筆職能資料',
        showClearButton: true
    }));

    // 計算當前篩選器值
    readonly currentFilterValues = computed(() => ({
        is_active: this.statusFilter(),
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
        ariaLabel: '職能列表分頁',
        disabled: this.loading()
    }));

    // 表頭配置
    readonly tableHeaderConfig = computed<TableHeaderConfig>(() => ({
        showSelectColumn: this.hasDeletePermission(), // 改為 showSelectColumn
        isAllSelected: this.isAllSelected(),
        isPartiallySelected: this.isPartiallySelected(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
        columns: [
            {
                key: 'job_role_code',
                label: '職能代碼',
                sortable: true,
                width: '12%'
            },
            {
                key: 'job_role_name',
                label: '職能名稱',
                sortable: true,
                width: '18%'
            },
            {
                key: 'description',
                label: '職能描述',
                sortable: false,
                width: '25%'
            },
            {
                key: 'status',
                label: '狀態',
                sortable: false,
                align: 'center',
                width: '10%'
            },
            {
                key: 'create_time',
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
            data: this.competencies(),
            showSelectColumn: this.hasDeletePermission(),
            trackByFn: (index: number, item: Competency) => item.job_role_code,
            rowCssClass: (item: Competency) => this.isSelected(item) ? 'table-active' : '',
            columns: [
                {
                    key: 'job_role_code',
                    template: this.codeTemplate,
                    cssClass: 'fw-medium text-primary',
                    width: '12%'
                },
                {
                    key: 'job_role_name',
                    template: this.nameTemplate,
                    cssClass: 'fw-medium',
                    width: '18%'
                },
                {
                    key: 'description',
                    template: this.descriptionTemplate,
                    cssClass: 'text-muted',
                    width: '25%'
                },
                {
                    key: 'status',
                    template: this.statusTemplate,
                    align: 'center',
                    width: '10%'
                },
                {
                    key: 'create_time',
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
        is_active: this.statusFilter(),
        category: this.categoryFilter()
    }));

    // 共用元件配置
    getStatusConfig(competency: Competency): StatusConfig {
        return {
            value: competency.is_active,
            activeValue: true,
            inactiveValue: false,
            activeText: '啟用',
            inactiveText: '停用',
            clickable: true,
            size: 'sm'
        };
    }

    getActionConfig(competency: Competency): ActionButtonConfig {
        return {
            buttons: [
                {
                    type: 'view',
                    visible: this.hasReadPermission()
                },
                {
                    type: 'edit',
                    visible: this.hasUpdatePermission()
                },
                {
                    type: 'delete',
                    visible: this.hasDeletePermission()
                }
            ],
            size: 'sm',
            orientation: 'horizontal',
            itemName: competency.job_role_name
        };
    }

    // 批量刪除信號
    bulkDeleteLoading = signal(false);

    // 載入狀態配置
    readonly loadingConfig = computed<LoadingStateConfig>(() => ({
        // show: true, // 由範本條件控制
        // message: '載入職能資料中...',
        // spinner: true,
        // overlay: false,
        // size: 'md'
        size: 'md',
        text: '正在載入職能資料...',
        showText: true,
        variant: 'primary',
        center: true
    }));


    // 錯誤訊息配置
    readonly errorConfig = computed<ErrorMessageConfig>(() => ({
        show: true, // 由範本條件控制
        message: this.error() || '',
        type: 'danger',
        dismissible: true,
        icon: 'exclamation-triangle-fill',
        size: 'md'
    }));

    // 空狀態配置
    readonly emptyStateConfig = computed<EmptyStateConfig>(() => {
        const hasFilters = this.searchKeyword() || this.statusFilter() !== undefined || this.categoryFilter() !== undefined;

        return {
            show: true, // 由範本條件控制
            icon: hasFilters ? 'search' : 'person-workspace',
            title: hasFilters ? '查無相符資料' : '暫無職能資料',
            message: hasFilters
                ? '找不到符合條件的職能資料，請調整搜尋條件後再試。'
                : '尚未建立任何職能資料，點擊上方按鈕開始新增。',
            actions: hasFilters
                ? [
                    {
                        label: '清除搜尋條件',
                        action: 'clear-filters',
                        icon: 'arrow-clockwise',
                        variant: 'outline-primary'
                    }
                ]
                : [
                    {
                        label: '新增第一個職能',
                        action: 'create-new',
                        icon: 'plus-circle',
                        variant: 'primary'
                    }
                ],
            size: 'md'
        };
    });

    // 批量刪除確認配置
    readonly bulkDeleteConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認批量刪除',
        message: `您即將刪除以下 ${this.selectedCompetencies().length} 個職能：`,
        type: 'danger',
        icon: 'exclamation-triangle',
        confirmText: '確認刪除',
        cancelText: '取消',
        size: 'md',
        items: this.selectedCompetencies().map(comp => ({
            id: comp.job_role_code,
            text: comp.job_role_code,
            subText: comp.job_role_name,
            icon: 'person-workspace'
        })),
        maxItemsToShow: 5,
        showItemIcon: true
    }));

    // Store signals
    competencies = this.competencyStore.competencies;
    loading = this.competencyStore.loading;
    error = this.competencyStore.error;
    total = this.competencyStore.total;
    currentPage = this.competencyStore.currentPage;
    pageSize = this.competencyStore.pageSize;
    totalPages = this.competencyStore.totalPages;
    hasNextPage = this.competencyStore.hasNextPage;
    hasPreviousPage = this.competencyStore.hasPreviousPage;

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

    ngOnInit(): void {
        this.loadCompetencies();
    }

    loadCompetencies(): void {
        this.competencyStore.loadCompetencies({
            keyword: this.searchKeyword() || undefined,
            is_active: this.statusFilter() ?? undefined,
            sortBy: this.sortBy(),
            sort_direction: this.sortDirection()
        });
    }

    onSearch(): void {
        this.competencyStore.searchCompetencies(this.searchKeyword());
    }

    onFilterByStatus(status: boolean | undefined): void {
        this.statusFilter.set(status);
        this.competencyStore.filterByStatus(status);
    }

    onSort(column: keyof Competency): void {
        if (this.sortBy() === column) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortBy.set(column);
            this.sortDirection.set('asc');
        }
        this.competencyStore.sortCompetencies(this.sortBy(), this.sortDirection());
    }

    getSortIcon(column: keyof Competency): string {
        if (this.sortBy() !== column) return 'bi-chevron-expand';
        return this.sortDirection() === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down';
    }

    // 表頭事件處理方法
    onTableSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        if (event.direction === null) {
            // 重設排序
            this.sortBy.set('job_role_code');
            this.sortDirection.set('asc');
            this.competencyStore.loadCompetencies({
                ...this.competencyStore.searchParams(),
                sort_column: undefined,
                sort_direction: undefined
            });
        } else {
            this.sortBy.set(event.column as keyof Competency);
            this.sortDirection.set(event.direction);
            this.competencyStore.sortCompetencies(this.sortBy(), this.sortDirection());
        }
    }

    onTableSelectAll(checked: boolean): void {
        if (checked) {
            this.selectedCompetencies.set([...this.competencies()]);
        } else {
            this.selectedCompetencies.set([]);
        }
    }

    onPageChange(page: number): void {
        if (typeof page === 'number') {
            this.competencyStore.goToPage(page);
        }
    }

    onPageSizeChange(eventOrSize: Event | number): void {
        let pageSize: number;
        if (typeof eventOrSize === 'number') {
            pageSize = eventOrSize;
        } else {
            const select = eventOrSize.target as HTMLSelectElement;
            pageSize = parseInt(select.value, 10);
        }
        this.competencyStore.setPageSize(pageSize);
    }

    onCreateNew(): void {
        this.formMode.set('create');
        this.selectedCompetency.set(null);
        this.showForm.set(true);
    }

    onEdit(competency: Competency): void {
        this.formMode.set('edit');
        this.selectedCompetency.set(competency);
        this.showForm.set(true);
    }

    onView(competency: Competency): void {
        this.selectedCompetency.set(competency);
        this.showView.set(true);
    }

    onDelete(competency: Competency): void {
        if (confirm(`確定要刪除職能「${competency.job_role_name}」嗎？`)) {
            this.competencyService.deleteCompetency(competency.job_role_code).subscribe({
                next: (response) => {
                    if (response.code === 200) {
                        this.competencyStore.removeCompetency(competency.job_role_code);
                        alert('職能已成功刪除');
                    } else {
                        alert(response.message || '刪除失敗');
                    }
                },
                error: (error) => {
                    console.error('Delete error:', error);
                    alert('刪除失敗，請稍後再試');
                }
            });
        }
    }

    onToggleStatus(competency: Competency): void {
        const targetStatus = !competency.is_active;
        const statusText = targetStatus ? '啟用' : '停用';

        if (!confirm(`確定要將「${competency.job_role_name}」的狀態切換至「${statusText}」嗎？`)) {
            return;
        }

        this.competencyService.batchUpdateCompetencyStatus([competency.job_role_code], targetStatus).subscribe({
            next: (response) => {
                if (response.code === 200) {
                    // 更新本地狀態
                    const updatedCompetency = { ...competency, is_active: targetStatus };
                    this.competencyStore.updateCompetency(updatedCompetency);
                    alert(`職能「${competency.job_role_name}」的狀態已更新為：${statusText}`);
                } else {
                    alert(response.message || '狀態更新失敗');
                }
            },
            error: (error: any) => {
                console.error('Toggle status error:', error);
                alert('狀態更新失敗，請稍後再試');
            }
        });
    }

    // 共用元件事件處理
    onActionView(competency: Competency): void {
        this.onView(competency);
    }

    onActionEdit(competency: Competency): void {
        this.onEdit(competency);
    }

    onActionDelete(competency: Competency): void {
        this.onDelete(competency);
    }

    onFormSaved(competency: Competency): void {
        if (this.formMode() === 'create') {
            this.competencyStore.addCompetency(competency);
        } else {
            this.competencyStore.updateCompetency(competency);
        }
        this.showForm.set(false);
        this.loadCompetencies(); // 重新載入以確保資料一致性
    }

    onFormCancelled(): void {
        this.showForm.set(false);
    }

    onViewClosed(): void {
        this.showView.set(false);
    }

    clearSearch(): void {
        // 清除所有搜尋和篩選條件
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.categoryFilter.set(undefined);

        // 重新載入資料
        this.competencyStore.searchCompetencies('');
    }

    exportData(): void {
        // TODO: 實作匯出功能
        alert('匯出功能開發中...');
    }

    // Bulk selection methods
    onSelectAll(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            this.selectedCompetencies.set([...this.competencies()]);
        } else {
            this.selectedCompetencies.set([]);
        }
    }

    onToggleSelection(competency: Competency): void {
        const current = this.selectedCompetencies();
        const isSelected = current.some(c => c.job_role_code === competency.job_role_code);

        if (isSelected) {
            this.selectedCompetencies.set(current.filter(c => c.job_role_code !== competency.job_role_code));
        } else {
            this.selectedCompetencies.set([...current, competency]);
        }
    }

    isSelected(competency: Competency): boolean {
        return this.selectedCompetencies().some(c => c.job_role_code === competency.job_role_code);
    }

    isAllSelected(): boolean {
        const competencies = this.competencies();
        const selected = this.selectedCompetencies();
        return competencies.length > 0 && selected.length === competencies.length;
    }

    isPartiallySelected(): boolean {
        const selected = this.selectedCompetencies();
        return selected.length > 0 && !this.isAllSelected();
    }

    onBulkDelete(): void {
        const selectedCount = this.selectedCompetencies().length;
        if (selectedCount === 0) return;

        this.showBulkDeleteConfirm.set(true);
    }

    confirmBulkDelete(): void {
        this.bulkDeleteLoading.set(true);
        this.showBulkDeleteConfirm.set(false);
        this.performBulkDelete();
    }

    private performBulkDelete(): void {
        const selectedCodes = this.selectedCompetencies().map(c => c.job_role_code);

        // 使用服務的批量刪除方法
        this.competencyService.bulkDeleteCompetencies(selectedCodes).subscribe({
            next: (response) => {
                if (response.code === 200 && response.data > 0) {
                    // 清除選中狀態
                    this.selectedCompetencies.set([]);
                    // 重新載入資料
                    this.loadCompetencies();
                    alert(`已成功刪除 ${response.data} 個職能`);
                } else {
                    alert(response.message || '批量刪除失敗');
                }
                this.bulkDeleteLoading.set(false);
            },
            error: (error) => {
                console.error('批量刪除失敗:', error);
                alert('批量刪除失敗，請稍後再試');
                this.bulkDeleteLoading.set(false);
            }
        });
    }

    // 共享組件事件處理方法
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.competencyStore.searchCompetencies(keyword);
    }

    onFilterChange(event: { key: string; value: any }): void {
        switch (event.key) {
            case 'is_active':
                this.statusFilter.set(event.value as boolean | undefined);
                this.competencyStore.filterByStatus(event.value as boolean | undefined);
                break;
            case 'category':
                this.categoryFilter.set(event.value);
                // 這裡暫時只設定過濾器值，如果 store 有實作相關方法可以調用
                break;
        }
    }

    // 新增的共享組件事件處理方法
    clearError(): void {
        // 清除錯誤狀態的邏輯
        this.competencyStore.clearError?.();
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

    // Table Body 事件處理
    onTableItemSelected(event: { item: Competency; selected: boolean }): void {
        if (event.selected) {
            const current = this.selectedCompetencies();
            this.selectedCompetencies.set([...current, event.item]);
        } else {
            const current = this.selectedCompetencies();
            this.selectedCompetencies.set(current.filter(c => c.job_role_code !== event.item.job_role_code));
        }
    }

    onTableRowClicked(competency: Competency): void {
        // 可以在這裡處理行點擊事件，例如顯示詳情
        // this.onView(competency);
    }
}