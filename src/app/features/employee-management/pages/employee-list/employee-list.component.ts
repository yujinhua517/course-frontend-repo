import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeStore } from '../../store/employee.store';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { EmployeeViewComponent } from '../../components/employee-view/employee-view.component';
import { Employee } from '../../models/employee.model';
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
    selector: 'app-employee-list',
    templateUrl: './employee-list.component.html',
    styleUrls: ['./employee-list.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        EmployeeFormComponent,
        EmployeeViewComponent,
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
export class EmployeeListComponent implements OnInit {
    private employeeStore = inject(EmployeeStore);
    private employeeService = inject(EmployeeService);
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
    readonly hasCreatePermission = computed(() => this.hasResourceActionPermission('employee', 'create'));
    readonly hasUpdatePermission = computed(() => this.hasResourceActionPermission('employee', 'update'));
    readonly hasDeletePermission = computed(() => this.hasResourceActionPermission('employee', 'delete'));
    readonly hasReadPermission = computed(() => this.hasResourceActionPermission('employee', 'read'));

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    departmentFilter = signal<number | undefined>(undefined);
    showForm = signal(false);
    showView = signal(false);
    selectedEmployee = signal<Employee | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortBy = signal<keyof Employee>('emp_code');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedEmployees = signal<Employee[]>([]);
    showBulkDeleteConfirm = signal(false);
    bulkDeleteLoading = signal(false);

    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋員工姓名、工號、部門...',
        searchLabel: '關鍵字搜尋',
        filters: [
            {
                key: 'is_active',
                label: '在職狀態',
                options: [
                    { value: true, text: '在職' },
                    { value: false, text: '離職' }
                ]
            }
        ],
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        totalCountLabel: '筆員工資料',
        showClearButton: true
    }));

    // 計算當前篩選器值
    readonly currentFilterValues = computed(() => ({
        is_active: this.statusFilter(),
        dept_id: this.departmentFilter()
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
        ariaLabel: '員工列表分頁',
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
                key: 'emp_code',
                label: '員工工號',
                sortable: true,
                width: '12%'
            },
            {
                key: 'emp_name',
                label: '員工姓名',
                sortable: true,
                width: '12%'
            },
            {
                key: 'emp_email',
                label: '電子郵件',
                sortable: false,
                width: '15%'
            },
            {
                key: 'dept_name',
                label: '所屬部門',
                sortable: false,
                width: '12%'
            },
            {
                key: 'job_title',
                label: '職稱',
                sortable: false,
                width: '12%'
            },
            {
                key: 'status',
                label: '狀態',
                sortable: false,
                align: 'center',
                width: '10%'
            },
            {
                key: 'hire_date',
                label: '入職日期',
                sortable: true,
                width: '12%'
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
    @ViewChild('emailTemplate', { static: true }) emailTemplate!: TemplateRef<any>;
    @ViewChild('deptTemplate', { static: true }) deptTemplate!: TemplateRef<any>;
    @ViewChild('jobTemplate', { static: true }) jobTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
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
            data: this.employees(),
            showSelectColumn: this.hasDeletePermission(),
            trackByFn: (index: number, item: Employee) => item.emp_id,
            rowCssClass: (item: Employee) => this.isSelected(item) ? 'table-active' : '',
            columns: [
                {
                    key: 'emp_code',
                    template: this.codeTemplate,
                    cssClass: 'fw-medium text-primary',
                    width: '12%'
                },
                {
                    key: 'emp_name',
                    template: this.nameTemplate,
                    cssClass: 'fw-medium',
                    width: '12%'
                },
                {
                    key: 'emp_email',
                    template: this.emailTemplate,
                    cssClass: 'text-muted',
                    width: '15%'
                },
                {
                    key: 'dept_name',
                    template: this.deptTemplate,
                    cssClass: 'text-muted',
                    width: '12%'
                },
                {
                    key: 'job_title',
                    template: this.jobTemplate,
                    cssClass: 'text-muted',
                    width: '12%'
                },
                {
                    key: 'status',
                    template: this.statusTemplate,
                    align: 'center',
                    width: '10%'
                },
                {
                    key: 'hire_date',
                    template: this.dateTemplate,
                    cssClass: 'text-muted small',
                    width: '12%'
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
        text: '正在載入員工資料...',
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
        const hasFilters = this.searchKeyword() || this.statusFilter() !== undefined || this.departmentFilter() !== undefined;

        return {
            show: true,
            icon: hasFilters ? 'search' : 'people',
            title: hasFilters ? '查無相符資料' : '暫無員工資料',
            message: hasFilters
                ? '找不到符合條件的員工資料，請調整搜尋條件後再試。'
                : '尚未建立任何員工資料，點擊上方按鈕開始新增。',
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
                        label: '新增第一個員工',
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
        message: `您即將刪除以下 ${this.selectedEmployees().length} 個員工：`,
        type: 'danger',
        icon: 'exclamation-triangle',
        confirmText: '確認刪除',
        cancelText: '取消',
        size: 'md',
        items: this.selectedEmployees().map(emp => ({
            id: emp.emp_id.toString(),
            text: emp.emp_code,
            subText: emp.emp_name,
            icon: 'person'
        })),
        maxItemsToShow: 5,
        showItemIcon: true
    }));

    // Store signals
    employees = this.employeeStore.employees;
    loading = this.employeeStore.loading;
    error = this.employeeStore.error;
    total = this.employeeStore.total;
    currentPage = this.employeeStore.currentPage;
    pageSize = this.employeeStore.pageSize;
    totalPages = this.employeeStore.totalPages;
    hasNextPage = this.employeeStore.hasNextPage;
    hasPreviousPage = this.employeeStore.hasPreviousPage;

    constructor() {
        // 監聽 loading 狀態變化
        effect(() => {
            console.log('Employee List Component: Loading state changed to:', this.loading());
        });
    }

    // Computed
    isAllSelected = computed(() => {
        const employees = this.employees();
        const selected = this.selectedEmployees();
        return employees.length > 0 && selected.length === employees.length;
    });

    isPartiallySelected = computed(() => {
        const selected = this.selectedEmployees();
        return selected.length > 0 && !this.isAllSelected();
    });

    ngOnInit(): void {
        console.log('Employee List Component: ngOnInit called');
        this.loadEmployees();
    }

    loadEmployees(): void {
        console.log('Employee List Component: loadEmployees called');
        this.employeeStore.loadEmployees({
            keyword: this.searchKeyword() || undefined,
            is_active: this.statusFilter() ?? undefined,
            sort_column: this.sortBy(),
            sort_direction: this.sortDirection().toUpperCase()
        });
    }

    onSearch(): void {
        this.employeeStore.searchEmployees(this.searchKeyword());
    }

    // 篩選
    onFilterChange(event: { key: string; value: any }): void {
        switch (event.key) {
            case 'is_active':
                this.statusFilter.set(event.value as boolean | undefined);
                this.employeeStore.filterByStatus(event.value as boolean | undefined);
                break;
            case 'dept_id':
                this.departmentFilter.set(event.value);
                // 這裡暫時只設定過濾器值，如果 store 有實作相關方法可以調用
                break;
        }
    }

    // 分頁
    onPageChange(page: number): void {
        if (typeof page === 'number') {
            this.employeeStore.goToPage(page);
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
        this.employeeStore.setPageSize(pageSize);
    }

    // 排序
    onSort(column: keyof Employee): void {
        if (this.sortBy() === column) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortBy.set(column);
            this.sortDirection.set('asc');
        }
        this.employeeStore.sortEmployees(this.sortBy(), this.sortDirection());
    }

    // 表頭事件處理方法
    onTableSort(event: { column: string; direction: 'asc' | 'desc' }): void {
        this.sortBy.set(event.column as keyof Employee);
        this.sortDirection.set(event.direction);
        this.employeeStore.sortEmployees(this.sortBy(), this.sortDirection());
    }

    // 選擇操作
    onSelectAll(selected: boolean): void {
        if (selected) {
            this.selectedEmployees.set([...this.employees()]);
        } else {
            this.selectedEmployees.set([]);
        }
    }

    onSelectItem(item: Employee, selected: boolean): void {
        const currentSelected = this.selectedEmployees();
        if (selected) {
            this.selectedEmployees.set([...currentSelected, item]);
        } else {
            this.selectedEmployees.set(currentSelected.filter(e => e.emp_id !== item.emp_id));
        }
    }

    isSelected(item: Employee): boolean {
        return this.selectedEmployees().some(e => e.emp_id === item.emp_id);
    }

    // CRUD 操作
    onAdd(): void {
        this.selectedEmployee.set(null);
        this.formMode.set('create');
        this.showForm.set(true);
    }

    onEdit(employee: Employee): void {
        this.selectedEmployee.set(employee);
        this.formMode.set('edit');
        this.showForm.set(true);
    }

    onView(employee: Employee): void {
        this.selectedEmployee.set(employee);
        this.showView.set(true);
    }

    onDelete(employee: Employee): void {
        if (confirm(`確定要刪除員工「${employee.emp_name}」嗎？`)) {
            this.employeeService.deleteEmployee(employee.emp_id).subscribe({
                next: (success) => {
                    if (success) {
                        this.employeeStore.removeEmployee(employee.emp_id);
                    }
                },
                error: (error) => {
                    console.error('刪除員工失敗:', error);
                }
            });
        }
    }

    onBulkDelete(): void {
        const selectedCount = this.selectedEmployees().length;
        if (selectedCount === 0) return;

        this.showBulkDeleteConfirm.set(true);
    }

    confirmBulkDelete(): void {
        this.bulkDeleteLoading.set(true);
        this.showBulkDeleteConfirm.set(false);
        this.performBulkDelete();
    }

    private performBulkDelete(): void {
        const selected = this.selectedEmployees();
        const ids = selected.map(emp => emp.emp_id);

        this.employeeService.bulkDeleteEmployees?.(ids).subscribe({
            next: (success) => {
                if (success) {
                    // 從本地狀態移除已刪除的員工
                    selected.forEach(emp => {
                        this.employeeStore.removeEmployee(emp.emp_id);
                    });
                    this.selectedEmployees.set([]);
                }
                this.bulkDeleteLoading.set(false);
            },
            error: (error) => {
                console.error('批量刪除失敗:', error);
                this.bulkDeleteLoading.set(false);
            }
        });
    }

    // 狀態切換
    // onToggleStatus(employee: Employee): void {
    //     const updatedEmployee = { ...employee, is_active: !employee.is_active };
    //     this.employeeService.updateEmployee(updatedEmployee.emp_id!, updatedEmployee).subscribe({
    //         next: () => {
    //             this.loadEmployees();
    //         },
    //         error: (error) => {
    //             console.error('切換狀態失敗:', error);
    //         }
    //     });
    // }
    onToggleStatus(employee: Employee): void {
        const targetStatus = employee.is_active ? '離職' : '在職';
        if (!confirm(`確定要將「${employee.emp_name}」的狀態切換至「${targetStatus}」嗎？`)) return;
        this.employeeService.toggleActiveStatus(employee.emp_id).subscribe({
            next: (updatedEmployee) => {
                if (updatedEmployee) {
                    this.employeeStore.updateEmployee(updatedEmployee);
                }
            },
            error: (error) => {
                console.error('切換狀態失敗:', error);
            }
        });
    }

    // 表單事件
    onFormSaved(employee: Employee): void {
        if (this.formMode() === 'create') {
            this.employeeStore.addEmployee(employee);
        } else {
            this.employeeStore.updateEmployee(employee);
        }
        this.showForm.set(false);
        this.loadEmployees(); // 重新載入以確保資料一致性
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
        this.departmentFilter.set(undefined);
        this.loadEmployees();
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

    // 動作按鈕配置
    // getActionConfig(employee: Employee): ActionButtonConfig {
    //     return {
    //         buttons: [
    //             {
    //                 type: 'view',
    //                 text: '檢視',
    //                 variant: 'info',
    //                 icon: 'bi-eye',
    //                 visible: this.hasReadPermission(),
    //                 disabled: false
    //             },
    //             {
    //                 type: 'edit',
    //                 text: '編輯',
    //                 variant: 'primary',
    //                 icon: 'bi-pencil',
    //                 visible: this.hasUpdatePermission(),
    //                 disabled: false
    //             },
    //             {
    //                 type: 'delete',
    //                 text: '刪除',
    //                 variant: 'danger',
    //                 icon: 'bi-trash',
    //                 visible: this.hasDeletePermission(),
    //                 disabled: this.bulkDeleteLoading()
    //             }
    //         ],
    //         size: 'sm',
    //         orientation: 'horizontal',
    //         itemName: employee.emp_name
    //     };
    // }

    getActionConfig(employee: Employee): ActionButtonConfig {
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
            itemName: employee.emp_name
        };
    }

    // 狀態配置
    // getStatusConfig(isActive: boolean): StatusConfig {
    //     return {
    //         value: isActive,
    //         activeValue: true,
    //         inactiveValue: false,
    //         activeText: '在職',
    //         inactiveText: '離職',
    //         clickable: true,
    //         size: 'sm'
    //     };
    // }

    getStatusConfig(employee: Employee): StatusConfig {
        return {
            value: employee.is_active,
            activeValue: true,
            inactiveValue: false,
            activeText: '在職',
            inactiveText: '離職',
            clickable: true,
            size: 'sm'
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

    // 模板兼容性方法 - 用於舊模板
    exportData(): void {
        // TODO: 實現資料匯出功能
        console.log('匯出資料功能待實現');
    }

    onCreateNew(): void {
        this.onAdd();
    }

    // 共享組件事件處理方法
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.employeeStore.searchEmployees(keyword);
    }

    clearSearch(): void {
        // 清除所有搜尋和篩選條件
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.departmentFilter.set(undefined);

        // 重新載入資料
        this.employeeStore.searchEmployees('');
    }

    clearError(): void {
        // 清除錯誤狀態的邏輯
        this.employeeStore.clearError?.();
    }

    onTableSelectAll(selected: boolean): void {
        this.onSelectAll(selected);
    }

    onTableItemSelected(event: { item: any; selected: boolean }): void {
        this.onSelectItem(event.item, event.selected);
    }

    onTableRowClicked(employee: Employee): void {
        //this.onView(employee);
    }

    onActionView(employee: Employee): void {
        this.onView(employee);
    }

    onActionEdit(employee: Employee): void {
        this.onEdit(employee);
    }

    onActionDelete(employee: Employee): void {
        this.onDelete(employee);
    }
}
