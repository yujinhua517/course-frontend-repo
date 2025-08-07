import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentStore } from '../../store/department.store';
import { DepartmentService } from '../../services/department.service';
import { DepartmentFormComponent } from '../../components/department-form/department-form.component';
import { DepartmentViewComponent } from '../../components/department-view/department-view.component';
import { Department, DEPARTMENT_LEVEL_OPTIONS } from '../../models/department.model';
import { UserStore } from '../../../../core/auth/user.store';
import type { User, Permission } from '../../../../models/user.model';
import { GlobalMessageService } from '../../../../core/message/global-message.service';
import { TableHeaderComponent, TableHeaderConfig, TableColumn } from '../../../../shared/components/table-header/table-header.component';
import { TableBodyComponent, TableBodyConfig, TableBodyColumn } from '../../../../shared/components/table-body/table-body.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ActionButtonGroupComponent, ActionButton, ActionButtonConfig } from '../../../../shared/components/action-buttons/action-button-group.component';
import { SearchFilterComponent, SearchFilterConfig } from '../../../../shared/components/search-filter/search-filter.component';
import { PaginationComponent, PaginationConfig } from '../../../../shared/components/pagination/pagination.component';
import { LoadingStateComponent, LoadingStateConfig } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageComponent, ErrorMessageConfig } from '../../../../shared/components/error-message/error-message.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';
import type { StatusConfig } from '../../../../shared/components/status-badge/status-badge.component';
import { HighlightPipe } from '../../../../shared/pipes/highlight.pipe';

