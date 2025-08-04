import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
import { DepartmentStore } from '../../store/department.store';
import { DepartmentService } from '../../services/department.service';
import { DepartmentFormComponent } from '../../components/department-form/department-form.component';
import { DepartmentViewComponent } from '../../components/department-view/department-view.component';
import { Department, DEPARTMENT_LEVEL_OPTIONS } from '../../models/department.model';
import { UserStore } from '../../../../core/auth/user.store';
import type { User, Permission } from '../../../../models/user.model';
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
    imports: [
        CommonModule,
        // FormsModule,
        // RouterModule,
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
    readonly hasCreatePermission = computed(() => this.hasResourceActionPermission('department', 'create'));
    readonly hasUpdatePermission = computed(() => this.hasResourceActionPermission('department', 'update'));
    readonly hasDeletePermission = computed(() => this.hasResourceActionPermission('department', 'delete'));
    readonly hasReadPermission = computed(() => this.hasResourceActionPermission('department', 'read'));

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    levelFilter = signal<string | undefined>(undefined);
    showForm = signal(false);
    showView = signal(false);
    selectedDepartment = signal<Department | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortBy = signal<keyof Department>('deptCode');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedDepartments = signal<Department[]>([]);
    showBulkDeleteConfirm = signal(false);
    bulkDeleteLoading = signal(false);
    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋部門名稱、代碼...',
        searchLabel: '關鍵字搜尋',
        filters: [
            {
                key: 'is_active',
                label: '啟用狀態',
                options: [
                    { value: true, text: '啟用' },
                    { value: false, text: '停用' }
                ]
            },
            {
                key: 'dept_level',
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
        is_active: this.statusFilter(),
        dept_level: this.levelFilter()
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
        showSelectColumn: this.hasDeletePermission(),
        isAllSelected: this.isAllSelected(),
        isPartiallySelected: this.isPartiallySelected(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
        columns: [
            {
                key: 'dept_code',
                label: '部門代碼',
                sortable: true,
                width: '12%'
            },
            {
                key: 'dept_name',
                label: '部門名稱',
                sortable: true,
                width: '18%'
            },
            {
                key: 'dept_level',
                label: '部門層級',
                sortable: false,
                width: '10%'
            },
            {
                key: 'parent_dept_name',
                label: '上級部門',
                sortable: false,
                width: '15%'
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
            showSelectColumn: this.hasDeletePermission(),
            trackByFn: (index: number, item: Department) => item.deptId,
            rowCssClass: (item: Department) => this.isSelected(item) ? 'table-active' : '',
            columns: [
                {
                    key: 'dept_code',
                    template: this.codeTemplate,
                    cssClass: 'fw-medium text-primary',
                    width: '12%'
                },
                {
                    key: 'dept_name',
                    template: this.nameTemplate,
                    cssClass: 'fw-medium',
                    width: '18%'
                },
                {
                    key: 'dept_level',
                    template: this.levelTemplate,
                    align: 'center',
                    width: '10%'
                },
                {
                    key: 'parent_dept_name',
                    template: this.parentTemplate,
                    cssClass: 'text-muted',
                    width: '15%'
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
            sortBy: this.sortBy(),
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
        this.departmentStore.searchDepartments('');
    }

    clearError(): void {
        // 清除錯誤狀態的邏輯
        // 如果 department store 沒有 clearError 方法，可以留空或實作其他邏輯
    }

    onTableSort(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortBy.set(event.column as keyof Department);
        this.sortDirection.set(event.direction);
        this.departmentStore.sortDepartments(this.sortBy(), this.sortDirection());
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

    // getActionConfig(department: Department): ActionButtonConfig {
    //     const buttons: ActionButton[] = [];

    //     if (this.hasReadPermission()) {
    //         buttons.push({
    //             type: 'view',
    //             icon: 'bi bi-eye',
    //             text: '檢視',
    //             variant: 'info',
    //             visible: true
    //         });
    //     }

    //     if (this.hasUpdatePermission()) {
    //         buttons.push({
    //             type: 'edit',
    //             icon: 'bi bi-pencil',
    //             text: '編輯',
    //             variant: 'secondary',
    //             visible: true
    //         });
    //     }

    //     if (this.hasDeletePermission()) {
    //         buttons.push({
    //             type: 'delete',
    //             icon: 'bi bi-trash',
    //             text: '刪除',
    //             variant: 'danger',
    //             visible: true
    //         });
    //     }

    //     return {
    //         buttons,
    //         size: 'sm',
    //         itemName: department.dept_name
    //     };
    // }

    getActionConfig(department: Department): ActionButtonConfig {
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
        //console.log('Department Filter Change:', event);

        switch (event.key) {
            case 'is_active':
                this.statusFilter.set(event.value as boolean | undefined);
                this.departmentStore.filterByStatus(event.value as boolean | undefined);
                break;
            case 'dept_level':
                this.levelFilter.set(event.value);
                this.departmentStore.filterByLevel(event.value);
                break;
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
        this.departmentStore.setPageSize(pageSize);
    }

    // 排序
    onSort(column: keyof Department): void {
        if (this.sortBy() === column) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortBy.set(column);
            this.sortDirection.set('asc');
        }
        this.departmentStore.sortDepartments(this.sortBy(), this.sortDirection());
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
        if (confirm(`確定要刪除部門「${department.deptName}」嗎？`)) {
            this.departmentService.deleteDepartment(department.deptId).subscribe({
                next: (success) => {
                    if (success) {
                        this.departmentStore.removeDepartment(department.deptId);
                    }
                },
                error: (error) => {
                    console.error('刪除部門失敗:', error);
                }
            });
        }
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
        const deletePromises = selected.map(dept =>
            this.departmentService.deleteDepartment(dept.deptId).toPromise()
        );

        Promise.all(deletePromises).then(() => {
            this.selectedDepartments.set([]);
            this.bulkDeleteLoading.set(false);
            this.loadDepartments(); // 重新載入資料
        }).catch((error: any) => {
            console.error('批量刪除失敗:', error);
            this.bulkDeleteLoading.set(false);
        });
    }

    // 狀態切換
    // onToggleStatus(department: Department): void {
    //     const updatedDepartment = { ...department, is_active: !department.is_active };
    //     this.departmentService.updateDepartment(updatedDepartment.dept_id!, updatedDepartment).subscribe({
    //         next: () => {
    //             this.loadDepartments();
    //         },
    //         error: (error) => {
    //             console.error('切換狀態失敗:', error);
    //         }
    //     });
    // }
    onToggleStatus(department: Department): void {
        const targetStatus = department.isActive ? '停用' : '啟用';
        if (!confirm(`確定要將「${department.deptName}」的狀態切換至「${targetStatus}」嗎？`)) return;
        this.departmentService.toggleDepartmentStatus(department.deptId).subscribe({
            next: (updatedDepartment) => {
                if (updatedDepartment) {
                    this.departmentStore.updateDepartment(updatedDepartment);
                }
            },
            error: (error) => {
                console.error('切換狀態失敗:', error);
            }
        });
    }

    // 表單事件
    onFormSaved(department: Department): void {
        if (this.formMode() === 'create') {
            this.departmentStore.addDepartment(department);
        } else {
            this.departmentStore.updateDepartment(department);
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
        this.loadDepartments();
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
