import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CourseEventStore } from '../../store/course-event.store';
import { CourseEventService } from '../../services/course-event.service';
import { CourseEventFormComponent } from '../../components/course-event-form/course-event-form.component';
import { CourseEventViewComponent } from '../../components/course-event-view/course-event-view.component';
import { CourseEvent, SEMESTER_OPTIONS } from '../../models/course-event.model';
import { UserStore } from '../../../../core/auth/user.store';
import type { User, Permission } from '../../../../models/user.model';
import { GlobalMessageService } from '../../../../core/message/global-message.service';
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
    selector: 'app-course-event-list',
    templateUrl: './course-event-list.component.html',
    styleUrls: ['./course-event-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        CourseEventFormComponent,
        CourseEventViewComponent,
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
export class CourseEventListComponent implements OnInit {
    private courseEventStore = inject(CourseEventStore);
    private courseEventService = inject(CourseEventService);
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
            create: hasPermission('course_event', 'create'),
            read: hasPermission('course_event', 'read'),
            update: hasPermission('course_event', 'update'),
            delete: hasPermission('course_event', 'delete')
        };
    });

    // State signals
    searchKeyword = signal('');
    statusFilter = signal<boolean | undefined>(undefined);
    yearFilter = signal<string | undefined>(undefined);
    semesterFilter = signal<string | undefined>(undefined);
    availableYears = signal<string[]>([]);
    showForm = signal(false);
    showView = signal(false);
    selectedCourseEvent = signal<CourseEvent | null>(null);
    formMode = signal<'create' | 'edit'>('create');
    sortColumn = signal<keyof CourseEvent>('courseEventId');
    sortDirection = signal<'asc' | 'desc'>('asc');

    // Bulk selection signals
    selectedCourseEvents = signal<CourseEvent[]>([]);
    showBulkDeleteConfirm = signal(false);
    bulkDeleteLoading = signal(false);

    // Individual action signals
    showDeleteConfirm = signal(false);
    showStatusConfirm = signal(false);
    actionCourseEvent = signal<CourseEvent | null>(null);
    actionLoading = signal(false);

    // Store data
    courseEvents = this.courseEventStore.courseEvents;
    total = this.courseEventStore.total;
    currentPage = this.courseEventStore.currentPage;
    pageSize = this.courseEventStore.pageSize;
    totalPages = this.courseEventStore.totalPages;
    loading = this.courseEventStore.loading;
    error = this.courseEventStore.error;

    // 搜尋篩選配置
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '搜尋活動標題、年度、學期...',
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
                key: 'year',
                label: '年度',
                options: this.availableYears().map(year => ({
                    value: year,
                    text: `${year}年`
                }))
            },
            {
                key: 'semester',
                label: '上/下半年',
                options: SEMESTER_OPTIONS.map(opt => ({
                    value: opt.value,
                    text: opt.label
                }))
            }
        ],
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        totalCountLabel: '筆課程活動',
        showClearButton: true
    }));

    // 計算當前篩選器值
    readonly currentFilterValues = computed(() => ({
        isActive: this.statusFilter(),
        year: this.yearFilter(),
        semester: this.semesterFilter()
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
        ariaLabel: '課程活動列表分頁',
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
                key: 'courseEventId',
                label: 'No.',
                sortable: true,
                width: '8%'
            },
            {
                key: 'year',
                label: '年度',
                sortable: true,
                width: '10%'
            },
            {
                key: 'semester',
                label: '學期',
                sortable: true,
                width: '10%'
            },
            {
                key: 'activityTitle',
                label: '活動標題',
                sortable: true,
                width: '25%'
            },
            {
                key: 'description',
                label: '描述',
                sortable: false,
                width: '20%'
            },
            {
                key: 'isActive',
                label: '狀態',
                sortable: false,
                align: 'center',
                width: '10%'
            },
            {
                key: 'activationDate',
                label: '啟動日期',
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

    // 表格主體配置 - TemplateRef 在 ngOnInit 中設定
    @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
    @ViewChild('yearTemplate', { static: true }) yearTemplate!: TemplateRef<any>;
    @ViewChild('semesterTemplate', { static: true }) semesterTemplate!: TemplateRef<any>;
    @ViewChild('activityTitleTemplate', { static: true }) activityTitleTemplate!: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
    @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
    @ViewChild('descriptionTemplate', { static: true }) descriptionTemplate!: TemplateRef<any>;

    tableBodyConfig = computed<TableBodyConfig>(() => ({
        data: this.courseEvents(),
        showSelectColumn: this.permissions().delete,
        columns: [
            { key: 'courseEventId', template: this.idTemplate, align: 'center' },
            { key: 'year', template: this.yearTemplate, cssClass: 'fw-medium text-primary', },
            { key: 'semester', template: this.semesterTemplate, align: 'center' },
            { key: 'activityTitle', template: this.activityTitleTemplate },
            { key: 'description', template: this.descriptionTemplate },
            { key: 'isActive', template: this.statusTemplate, align: 'center' },
            { key: 'activationDate', template: this.dateTemplate, align: 'center' },
            { key: 'actions', template: this.actionTemplate, align: 'center' }
        ],
        trackByFn: (index: number, item: CourseEvent) => item.courseEventId || index
    }));

    // 載入狀態配置
    readonly loadingConfig = computed<LoadingStateConfig>(() => ({
        size: 'md',
        text: '正在載入部門資料...',
        showText: true,
        variant: 'primary',
        center: true
    }));

    // 錯誤狀態配置
    readonly errorConfig = computed<ErrorMessageConfig>(() => ({
        title: '載入失敗',
        message: this.error() || '無法載入課程活動資料，請稍後再試',
        showRetryButton: true,
        retryButtonText: '重試'
    }));

    // 空資料狀態配置
    readonly emptyConfig = computed<EmptyStateConfig>(() => ({
        icon: 'calendar-event',
        title: '沒有課程活動',
        message: '目前沒有符合條件的課程活動資料',
        showCreateButton: this.permissions().create,
        createButtonText: '新增課程活動',
        createButtonIcon: 'plus-circle'
    }));

    // 批次刪除確認配置
    readonly bulkDeleteConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認批次刪除',
        message: `您確定要刪除選取的 ${this.selectedCourseEvents().length} 筆課程活動嗎？`,
        icon: 'trash',
        confirmText: '刪除',
        cancelText: '取消',
        confirmButtonClass: 'btn-danger',
        loading: this.bulkDeleteLoading()
    }));

    // 刪除確認配置
    readonly deleteConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認刪除課程活動',
        message: `您確定要刪除課程活動「${this.actionCourseEvent()?.activityTitle}」嗎？`,
        icon: 'trash',
        confirmText: '刪除',
        cancelText: '取消',
        confirmButtonClass: 'btn-danger',
        loading: this.actionLoading()
    }));

    // 狀態切換確認配置
    readonly statusConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認狀態變更',
        message: `您確定要${this.actionCourseEvent()?.isActive ? '停用' : '啟用'}課程活動「${this.actionCourseEvent()?.activityTitle}」嗎？`,
        icon: 'question-circle',
        confirmText: this.actionCourseEvent()?.isActive ? '停用' : '啟用',
        cancelText: '取消',
        confirmButtonClass: this.actionCourseEvent()?.isActive ? 'btn-warning' : 'btn-success',
        loading: this.actionLoading()
    }));

    // 選取邏輯
    readonly isAllSelected = computed(() => {
        const courseEvents = this.courseEvents();
        const selected = this.selectedCourseEvents();
        return courseEvents.length > 0 && selected.length === courseEvents.length;
    });

    readonly isPartiallySelected = computed(() => {
        const selected = this.selectedCourseEvents();
        return selected.length > 0 && !this.isAllSelected();
    });

    ngOnInit(): void {
        this.loadAvailableYears();
        this.loadCourseEvents();
    }

    // 載入可用年度
    private loadAvailableYears(): void {
        this.courseEventService.getAvailableYears().subscribe({
            next: (years) => {
                this.availableYears.set(years);
            },
            error: (error) => {
                console.error('Failed to load available years:', error);
                // 如果載入失敗，使用預設年度範圍
                const currentYear = new Date().getFullYear();
                const fallbackYears = [];
                for (let i = currentYear - 2; i <= currentYear + 2; i++) {
                    fallbackYears.push(i.toString());
                }
                this.availableYears.set(fallbackYears);
            }
        });
    }

    // 資料載入
    loadCourseEvents(): void {
        this.courseEventStore.loadCourseEvents({
            keyword: this.searchKeyword() || undefined,
            isActive: this.statusFilter(),
            year: this.yearFilter(),
            semester: this.semesterFilter(),
            sortColumn: this.sortColumn(),
            sortDirection: this.sortDirection().toUpperCase(),
            page: this.currentPage(),
            pageSize: this.pageSize()
        });
    }

    // 搜尋事件
    onSearch(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.courseEventStore.goToPage(1); // 重設到第一頁
        this.loadCourseEvents();
    }

    // 篩選事件 - 處理單一篩選項目變更
    onFilter(filterEvent: { key: string; value: any }): void {
        switch (filterEvent.key) {
            case 'isActive':
                this.statusFilter.set(filterEvent.value);
                break;
            case 'year':
                this.yearFilter.set(filterEvent.value);
                break;
            case 'semester':
                this.semesterFilter.set(filterEvent.value);
                break;
            default:
                console.warn('Unknown filter key:', filterEvent.key);
                return;
        }

        this.courseEventStore.goToPage(1); // 重設到第一頁
        this.loadCourseEvents();
    }

    // 清除篩選
    onClearFilters(): void {
        this.searchKeyword.set('');
        this.statusFilter.set(undefined);
        this.yearFilter.set(undefined);
        this.semesterFilter.set(undefined);
        this.loadCourseEvents();
    }

    // 分頁大小變更
    onPageSizeChange(pageSize: number): void {
        this.courseEventStore.setPageSize(pageSize);
    }

    // 分頁事件
    onPageChange(page: number): void {
        this.courseEventStore.goToPage(page);
    }

    // 排序事件
    onSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        if (event.direction === null) {
            // 重設排序為預設值
            this.sortColumn.set('courseEventId');
            this.sortDirection.set('asc');
        } else {
            this.sortColumn.set(event.column as keyof CourseEvent);
            this.sortDirection.set(event.direction);
        }
        this.loadCourseEvents();
    }

    // 全選事件
    onSelectAll(checked: boolean): void {
        if (checked) {
            this.selectedCourseEvents.set([...this.courseEvents()]);
        } else {
            this.selectedCourseEvents.set([]);
        }
    }

    // 單項選取事件
    onItemSelect(courseEvent: CourseEvent, checked: boolean): void {
        const selected = this.selectedCourseEvents();
        if (checked) {
            this.selectedCourseEvents.set([...selected, courseEvent]);
        } else {
            this.selectedCourseEvents.set(selected.filter(item => item.courseEventId !== courseEvent.courseEventId));
        }
    }

    // 檢查項目是否被選取
    isItemSelected(courseEvent: CourseEvent): boolean {
        return this.selectedCourseEvents().some(item => item.courseEventId === courseEvent.courseEventId);
    }

    // CRUD 操作
    onAdd(): void {
        this.selectedCourseEvent.set(null);
        this.formMode.set('create');
        this.showForm.set(true);
    }

    onEdit(courseEvent: CourseEvent): void {
        this.selectedCourseEvent.set(courseEvent);
        this.formMode.set('edit');
        this.showForm.set(true);
    }

    onView(courseEvent: CourseEvent): void {
        this.selectedCourseEvent.set(courseEvent);
        this.showView.set(true);
    }

    onDelete(courseEvent: CourseEvent): void {
        this.actionCourseEvent.set(courseEvent);
        this.showDeleteConfirm.set(true);
    }

    onToggleStatus(courseEvent: CourseEvent): void {
        this.actionCourseEvent.set(courseEvent);
        this.showStatusConfirm.set(true);
    }

    // 批次操作
    onBulkDelete(): void {
        this.showBulkDeleteConfirm.set(true);
    }

    // 表單事件
    onFormSaved(courseEvent: CourseEvent): void {
        if (this.formMode() === 'create') {
            this.courseEventStore.addCourseEvent(courseEvent);
            this.messageService.success('課程活動建立成功');
        } else {
            this.courseEventStore.updateCourseEvent(courseEvent);
            this.messageService.success('課程活動更新成功');
        }
        this.showForm.set(false);
        this.loadCourseEvents(); // 重新載入以確保資料一致性
    }

    onFormCancelled(): void {
        this.showForm.set(false);
    }

    onViewClosed(): void {
        this.showView.set(false);
    }

    // 確認對話框事件
    async onDeleteConfirmed(): Promise<void> {
        const courseEvent = this.actionCourseEvent();
        if (!courseEvent) return;

        this.actionLoading.set(true);
        try {
            const success = await firstValueFrom(this.courseEventService.deleteCourseEvent(courseEvent.courseEventId!));
            if (success) {
                this.courseEventStore.removeCourseEvent(courseEvent.courseEventId!);
                this.messageService.success('課程活動刪除成功');
            } else {
                this.messageService.error('課程活動刪除失敗');
            }
        } catch (error) {
            this.messageService.error('課程活動刪除失敗，請稍後再試');
        } finally {
            this.actionLoading.set(false);
            this.showDeleteConfirm.set(false);
            this.actionCourseEvent.set(null);
        }
    }

    async onStatusConfirmed(): Promise<void> {
        const courseEvent = this.actionCourseEvent();
        if (!courseEvent) return;

        this.actionLoading.set(true);
        try {
            const updated = await firstValueFrom(this.courseEventService.toggleActiveStatus(courseEvent.courseEventId!));
            if (updated) {
                this.courseEventStore.updateCourseEvent(updated);
                this.messageService.success(`課程活動已${updated.isActive ? '啟用' : '停用'}`);
            } else {
                this.messageService.error('狀態變更失敗');
            }
        } catch (error) {
            this.messageService.error('狀態變更失敗，請稍後再試');
        } finally {
            this.actionLoading.set(false);
            this.showStatusConfirm.set(false);
            this.actionCourseEvent.set(null);
        }
    }

    async onBulkDeleteConfirmed(): Promise<void> {
        const selected = this.selectedCourseEvents();
        if (selected.length === 0) return;

        this.bulkDeleteLoading.set(true);
        try {
            const ids = selected.map(item => item.courseEventId!);
            const success = await firstValueFrom(this.courseEventService.bulkDeleteCourseEvents(ids));
            if (success) {
                // 從 store 中移除刪除的項目
                ids.forEach(id => this.courseEventStore.removeCourseEvent(id));
                this.selectedCourseEvents.set([]);
                this.messageService.success(`成功刪除 ${selected.length} 筆課程活動`);
            } else {
                this.messageService.error('批次刪除失敗');
            }
        } catch (error) {
            this.messageService.error('批次刪除失敗，請稍後再試');
        } finally {
            this.bulkDeleteLoading.set(false);
            this.showBulkDeleteConfirm.set(false);
        }
    }

    onDeleteCancelled(): void {
        this.showDeleteConfirm.set(false);
        this.actionCourseEvent.set(null);
    }

    onStatusCancelled(): void {
        this.showStatusConfirm.set(false);
        this.actionCourseEvent.set(null);
    }

    onBulkDeleteCancelled(): void {
        this.showBulkDeleteConfirm.set(false);
    }

    // 錯誤重試
    onRetry(): void {
        this.courseEventStore.clearError();
        this.loadCourseEvents();
    }

    // 狀態配置
    getStatusConfig(courseEvent: CourseEvent): StatusConfig {
        return {
            value: courseEvent.isActive,
            activeValue: true,
            inactiveValue: false,
            activeText: '啟用',
            inactiveText: '停用',
            clickable: true,
            size: 'sm'
        };
    }

    // 操作按鈕配置

    getActionConfig(courseEvent: CourseEvent): ActionButtonConfig {
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
        };
    }

    // 操作按鈕點擊事件
    onActionView(courseEvent: CourseEvent): void {
        this.onView(courseEvent);
    }

    onActionEdit(courseEvent: CourseEvent): void {
        this.onEdit(courseEvent);
    }

    onActionDelete(courseEvent: CourseEvent): void {
        this.onDelete(courseEvent);
    }

    onActionButtonClick(event: { key: string; item: any }): void {
        const courseEvent = event.item as CourseEvent;
        const actions = {
            'view': () => this.onView(courseEvent),
            'edit': () => this.onEdit(courseEvent),
            'delete': () => this.onDelete(courseEvent),
            'toggle-status': () => this.onToggleStatus(courseEvent)
        };

        const action = actions[event.key as keyof typeof actions];
        if (action) action();
    }

    exportData(): void {
        // TODO: Implement export functionality
        console.log('Export data functionality to be implemented');
    }
}