@Component({
    selector: 'app-department-list',
    templateUrl: './department-list.component.html',
    styleUrls: ['./department-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        DepartmentFormComponent,
        DepartmentViewComponent,
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
export class DepartmentListComponent implements OnInit {
    private departmentStore = inject(DepartmentStore);
    private departmentService = inject(DepartmentService);
    private messageService = inject(GlobalMessageService);
    // 權限管理
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
            create: hasPermission('department', 'create'),
            read: hasPermission('department', 'read'),
            update: hasPermission('department', 'update'),
            delete: hasPermission('department', 'delete')
        };
    });

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    levelFilter = signal<string | undefined>(undefined);
    showForm = signal(false);
    showView = signal(false);
    selectedDepartment = signal<Department | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortColumn = signal<keyof Department>('deptId');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedDepartments = signal<Department[]>([]);
    showBulkDeleteConfirm = signal(false);
    bulkDeleteLoading = signal(false);

    // Individual action signals
    showDeleteConfirm = signal(false);
    showStatusConfirm = signal(false);
    actionDepartment = signal<Department | null>(null);
    actionLoading = signal(false);
    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋部門名稱、代碼...',
        searchLabel: '關鍵字搜尋',
        filters: [
            {
                key: 'isActive',
                label: '啟用狀態',
                options: [
                    { value: true, text: '啟用' },
                    { value: false, text: '停用' }
                ]
            },
            {
                key: 'deptLevel',
                label: '部門層級',
                options: DEPARTMENT_LEVEL_OPTIONS.map(option => ({
                    value: option.value,
                    text: option.label
                }))
            }
        ],
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        totalCountLabel: '筆部門資料',
        showClearButton: true
    }));

    // 計算當前篩選器值
    readonly currentFilterValues = computed(() => ({
        isActive: this.statusFilter(),
        deptLevel: this.levelFilter()
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
        ariaLabel: '部門列表分頁',
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
                key: 'deptId',
                label: 'No.',
                sortable: true,
                width: '8%'
            },
            {
                key: 'deptCode',
                label: '部門代碼',
                sortable: true,
                width: '11%'
            },
            {
                key: 'deptName',
                label: '部門名稱',
                sortable: true,
                width: '15%'
            },
            {
                key: 'deptLevel',
                label: '部門層級',
                sortable: false,
                width: '11%'
            },
            {
                key: 'parentDeptName',
                label: '上級部門',
                sortable: false,
                width: '15%'
            },
            {
                key: 'isActive',
                label: '狀態',
                sortable: false,
                align: 'center',
                width: '11%'
            },
            {
                key: 'createTime',
                label: '建立時間',
                sortable: true,
                width: '14%'
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
    @ViewChild('levelTemplate', { static: true }) levelTemplate!: TemplateRef<any>;
    @ViewChild('parentTemplate', { static: true }) parentTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('timeTemplate', { static: true }) timeTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    readonly tableBodyConfig = computed<TableBodyConfig>(() => {
        if (!this.codeTemplate) {
            return {
                data: [],
                showSelectColumn: false,
                columns: []
            };
        }

        return {
            data: this.departments(),
            showSelectColumn: this.permissions().delete,
            trackByFn: (index: number, item: Department) => item.deptId,
            rowCssClass: (item: Department) => this.isSelected(item) ? 'table-active' : '',
            columns: [
                {
                    key: 'deptId',
                    template: this.idTemplate,
                    cssClass: 'fw-normal',
                    width: '8%'
                },
                {
                    key: 'deptCode',
                    template: this.codeTemplate,
                    cssClass: 'fw-medium text-primary',
                    width: '11%'
                },
                {
                    key: 'deptName',
                    template: this.nameTemplate,
                    cssClass: 'fw-medium',
                    width: '15%'
                },
                {
                    key: 'deptLevel',
                    template: this.levelTemplate,
                    align: 'center',
                    width: '11%'
                },
                {
                    key: 'parentDeptName',
                    template: this.parentTemplate,
                    cssClass: 'text-muted',
                    width: '15%'
                },
                {
                    key: 'isActive',
                    template: this.statusTemplate,
                    align: 'center',
                    width: '11%'
                },
                {
                    key: 'createTime',
                    template: this.timeTemplate,
                    cssClass: 'text-muted small',
                    width: '14%'
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

    // 載入狀態配置
    readonly loadingConfig = computed<LoadingStateConfig>(() => ({
        size: 'md',
        text: '正在載入部門資料...',
        showText: true,
        variant: 'primary',
        center: true
    }));

    // 錯誤訊息配置
    readonly errorConfig = computed<ErrorMessageConfig>(() => ({
        show: true,
        message: this.error() || '',
        type: 'danger',
        dismissible: true,
        icon: 'exclamation-triangle-fill',
        size: 'md'
    }));

    // 空狀態配置
    readonly emptyStateConfig = computed<EmptyStateConfig>(() => {
        const hasFilters = this.searchKeyword() || this.statusFilter() !== undefined || this.levelFilter() !== undefined;

        return {
            show: true,
            icon: hasFilters ? 'search' : 'building',
            title: hasFilters ? '查無相符資料' : '暫無部門資料',
            message: hasFilters
                ? '找不到符合條件的部門資料，請調整搜尋條件後再試。'
                : '尚未建立任何部門資料，點擊上方按鈕開始新增。',
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
                        label: '新增第一個部門',
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
        message: `您即將刪除以下 ${this.selectedDepartments().length} 個部門：`,
        type: 'danger',
        icon: 'exclamation-triangle',
        confirmText: '確認刪除',
        cancelText: '取消',
        size: 'md',
        items: this.selectedDepartments().map(dept => ({
            id: dept.deptId.toString(),
            text: dept.deptCode,
            subText: dept.deptName,
            icon: 'building'
        })),
        maxItemsToShow: 100,
        showItemIcon: true
    }));

    readonly deleteConfirmConfig = computed<ConfirmationModalConfig>(() => {
        const department = this.actionDepartment();
        return {
            title: '確認刪除部門',
            message: `您確定要刪除部門「${department?.deptName}」(${department?.deptCode})嗎？此操作無法復原。`,
            type: 'danger',
            confirmText: '確認刪除',
            cancelText: '取消'
        };
    });

    readonly statusConfirmConfig = computed<ConfirmationModalConfig>(() => {
        const department = this.actionDepartment();
        const isActive = department?.isActive;
        return {
            title: `確認${isActive ? '停用' : '啟用'}部門`,
            message: `您確定要${isActive ? '停用' : '啟用'}部門「${department?.deptName}」(${department?.deptCode})嗎？`,
            type: isActive ? 'warning' : 'info',
            confirmText: `確認${isActive ? '停用' : '啟用'}`,
            cancelText: '取消'
        };
    });

    // Store signals
    departments = this.departmentStore.departments;
    loading = this.departmentStore.loading;
    error = this.departmentStore.error;
    total = this.departmentStore.total;
    currentPage = this.departmentStore.currentPage;
    pageSize = this.departmentStore.pageSize;
    totalPages = this.departmentStore.totalPages;
    hasNextPage = this.departmentStore.hasNextPage;
    hasPreviousPage = this.departmentStore.hasPreviousPage;

    constructor() {
        // 監聽 loading 狀態變化（如employee實作）
        effect(() => {
            //console.log('Department List Component: Loading state changed to:', this.loading());
        });
    }

    // Computed
    isAllSelected = computed(() => {
        const departments = this.departments();
        const selected = this.selectedDepartments();
        return departments.length > 0 && selected.length === departments.length;
    });

    isPartiallySelected = computed(() => {
        const selected = this.selectedDepartments();
        return selected.length > 0 && !this.isAllSelected();
    });

    ngOnInit(): void {
        this.loadDepartments();
    }

    loadDepartments(): void {
        this.departmentStore.loadDepartments({
            keyword: this.searchKeyword() || undefined,
            isActive: this.statusFilter() ?? undefined,
            deptLevel: this.levelFilter() ?? undefined,
            sortColumn: this.sortColumn(),
            sortDirection: this.sortDirection()
        });
    }

    onSearch(): void {
        this.departmentStore.searchDepartments(this.searchKeyword());
    }

    // 共享組件事件處理方法
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.departmentStore.searchDepartments(keyword);
    }

    clearSearch(): void {
        // 清除所有搜尋和篩選條件
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.levelFilter.set(undefined);

        // 重新載入資料
        this.departmentStore.clearFilters();
    }

    clearError(): void {
        this.departmentStore.clearError();
    }

    // onTableSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
    //     // 支援三階段排序：如果 column 為空字串或 direction 為 null，表示重設為無排序
    //     if (!event.column || event.direction === null) {
    //         this.sortBy.set('deptCode'); // 重設為預設排序欄位
    //         this.sortDirection.set('asc');
    //     } else {
    //         this.sortBy.set(event.column as keyof Department);
    //         this.sortDirection.set(event.direction);
    //     }

    //     this.loadDepartments();
    // }

    // 表頭事件處理方法
    onTableSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        if (event.direction === null) {
            // 重設排序到預設值
            this.sortColumn.set('deptId');
            this.sortDirection.set('asc');
            // 直接調用 loadDepartments 以確保使用最新的 sortColumn 和 sortDirection
            this.loadDepartments();
        } else {
            this.sortColumn.set(event.column as keyof Department);
            this.sortDirection.set(event.direction);
            this.departmentStore.sortDepartments(this.sortColumn(), this.sortDirection());
        }
    }

    onTableSelectAll(selected: boolean): void {
        this.onSelectAll(selected);
    }

    onTableItemSelected(event: { item: Department; selected: boolean }): void {
        this.onSelectItem(event.item, event.selected);
    }

    onTableRowClicked(department: Department): void {
        //this.onView(department);
    }

    getActionConfig(department: Department): ActionButtonConfig {
        return {
            buttons: [
                {
                    type: 'view',
                    visible: this.permissions().read
                },
                {
                    type: 'edit',
                    visible: this.permissions().update
                },
                {
                    type: 'delete',
                    visible: this.permissions().delete
                }
            ],
            size: 'sm',
            orientation: 'horizontal',
            itemName: department.deptName
        };
    }

    onActionView(department: Department): void {
        this.onView(department);
    }

    onActionEdit(department: Department): void {
        this.onEdit(department);
    }

    onActionDelete(department: Department): void {
        this.onDelete(department);
    }

    batchDelete(): void {
        this.onBulkDelete();
    }

    exportData(): void {
        // TODO: Implement export functionality
        console.log('Export data functionality to be implemented');
    }

    // 篩選
    onFilterByStatus(status: boolean | undefined): void {
        this.statusFilter.set(status);
        this.departmentStore.filterByStatus(status);
    }

    onFilterChange(event: { key: string; value: any }): void {
        const actions = {
            'isActive': () => {
                this.statusFilter.set(event.value as boolean | undefined);
                this.departmentStore.filterByStatus(event.value as boolean | undefined);
            },
            'deptLevel': () => {
                this.levelFilter.set(event.value);
                this.departmentStore.filterByLevel(event.value);
            }
        };

        const action = actions[event.key as keyof typeof actions];
        if (action) {
            action();
        }
    }

    // 分頁
    onPageChange(page: number): void {
        if (typeof page === 'number') {
            this.departmentStore.goToPage(page);
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
        this.departmentStore.changePageSize(pageSize);
    }

    // 排序 - 支援三階段排序（升冪/降冪/無排序）
    onSort(column: keyof Department): void {
        if (this.sortColumn() === column) {
            // 同一欄位：asc -> desc -> 重設為預設排序
            if (this.sortDirection() === 'asc') {
                this.sortDirection.set('desc');
            } else {
                // 重設為預設排序（部門代碼升冪）
                this.sortColumn.set('deptId');
                this.sortDirection.set('asc');
            }
        } else {
            this.sortColumn.set(column);
            this.sortDirection.set('asc');
        }
        this.loadDepartments();
    }

    // 選擇操作
    onSelectAll(selected: boolean): void {
        if (selected) {
            this.selectedDepartments.set([...this.departments()]);
        } else {
            this.selectedDepartments.set([]);
        }
    }

    onSelectItem(item: Department, selected: boolean): void {
        const currentSelected = this.selectedDepartments();
        if (selected) {
            this.selectedDepartments.set([...currentSelected, item]);
        } else {
            this.selectedDepartments.set(currentSelected.filter(d => d.deptId !== item.deptId));
        }
    }

    isSelected(item: Department): boolean {
        return this.selectedDepartments().some(d => d.deptId === item.deptId);
    }

    // CRUD 操作
    onCreateNew(): void {
        this.onAdd();
    }

    onAdd(): void {
        this.selectedDepartment.set(null);
        this.formMode.set('create');
        this.showForm.set(true);
    }

    onEdit(department: Department): void {
        this.selectedDepartment.set(department);
        this.formMode.set('edit');
        this.showForm.set(true);
    }

    onView(department: Department): void {
        this.selectedDepartment.set(department);
        this.showView.set(true);
    }

    onDelete(department: Department): void {
        this.actionDepartment.set(department);
        this.showDeleteConfirm.set(true);
    }

    // 確認刪除部門
    onConfirmDelete(): void {
        const department = this.actionDepartment();
        if (!department) return;

        this.actionLoading.set(true);
        this.departmentService.deleteDepartment(department.deptId).subscribe({
            next: (success) => {
                this.actionLoading.set(false);
                this.showDeleteConfirm.set(false);
                if (success) {
                    this.departmentStore.removeDepartment(department.deptId);
                    this.messageService.success(`部門「${department.deptName}」已成功刪除`);
                } else {
                    this.messageService.error('刪除失敗');
                }
            },
            error: (error) => {
                this.actionLoading.set(false);
                this.showDeleteConfirm.set(false);
                console.error('刪除部門失敗:', error);
                this.messageService.error('刪除失敗，請稍後再試');
            }
        });
    }

    onBulkDelete(): void {
        const selectedCount = this.selectedDepartments().length;
        if (selectedCount === 0) return;

        this.showBulkDeleteConfirm.set(true);
    }

    confirmBulkDelete(): void {
        this.bulkDeleteLoading.set(true);
        this.showBulkDeleteConfirm.set(false);
        this.performBulkDelete();
    }

    private performBulkDelete(): void {
        const selected = this.selectedDepartments();
        const ids = selected.map(dept => dept.deptId);

        if (ids.length === 0) {
            this.bulkDeleteLoading.set(false);
            return;
        }

        // 使用新的 bulkDelete 方法
        this.departmentService.bulkDeleteDepartments(ids).subscribe({
            next: (success) => {
                this.bulkDeleteLoading.set(false);
                if (success) {
                    // 重新載入資料
                    this.departmentStore.loadDepartments();
                    this.selectedDepartments.set([]);
                }
            },
            error: (error) => {
                this.bulkDeleteLoading.set(false);
                console.error('Bulk delete error:', error);
            }
        });
    }

    onToggleStatus(department: Department): void {
        this.actionDepartment.set(department);
        this.showStatusConfirm.set(true);
    }

    // 確認切換狀態
    onConfirmToggleStatus(): void {
        const department = this.actionDepartment();
        if (!department) return;

        this.actionLoading.set(true);
        this.departmentService.toggleDepartmentStatus(department.deptId).subscribe({
            next: (updatedDepartment) => {
                this.actionLoading.set(false);
                this.showStatusConfirm.set(false);
                if (updatedDepartment) {
                    this.departmentStore.updateDepartment(updatedDepartment);
                    const targetStatus = updatedDepartment.isActive ? '啟用' : '停用';
                    this.messageService.success(`部門「${department.deptName}」狀態已切換為${targetStatus}`);
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
        this.actionDepartment.set(null);
    }

    onCancelStatusToggle(): void {
        this.showStatusConfirm.set(false);
        this.actionDepartment.set(null);
    }

    // 表單事件
    onFormSaved(department: Department): void {
        if (this.formMode() === 'create') {
            this.departmentStore.addDepartment(department);
            this.messageService.success(`部門「${department.deptName}」新增成功`);
        } else {
            this.departmentStore.updateDepartment(department);
            this.messageService.success(`部門「${department.deptName}」更新成功`);
        }
        this.showForm.set(false);
        this.loadDepartments(); // 重新載入以確保資料一致性
    }

    onFormCancelled(): void {
        this.showForm.set(false);
    }

    onViewClosed(): void {
        this.showView.set(false);
    }

    // 清除篩選
    onClearFilters(): void {
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.levelFilter.set(undefined);
        this.departmentStore.clearFilters();
    }

    // 空狀態動作
    onEmptyStateAction(action: string): void {
        switch (action) {
            case 'clear-filters':
                this.onClearFilters();
                break;
            case 'create-new':
                this.onAdd();
                break;
        }
    }

    // 狀態配置
    // getStatusConfig(isActive: boolean): StatusConfig {
    //     return {
    //         value: isActive,
    //         activeValue: true,
    //         inactiveValue: false,
    //         activeText: '啟用',
    //         inactiveText: '停用',
    //         clickable: true,
    //         size: 'sm'
    //     };
    // }

    getStatusConfig(department: Department): StatusConfig {
        return {
            value: department.isActive,
            activeValue: true,
            inactiveValue: false,
            activeText: '啟用',
            inactiveText: '停用',
            clickable: true,
            size: 'sm'
        };
    }

    // 部門層級配置
    getLevelConfig(level: string): { text: string; variant: string } {
        const option = DEPARTMENT_LEVEL_OPTIONS.find(opt => opt.value === level);
        return {
            text: option?.label || level,
            variant: option?.color || 'secondary'
        };
    }

    // 格式化日期
    formatDate(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}
