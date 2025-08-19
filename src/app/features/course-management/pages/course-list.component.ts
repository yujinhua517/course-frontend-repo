import { Component, signal, computed, inject, ViewChild, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Course, CourseFilters, LEARNING_TYPE_OPTIONS, SKILL_TYPE_OPTIONS, LEVEL_OPTIONS } from '../models/course.model';
import { CourseService } from '../services/course.service';
import { GlobalMessageService } from '../../../core/message/global-message.service';

// 共用元件 imports
import { TableHeaderComponent } from '../../../shared/components/table-header/table-header.component';
import { TableBodyComponent } from '../../../shared/components/table-body/table-body.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ActionButtonGroupComponent } from '../../../shared/components/action-buttons/action-button-group.component';
import { SearchFilterComponent } from '../../../shared/components/search-filter/search-filter.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';

@Component({
    selector: 'app-course-list',
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FormsModule,
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
export class CourseListComponent {
    // 🎯 Services
    readonly courseService = inject(CourseService); // ✅ 改為 public，讓 template 可以存取
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(GlobalMessageService);

    // 📊 直接使用 Service 的 signals（避免重複）
    readonly courses = this.courseService.courses;
    readonly loading = this.courseService.loading;
    readonly pagination = this.courseService.pagination;
    readonly totalRecords = this.courseService.totalRecords;
    readonly currentPage = this.courseService.currentPage;
    readonly totalPages = this.courseService.totalPages;
    readonly pageSize = this.courseService.pageSize;
    readonly hasNext = this.courseService.hasNext;
    readonly hasPrevious = this.courseService.hasPrevious;

    // 🎨 Component 特有的 UI 狀態
    readonly searchKeyword = signal<string>('');
    readonly errorMessage = signal<string>('');
    readonly selectedCourse = signal<Course | null>(null);

    // ✅ 多重篩選狀態管理
    readonly currentFilters = signal<CourseFilters>({});

    // 確認對話框狀態
    readonly confirmationTitle = signal<string>('');
    readonly confirmationMessage = signal<string>('');
    readonly confirmationVariant = signal<'danger' | 'warning' | 'info'>('warning');
    readonly confirmationLoading = signal<boolean>(false);

    // 🧮 Component 特有的計算屬性
    readonly hasData = computed(() => this.courses().length > 0);
    readonly confirmationConfirmText = computed(() =>
        this.confirmationVariant() === 'danger' ? '刪除' : '確認'
    );
    readonly confirmationCancelText = computed(() => '取消');

    // ✅ 篩選相關計算屬性
    readonly hasActiveFilters = computed(() => {
        const filters = this.currentFilters();
        return !!(
            filters.learningType ||
            filters.skillType ||
            filters.level ||
            filters.isActive !== undefined ||
            filters.courseEventId
        );
    });

    readonly activeFiltersCount = computed(() => {
        const filters = this.currentFilters();
        let count = 0;
        if (filters.learningType) count++;
        if (filters.skillType) count++;
        if (filters.level) count++;
        if (filters.isActive !== undefined) count++;
        if (filters.courseEventId) count++;
        return count;
    });

    // ViewChild 參考
    @ViewChild('confirmationModal') confirmationModal!: ConfirmationModalComponent;

    // 私有變數
    private pendingDeleteCourse: Course | null = null;

    // 🎛️ 表格配置
    readonly tableColumns = [
        { key: 'courseName', label: '課程名稱', sortable: true },
        { key: 'courseEventId', label: '課程活動', sortable: false },
        { key: 'learningType', label: '學習方式', sortable: true },
        { key: 'skillType', label: '技能類型', sortable: true },
        { key: 'level', label: '等級', sortable: true },
        { key: 'hours', label: '時數', sortable: true },
        { key: 'isActive', label: '狀態', sortable: true },
        { key: 'createTime', label: '建立時間', sortable: true },
        { key: 'actions', label: '操作', sortable: false }
    ];

    // 🎛️ 操作按鈕配置
    readonly actionButtons = [
        { id: 'create', label: '新增課程', icon: 'bi-plus-circle', variant: 'primary' },
        { id: 'export', label: '匯出', icon: 'bi-download', variant: 'outline-primary' },
        { id: 'refresh', label: '重新整理', icon: 'bi-arrow-clockwise', variant: 'outline-secondary' }
    ];

    // 🎨 選項資料
    readonly learningTypeOptions = LEARNING_TYPE_OPTIONS;
    readonly skillTypeOptions = SKILL_TYPE_OPTIONS;
    readonly levelOptions = LEVEL_OPTIONS;

    ngOnInit() {
        // ✅ 加入這個，確保頁面載入時會搜尋資料
        this.loadInitialData();
    }

    private loadInitialData() {
        this.courseService.searchCourses({
            pageable: true,
            firstIndexInPage: 1,
            lastIndexInPage: 10
        }).subscribe({
            next: (response) => {
                console.log('✅ 資料載入成功:', response);
                console.log('📊 初始頁面載入，總記錄數:', this.totalRecords());
            },
            error: (error) => console.error('❌ 資料載入失敗:', error)
        });
    }

    // 🔄 基本事件處理（直接呼叫 Service）
    onSearch(keyword: string) {
        this.searchKeyword.set(keyword);
        this.courseService.searchByKeyword(keyword).subscribe();
    }

    // ❌ 移除舊的 onFilter 方法
    // onFilter(filters: CourseFilters) {
    //   this.courseService.filterCourses(filters).subscribe();
    // }

    // ✅ 新的單一欄位篩選方法
    onFilterChange(field: keyof CourseFilters, value: any) {
        const filters = { ...this.currentFilters() };

        // 處理不同類型的值
        if (value === '' || value === undefined || value === null) {
            delete filters[field]; // 清除該欄位的篩選
        } else {
            // 特殊處理 boolean 類型
            if (field === 'isActive') {
                if (value === 'true') {
                    filters[field] = true;
                } else if (value === 'false') {
                    filters[field] = false;
                } else {
                    delete filters[field];
                }
            } else if (field === 'courseEventId') {
                filters[field] = parseInt(value, 10);
            } else {
                filters[field] = value;
            }
        }

        console.log(`🔍 更新篩選條件 ${field}:`, value, '→ 完整篩選:', filters);
        this.currentFilters.set(filters);
        this.courseService.filterCourses(filters).subscribe();
    }

    // ✅ 清除單一篩選條件
    onClearFilter(field: keyof CourseFilters) {
        this.onFilterChange(field, undefined);
    }

    // ✅ 清除所有篩選條件
    onClearAllFilters() {
        this.currentFilters.set({});
        this.courseService.clearSearch().subscribe();
    }

    onSort(column: keyof Course) {
        this.courseService.toggleSort(column).subscribe();
    }

    onPageChange(page: number) {
        this.courseService.loadPage(page).subscribe();
    }

    onPageSizeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const size = parseInt(target.value, 10);
        this.courseService.loadPage(1, size).subscribe();
    }

    onNextPage() {
        this.courseService.nextPage().subscribe();
    }

    onPreviousPage() {
        this.courseService.previousPage().subscribe();
    }

    onRefresh() {
        this.courseService.reload().subscribe();
    }

    onClearSearch() {
        this.searchKeyword.set('');
        this.currentFilters.set({}); // ✅ 同時清除篩選狀態
        this.courseService.clearSearch().subscribe();
    }

    // 🎨 UI 樣式相關方法
    getLearningTypeVariant(type: string): string {
        const variants: Record<string, string> = {
            '實體': 'primary',
            '線上': 'success',
            '混合': 'info'
        };
        return variants[type] || 'secondary';
    }

    getSkillTypeVariant(type: string): string {
        const variants: Record<string, string> = {
            '軟體力': 'purple',
            '數據力': 'orange',
            '雲': 'teal'
        };
        return variants[type] || 'secondary';
    }

    getLevelVariant(level: string): string {
        const variants: Record<string, string> = {
            '基礎': 'success',
            '進階': 'danger'
        };
        return variants[level] || 'secondary';
    }

    getSortIcon(column: string): string {
        const sort = this.courseService.getCurrentSort();
        if (sort.column !== column) return 'bi bi-chevron-expand';
        return sort.direction === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
    }

    getSortAriaLabel(column: string): string {
        const sort = this.courseService.getCurrentSort();
        if (sort.column !== column) return `按 ${column} 排序`;
        const direction = sort.direction === 'asc' ? '升序' : '降序';
        return `目前按 ${column} ${direction}排序，點擊切換`;
    }

    getRowActions(course: Course) {
        return [
            { id: 'view', icon: 'bi-eye', tooltip: '查看', variant: 'outline-primary' },
            { id: 'edit', icon: 'bi-pencil', tooltip: '編輯', variant: 'outline-warning' },
            { id: 'delete', icon: 'bi-trash', tooltip: '刪除', variant: 'outline-danger' }
        ];
    }

    // 🔧 輔助方法
    formatDate(dateString: string): string {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getCourseEventName(eventId: number): string {
        // 這裡可以從 service 或其他地方取得課程活動名稱
        return `活動 ${eventId}`;
    }

    // ✅ 加入 parseInt 方法供 template 使用
    parseInt(value: string): number {
        return parseInt(value, 10);
    }

    // ✅ 加入 Math 物件供 template 使用
    Math = Math;

    getVisiblePages(): number[] {
        const current = this.currentPage();
        const total = this.totalPages();
        const delta = 2; // 顯示當前頁前後各2頁

        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, current - delta);
            i <= Math.min(total - 1, current + delta);
            i++) {
            range.push(i);
        }

        if (current - delta > 2) {
            rangeWithDots.push(1, -1); // -1 表示省略號
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (current + delta < total - 1) {
            rangeWithDots.push(-1, total); // -1 表示省略號
        } else if (total > 1) {
            rangeWithDots.push(total);
        }

        return rangeWithDots.filter(page => page !== -1); // 暫時移除省略號邏輯
    }

    // 🎯 操作事件處理
    onActionClick(actionId: string) {
        switch (actionId) {
            case 'create':
                this.onCreateCourse();
                break;
            case 'export':
                this.onExportCourses();
                break;
            case 'refresh':
                this.onRefresh();
                break;
        }
    }

    onRowAction(actionId: string, course: Course) {
        switch (actionId) {
            case 'view':
                this.onViewCourse(course);
                break;
            case 'edit':
                this.onEditCourse(course);
                break;
            case 'delete':
                this.onDeleteCourse(course);
                break;
        }
    }

    // 💾 CRUD 操作（需要處理回應的）
    onCreateCourse() {
        // 導航到新增頁面或開啟對話框
        console.log('新增課程');
        this.messageService.info('導航到新增課程頁面');
    }

    onViewCourse(course: Course) {
        console.log('查看課程:', course);
        this.selectedCourse.set(course);
        // 開啟查看對話框或導航到詳細頁面
    }

    onEditCourse(course: Course) {
        console.log('編輯課程:', course);
        this.selectedCourse.set(course);
        // 開啟編輯對話框或導航到編輯頁面
    }

    onDeleteCourse(course: Course) {
        this.pendingDeleteCourse = course;
        this.confirmationTitle.set('確認刪除');
        this.confirmationMessage.set(`確定要刪除課程「${course.courseName}」嗎？此操作無法復原。`);
        this.confirmationVariant.set('danger');
        this.confirmationModal.show();
    }

    onExportCourses() {
        if (!this.hasData()) {
            this.messageService.warning('沒有可匯出的資料');
            return;
        }
        console.log('匯出課程');
        this.messageService.info('開始匯出課程資料...');
    }

    // 🔄 確認對話框處理
    onConfirmAction() {
        if (this.pendingDeleteCourse) {
            this.confirmationLoading.set(true);

            this.courseService.deleteCourse(this.pendingDeleteCourse.courseId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (success) => {
                        this.confirmationLoading.set(false);
                        if (success) {
                            this.messageService.success(`課程「${this.pendingDeleteCourse!.courseName}」刪除成功！`);
                        } else {
                            this.messageService.error('課程刪除失敗！');
                        }
                        this.pendingDeleteCourse = null;
                    },
                    error: (error) => {
                        this.confirmationLoading.set(false);
                        this.messageService.error('刪除時發生錯誤');
                        console.error('刪除課程錯誤:', error);
                    }
                });
        }
    }

    onCancelAction() {
        this.pendingDeleteCourse = null;
        this.confirmationLoading.set(false);
    }

    // 🎯 空狀態處理
    getEmptyStateTitle(): string {
        return this.courseService.hasSearchParams() ? '沒有找到符合條件的課程' : '還沒有課程資料';
    }

    getEmptyStateMessage(): string {
        return this.courseService.hasSearchParams()
            ? '請調整搜尋條件或清除篩選後重試'
            : '開始建立您的第一門課程吧！';
    }

    getEmptyStateActionText(): string {
        return this.courseService.hasSearchParams() ? '清除篩選' : '新增課程';
    }

    getEmptyStateActionIcon(): string {
        return this.courseService.hasSearchParams() ? 'bi-arrow-clockwise' : 'bi-plus-circle';
    }

    onEmptyStateAction() {
        if (this.courseService.hasSearchParams()) {
            this.onClearSearch();
        } else {
            this.onCreateCourse();
        }
    }

    // ✅ 加入便利方法供 template 使用
    hasSearchParams(): boolean {
        return this.courseService.hasSearchParams();
    }

    // 🔄 錯誤處理
    onRetry() {
        this.errorMessage.set('');
        this.courseService.reload().subscribe();
    }

    onDismissError() {
        this.errorMessage.set('');
    }

    // 🔧 表格操作
    onColumnToggle(column: any) {
        console.log('切換欄位顯示:', column);
        // 實作欄位顯示/隱藏邏輯
    }
}