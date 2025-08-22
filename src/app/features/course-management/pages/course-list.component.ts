import { Component, inject, signal, computed, ChangeDetectionStrategy, TemplateRef, viewChild, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { UserStore } from '../../../core/auth/user.store';
import type { User, Permission } from '../../../models/user.model';

import { SearchFilterComponent, SearchFilterConfig } from '../../../shared/components/search-filter/search-filter.component';
import { LoadingStateComponent, LoadingStateConfig } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageConfig, ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { EmptyStateConfig, EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { TableHeaderComponent, TableHeaderConfig } from '../../../shared/components';
import { TableBodyConfig, TableBodyComponent } from '../../../shared/components';
import { ActionButtonConfig, ActionButtonGroupComponent } from '../../../shared/components';
import { StatusBadgeComponent, StatusConfig } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent, PaginationConfig } from '../../../shared/components/pagination/pagination.component'
import { ConfirmationModalConfig, ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { CourseFormComponent } from '../components/course-form/course-form.component';

import { CourseService } from '../services/course.service';
import { GlobalMessageService } from '../../../core/message/global-message.service';

import { Course, CourseSearchParams, LEARNING_TYPE_OPTIONS, SKILL_TYPE_OPTIONS, LEVEL_OPTIONS } from '../models/course.model';
import { ServiceListResponse } from '../../../models/common.model';
import { PaginationUtil, QueryParamsBuilder } from '../../../core/utils/query.util';

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SearchFilterComponent,
        LoadingStateComponent,
        ErrorMessageComponent,
        EmptyStateComponent,
        TableHeaderComponent,
        TableBodyComponent,
        ActionButtonGroupComponent,
        StatusBadgeComponent,
        PaginationComponent,
        ConfirmationModalComponent,
        CourseFormComponent,
        HighlightPipe,
    ],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent {
    /**
     * DI：使用 Angular 的 inject() 取得 service 實例（專案慣例）。
     * 值得注意：此處沒有使用 constructor 注入，是為了保持程式簡潔並方便測試。
     */
    private readonly courseService = inject(CourseService);
    private readonly messageService = inject(GlobalMessageService);
    private readonly userStore = inject(UserStore);

    /**
     * 後端成功回應的常數（專案內統一使用）。
     * 若後端回傳的成功碼不同，請在服務層或此處統一調整。
     */
    private static readonly API_SUCCESS = 1000;

    /**
     * 本元件使用的本地狀態（signals）：
     * - searchKeyword：搜尋欄文字（需使用者按搜尋或 Enter 才會查詢）
     * - currentSearchParams：目前查詢用參數（排序/篩選/分頁）
     * - selectedCourses：當前已選取的課程 id（使用 Set 方便增刪）
     * - isInitialized：是否完成第一次載入，避免重複初始化
     */
    readonly searchKeyword = signal<string>('');
    readonly currentSearchParams = signal<CourseSearchParams>({});
    readonly selectedCourses = signal<Set<number>>(new Set());
    readonly isInitialized = signal<boolean>(false);

    readonly formMode = signal<'create' | 'edit'>('create'); // 用於控制表單模式（新增/編輯）
    readonly showForm = signal<boolean>(false); // 控制表單顯示與隱藏
    readonly selectedCourse = signal<Course | null>(null); // 用於編輯模式的課程資料

    // ========== 簡化的操作狀態管理 ==========
    readonly pendingAction = signal<{
        type: 'status-toggle' | 'bulk-delete' | null; // 表示現在要做什麼事
        target?: Course | null; // 可選屬性，代表操作的目標課程（如果是單筆狀態切換，就存該課程）。批量刪除時通常不需要，因為會有多個選取。
        loading?: boolean; // 可選屬性，代表這個操作是否正在進行中。適合用來讓 UI 顯示「操作中 spinner」。
    }>({ type: null }); // 預設狀態是「沒有任何操作」。

    // 從 pendingAction 派生的計算屬性
    readonly showStatusConfirm = computed(() => this.pendingAction().type === 'status-toggle');
    readonly showBulkDeleteConfirm = computed(() => this.pendingAction().type === 'bulk-delete');
    readonly isOperationLoading = computed(() => this.pendingAction().loading || false);

    /** 使用 resource() API 管理課程資料的取得與更新 */
    readonly coursesResource = resource({
        /** 
         * request(): 回傳查詢條件（例如：課程名稱、頁數、大小）
         */
        request: () => this.currentSearchParams(),

        /** 
         * loader: 根據查詢條件向後端請求課程清單
         */
        loader: async ({ request }) => {
            return firstValueFrom(this.courseService.searchCourses(request));
        }
    });


    /** 由 resource 推導出的唯讀值，方便畫面綁定
     * - courses: 課程清單
     * - loading: 是否讀取中
     * - error: 錯誤訊息
     * - totalRecords, currentPage, pageSize, totalPages: 分頁資訊
     * - hasNext, hasPrevious: 分頁控制
     */
    readonly courses = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        // 確認資料存在且成功，回傳清單；否則回傳空陣列，避免模板迭代錯誤
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.dataList;
        }
        return [];
    });
    readonly loading = computed(() => this.coursesResource.isLoading());
    readonly error = computed(() => {
        const resourceError = this.coursesResource.error();
        if (resourceError) {
            return '查詢失敗，請稍後再試';
        }
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && !this.isApiSuccess(resourceData)) {
            return '查詢失敗';
        }
        return null;
    });
    readonly totalRecords = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.totalRecords;
        }
        return 0;
    });
    readonly currentPage = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.page ?? 1;
        }
        return 1;
    });
    readonly pageSize = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.pageSize ?? 10;
        }
        return 10;
    });
    readonly totalPages = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.totalPages ?? 0;
        }
        return 0;
    });
    readonly hasNext = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.hasNext ?? false;
        }
        return false;
    });
    readonly hasPrevious = computed(() => {
        const resourceData = this.coursesResource.value() as ServiceListResponse<Course> | undefined;
        if (resourceData && this.isApiSuccess(resourceData) && resourceData.data) {
            return resourceData.data.hasPrevious ?? false;
        }
        return false;
    });

    // 派生狀態（提供給畫面與邏輯使用）
    readonly hasSelectedCourses = computed(() => this.selectedCourses().size > 0);  // 是否有選課
    readonly selectedCount = computed(() => this.selectedCourses().size);           // 已選課程數量

    // 將內部的 Set<number>（課程ID集合）轉換成課程物件陣列，供表格使用
    readonly selectedCourseItems = computed(() => {
        const ids = this.selectedCourses();
        return this.courses().filter((c) => ids.has(c.courseId));
    });

    readonly isEmpty = computed(() => this.courses().length === 0);  // 是否沒有資料
    readonly hasData = computed(() => this.courses().length > 0);    // 是否有資料


    // 派生的選取/排序狀態，供 template 與其他 computed 重用
    readonly isAllSelected = computed(() => {
        const pageIds = this.courses().map((c: Course) => c.courseId);
        if (pageIds.length === 0) return false;
        const selectedSet = this.selectedCourses();
        return pageIds.every((id: number) => selectedSet.has(id));
    });

    readonly isPartiallySelected = computed(() => {
        const pageIds = this.courses().map((c: Course) => c.courseId);
        if (pageIds.length === 0) return false;
        const selectedSet = this.selectedCourses();
        const selectedOnPageCount = pageIds.filter((id: number) => selectedSet.has(id)).length;
        return selectedOnPageCount > 0 && selectedOnPageCount < pageIds.length;
    });

    // 檢查是否需要固定高度 (數據行數 >= 10)
    readonly shouldUseFixedHeight = computed(() => this.courses().length >= 10);

    // 從 currentSearchParams 推導出的排序欄位與方向，用於 TableHeader 與查詢
    readonly sortColumn = computed(() => ((this.currentSearchParams() as any).sortColumn as string) ?? '');
    readonly sortDirection = computed(() => ((this.currentSearchParams() as any).sortDirection as 'asc' | 'desc' | undefined));

    /**
     * 權限判斷：檢查 userStore 的 user 是否有對應 resource 的 CRUD 權限，回傳四個布林值。
     */
    readonly permissions = computed(() => {
        const user = this.userStore.user() as User | null;
        const has = (action: string) =>
            (user?.permissions ?? []).some((p: Permission) => p.resource === 'course' && p.action === action);
        return {
            create: has('create'),
            read: has('read'),
            update: has('update'),
            delete: has('delete'),
        };
    });

    /** 計算內容狀態，用於 @switch 控制流 */
    readonly getContentState = computed(() => {
        if (this.loading()) return 'loading';
        if (this.error()) return 'error';
        if (this.courses().length === 0) return 'empty';
        return 'data';
    });

    // ================== Track Functions for Optimized Rendering ==================

    /** 課程清單的 track 函數 - 使用唯一的 courseId 進行追蹤 */
    readonly trackByCourseId = (_index: number, course: Course): number => course.courseId;

    /** 佔位元素的 track 函數 - 使用索引進行追蹤 */
    readonly trackByIndex = (index: number, _item: number): number => index;

    /** 篩選選項的 track 函數 - 使用 value 進行追蹤 */
    readonly trackByValue = (_index: number, option: { value: string }): string => option.value;

    /** 權限按鈕的 track 函數 - 使用 type 進行追蹤 */
    readonly trackByButtonType = (_index: number, button: { type: string }): string => button.type;

    // ================== 初始化 ==================
    constructor() {
        // 設定初始查詢參數
        const initialParams: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortDirection: 'asc',
            firstIndexInPage: 1,
            lastIndexInPage: 10
        };
        this.currentSearchParams.set(initialParams);
        this.isInitialized.set(true);
    }

    // TemplateRefs for custom column templates defined in the component HTML.
    // Using Angular 19+ viewChild() signal API for better type safety and reactivity
    /**
     * TemplateRef：代表一塊可重複使用的 HTML 樣板（通常是 <ng-template>）
     * viewChild(...)：新的訊號版 View Query。拿到的不是舊的屬性，而是可呼叫的函式（signal getter）。
     * 取值時要呼叫：this.idTemplate()（像 signal() 一樣）
     * .required<...>()：告訴 Angular「這個一定要存在」。如果 HTML 沒有對應的 #idTemplate，會在執行期直接報錯，避免你忘記放。
     */
    readonly idTemplate = viewChild.required<TemplateRef<any>>('idTemplate');
    readonly nameTemplate = viewChild.required<TemplateRef<any>>('nameTemplate');
    readonly learningTypeTemplate = viewChild.required<TemplateRef<any>>('learningTypeTemplate');
    readonly skillTypeTemplate = viewChild.required<TemplateRef<any>>('skillTypeTemplate');
    readonly levelTemplate = viewChild.required<TemplateRef<any>>('levelTemplate');
    readonly hoursTemplate = viewChild.required<TemplateRef<any>>('hoursTemplate');
    readonly statusTemplate = viewChild.required<TemplateRef<any>>('statusTemplate');    // 可選：可能不存在
    readonly timeTemplate = viewChild.required<TemplateRef<any>>('timeTemplate');
    readonly actionsTemplate = viewChild.required<TemplateRef<any>>('actionsTemplate');

    // ================== 共用私有工具 ==================
    /**
     * 檢查 API 回應是否為成功（比對預設的 success code）。
     */
    private isApiSuccess<T>(res: ServiceListResponse<T>): boolean {
        return res.code === CourseListComponent.API_SUCCESS;
    }

    /**
     * 把 page 與 pageSize 轉成後端分頁參數（firstIndexInPage / lastIndexInPage），並回傳合併後的查詢參數。
     */
    private withPageRange(
        base: CourseSearchParams,
        page: number,
        pageSize: number,
    ): CourseSearchParams {
        const { firstIndexInPage, lastIndexInPage } = PaginationUtil.toBackendPagination(
            page,
            pageSize,
        );
        return { ...base, firstIndexInPage, lastIndexInPage };
    }

    /**
     * 合併新的查詢條件並重置到第一頁，回傳包含 pageRange 的查詢參數。
     */
    private buildParams(updates: Partial<CourseSearchParams>): CourseSearchParams {
        const merged = QueryParamsBuilder.mergeSearchParams(this.currentSearchParams(), updates);
        const resetFirst = QueryParamsBuilder.resetToFirstPage(merged);
        return this.withPageRange(resetFirst, 1, this.pageSize());
    }

    /**
     * 更新查詢參數並觸發資源重新載入
     * 使用現代化的 resource API，無需手動管理 loading 和錯誤狀態
     */
    private updateSearchParams(params: CourseSearchParams, successMsg?: string) {
        this.currentSearchParams.set(params);
        if (successMsg) {
            // 可以使用 effect 來監聽資源成功載入後顯示訊息
            // 或者在 template 中處理成功狀態
            this.messageService.success(successMsg);
        }
    }

    // ================== 初始化 / 搜尋 ==================

    /** 使用者觸發搜尋（按搜尋或 Enter）：重置到第 1 頁並執行查詢。 */
    private performSearch(keyword: string): void {
        const updates = { keyword };
        const params = this.buildParams(updates);
        this.updateSearchParams(params);
    }

    // ================== 動態選項生成 ==================

    /** 動態生成時長選項 */
    private generateHoursOptions(min: number, max: number, step: number = 0.5) {
        const options: { value: number; text: string }[] = [];
        for (let i = min; i <= max; i += step) {
            const value = Math.round(i * 10) / 10; // 確保數值精確度
            options.push({ value, text: value.toString() });
        }
        return options;
    }

    // ================== SearchFilterComponent 綁定 ==================

    /** 傳給 SearchFilterComponent 的設定（placeholder、filter、pageSize 等）。 */
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '請輸入課程名稱或課程編號',
        searchLabel: '課程搜尋',
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        showClearButton: true,
        // 與搜尋框並排的篩選器
        inlineFilters: [
            {
                key: 'hoursFrom',
                label: '課程時長（起）',
                options: this.generateHoursOptions(0.5, 50, 0.5),
            },
            {
                key: 'hoursTo',
                label: '課程時長（迄）',
                options: this.generateHoursOptions(0.5, 50, 0.5),
            },
        ],
        // 第二行的篩選器
        filters: [
            {
                key: 'learningType',
                label: '學習方式',
                options: LEARNING_TYPE_OPTIONS.map((o) => ({ value: o.value, text: o.label })),
            },
            {
                key: 'skillType',
                label: '技能類型',
                options: SKILL_TYPE_OPTIONS.map((o) => ({ value: o.value, text: o.label })),
            },
            {
                key: 'level',
                label: '課程等級',
                options: LEVEL_OPTIONS.map((o) => ({ value: o.value, text: o.label })),
            },
            {
                key: 'isActive',
                label: '狀態',
                options: [
                    { value: true, text: '啟用' },
                    { value: false, text: '停用' },
                ],
            },
        ],
    }));

    /** 將 currentSearchParams 轉為 SearchFilterComponent 的顯示值。 */
    readonly currentFilterValues = computed(() => {
        const p = this.currentSearchParams();
        return {
            hoursFrom: p.hoursFrom ?? '',
            hoursTo: p.hoursTo ?? '',
            learningType: p.learningType ?? '',
            skillType: p.skillType ?? '',
            level: p.level ?? '',
            isActive: p.isActive ?? '',
            courseEventId: p.courseEventId ?? '',
        };
    });

    // ================== 事件處理 ==================

    /** 搜尋欄事件：設定關鍵字並執行搜尋（由 template 傳入）。 */
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
        this.performSearch(keyword);
    }

    /** 篩選變更處理：合併新條件、回到第 1 頁並查詢。 */
    onFilterChange(event: {
        key: string;
        value: string | number | boolean | '' | null | undefined;
    }): void {
        const updates: Record<string, any> = {};
        // 清空就給 undefined，讓 merge 後被 resetToFirstPage + clean 掉
        updates[event.key] =
            event.value === '' || event.value === null || event.value === undefined
                ? undefined
                : event.value;

        const params = this.buildParams(updates);
        this.updateSearchParams(params);
    }

    /** 處理 pageSize 改變：同步顯示並以新 pageSize 查詢（回到第 1 頁）。 */
    onPageSizeChange(pageSize: number): void {
        // 保留現有條件，只換 page/pageSize → first/lastIndex
        const merged = QueryParamsBuilder.mergeSearchParams(this.currentSearchParams(), {});
        const params = this.withPageRange(merged, 1, pageSize);

        this.updateSearchParams(params, `已調整為每頁 ${pageSize} 筆`);
    }

    /** 清除搜尋與篩選（保留 pageSize），回到第 1 頁並查詢。 */
    clearSearch(): void {
        this.searchKeyword.set('');
        this.selectedCourses.set(new Set());

        const updates: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortDirection: 'asc',
            hoursFrom: undefined,
            hoursTo: undefined,
            learningType: undefined,
            skillType: undefined,
            level: undefined,
            isActive: undefined,
        };
        const params = this.buildParams(updates);
        this.updateSearchParams(params, '已清除所有搜尋條件');
    }

    // ================== 選取功能 ==================

    /** 切換單一課程的選取狀態（使用 courseId）。 */
    toggleCourseSelection(courseId: number): void {
        const set = new Set(this.selectedCourses());
        set.has(courseId) ? set.delete(courseId) : set.add(courseId);
        this.selectedCourses.set(set);
    }

    /** 檢查指定 courseId 是否已被選取。 */
    isCourseSelected(courseId: number): boolean {
        return this.selectedCourses().has(courseId);
    }

    /** 切換本頁的全選狀態（全部選／清除）。 */
    toggleSelectAll(): void {
        const allIds = this.courses().map((c: Course) => c.courseId);
        const selected = this.selectedCourses();
        this.selectedCourses.set(
            selected.size === allIds.length ? new Set() : new Set(allIds),
        );
    }


    // ================== loading 功能 ==================

    /** loading component 的設定 */
    readonly loadingConfig = computed<LoadingStateConfig>(() => ({
        size: 'md',
        text: '正在載入課程資料...',
        showText: true,
        variant: 'primary',
        center: true
    }));

    // ================== error 訊息 ==================

    /** 傳給 ErrorMessageComponent 的設定（是否顯示與訊息內容）。 */
    readonly errorConfig = computed<ErrorMessageConfig>(() => ({
        show: true,
        message: this.error() || '',
        type: 'danger',
        dismissible: true,
        icon: 'exclamation-triangle-fill',
        size: 'md'
    }));

    /** 清除頁面錯誤訊息（template 綁定）- 使用 resource 時會自動重試 */
    clearError(): void {
        // 使用 resource API 時，可以觸發重新載入
        // 或者簡單地等待下次參數變更時自動重試
    }

    // ================== 空狀態 ==================

    // 空狀態配置
    readonly emptyStateConfig = computed<EmptyStateConfig>(() => {
        // 判斷是否有任一搜尋/篩選條件
        const keyword = (this.searchKeyword() || '').toString().trim();
        const filters = this.currentFilterValues();
        const hasAnyFilter = Object.values(filters).some((v) => v !== '' && v !== null && v !== undefined);
        const hasFilters = keyword.length > 0 || hasAnyFilter;

        // EmptyStateComponent 的介面要求 icon/title/message 與可選的 primaryAction/secondaryAction
        if (hasFilters) {
            return {
                icon: 'search',
                title: '查無相符資料',
                message: '找不到符合條件的課程資料，請調整搜尋條件後再試。',
                primaryAction: {
                    label: '清除搜尋條件',
                    action: 'clear-filters',
                    icon: 'arrow-clockwise',
                    variant: 'outline-primary'
                },
                showIcon: true,
                size: 'md'
            };
        }

        return {
            icon: 'jigsaw',
            title: '暫無課程資料',
            message: '尚未建立任何課程資料，點擊按鈕開始新增。',
            primaryAction: {
                label: '新增第一個課程',
                action: 'create-new',
                icon: 'plus-circle',
                variant: 'primary'
            },
            showIcon: true,
            size: 'md'
        };
    });

    /** 空狀態按鈕處理：clear-filters（清除條件）、create-new（進入新增流程）。 */
    onEmptyStateAction(action: string): void {
        if (action === 'clear-filters') {
            this.clearSearch();
            return;
        }

        if (action === 'create-new') {
            this.onCreateCourse();
            return;
        }

        // 未知 action，顯示原始字串（便於 debug）
        this.messageService.info(`action: ${action}`);
    }

    // 表頭配置：欄位、是否顯示勾選欄，以及當前排序狀態（由 currentSearchParams 派生）
    readonly tableHeaderConfig = computed<TableHeaderConfig>(() => {
        // 明確定義欄位陣列為 TableColumn[]，並為需要對齊或自訂樣式的欄位加上 cssClass
        const cols: any[] = [
            { key: 'courseId', label: 'No.', sortable: true, width: '8%' },
            { key: 'courseName', label: '課程名稱', sortable: true, width: '18%' },
            { key: 'learningType', label: '學習方式', sortable: false, width: '8%' },
            { key: 'skillType', label: '技能類型', sortable: false, width: '10%' },
            { key: 'level', label: '課程等級', sortable: false, width: '8%' },
            { key: 'hours', label: '課程時長', sortable: true, width: '10%' },
            { key: 'isActive', label: '狀態', sortable: false, align: 'center', width: '8%' },
            { key: 'createTime', label: '建立時間', sortable: true, width: '15%' },
            { key: 'actions', label: '操作', sortable: false, align: 'center', width: '15%' }
        ];

        return {
            columns: cols as any,
            // 只有有刪除權限時才顯示選取欄
            showSelectColumn: this.permissions().delete,
            isAllSelected: this.isAllSelected(),
            isPartiallySelected: this.isPartiallySelected(),
            // TableHeaderComponent 在清除排序時會傳回 column = '' 與 direction = null
            sortColumn: this.sortColumn(),
            sortDirection: this.sortDirection()
        } as TableHeaderConfig;
    });

    /** table body 的設定：提供資料、trackBy 與每欄的 TemplateRef。 */
    readonly tableBodyConfig = computed<TableBodyConfig>(() => {
        // 用很多 || 檢查必需的 TemplateRef 是否存在；避免「讀取未定義模板」造成錯誤。
        // 回傳 columns: [] 讓畫面先不渲染欄位，等下一次計算再補上。
        if (!this.idTemplate() || !this.nameTemplate() || !this.learningTypeTemplate() || !this.skillTypeTemplate() || !this.levelTemplate() || !this.timeTemplate() || !this.actionsTemplate()) {
            return {
                data: this.courses(),
                trackByFn: (_i: number, item: Course) => item.courseId,
                showSelectColumn: this.permissions().delete,
                columns: [],
            } as TableBodyConfig;
        }

        const columns = [
            {
                key: 'courseId',
                cssClass: 'fw-normal',
                width: '8%'
            },
            {
                key: 'courseName',
                cssClass: 'fw-medium text-primary',
                width: '18%'
            },
            {
                key: 'learningType',
                cssClass: 'fw-medium',
                width: '8%'
            },
            {
                key: 'skillType',
                cssClass: 'text-muted',
                width: '10%'
            },
            {
                key: 'level',
                cssClass: 'text-muted',
                width: '10%'
            },
            {
                key: 'hours',
                cssClass: 'text-muted',
                width: '8%'
            },
            {
                key: 'isActive',
                align: 'center',
                width: '8%'
            },
            {
                key: 'createTime',
                cssClass: 'text-muted small',
                width: '15%'
            },
            {
                key: 'actions',
                align: 'center',
                width: '15%'
            }
        ];

        // Map to TableBodyColumn[] and attach TemplateRef where appropriate
        const mapped = columns.map((c) => {
            const col: any = {
                key: c.key,
                width: c.width,
                align: c.align as any,
                cssClass: c.cssClass,
            };

            // 依 key 指定該欄使用哪個 <ng-template>。
            // statusTemplate() 可能不存在，所以用 ?? undefined 安全處理。
            switch (c.key) {
                case 'courseId':
                    col.template = this.idTemplate();
                    break;
                case 'courseName':
                    col.template = this.nameTemplate();
                    break;
                case 'learningType':
                    col.template = this.learningTypeTemplate();
                    break;
                case 'skillType':
                    col.template = this.skillTypeTemplate();
                    break;
                case 'level':
                    col.template = this.levelTemplate();
                    break;
                case 'hours':
                    col.template = this.hoursTemplate();
                    break;
                case 'isActive':
                    col.template = this.statusTemplate();
                    break;
                case 'createTime':
                    col.template = this.timeTemplate();
                    break;
                case 'actions':
                    col.template = this.actionsTemplate();
                    break;
            }

            return col;
        });

        // 組成最後的 TableBodyConfig
        /**
         * data 來源是 courses() 的 signal。
         * trackByFn 用 courseId，效能佳、狀態穩定。
         * 已選列加上 table-active 方便高亮。
         */
        return {
            data: this.courses(),
            trackByFn: this.trackByCourseId,
            showSelectColumn: this.permissions().delete,
            rowCssClass: (item: Course) => (this.isCourseSelected(item.courseId) ? 'table-active' : ''),
            columns: mapped,
        } as TableBodyConfig;
    });

    /** 表頭排序事件：更新排序設定並重新查詢（回到第 1 頁）。 */
    onTableSort(event: { column: string; direction: 'asc' | 'desc' | null }): void {
        const updates: Partial<CourseSearchParams> = {};
        if (!event.direction || !event.column) {
            // 清除排序
            updates.sortColumn = undefined;
            updates.sortDirection = undefined;
        } else {
            updates.sortColumn = event.column;
            updates.sortDirection = event.direction;
        }

        const params = this.buildParams(updates);
        this.updateSearchParams(params);
    }

    /** 處理表頭全選 checkbox（以目前頁面的 items 為準）。 */
    onTableSelectAll(checked: boolean): void {
        const pageIds = this.courses().map((c: Course) => c.courseId);
        const next = new Set(this.selectedCourses());
        if (checked) {
            pageIds.forEach((id: number) => next.add(id));
        } else {
            pageIds.forEach((id: number) => next.delete(id));
        }
        this.selectedCourses.set(next);
    }

    /** 單筆項目選取事件（由 table-body 發出）：加入或移除選取 id。 */
    onTableItemSelected(event: { item: any; selected: boolean }): void {
        const id = event.item?.courseId;
        if (id === undefined || id === null) return;
        const next = new Set(this.selectedCourses());
        if (event.selected) next.add(id);
        else next.delete(id);
        this.selectedCourses.set(next);
    }

    getActionConfig(course: Course): ActionButtonConfig {
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
            itemName: course.courseName
        };
    }

    getStatusConfig(course: Course): StatusConfig {
        return {
            value: course.isActive,
            activeValue: true,
            inactiveValue: false,
            activeText: '啟用',
            inactiveText: '停用',
            clickable: true,
            size: 'sm'
        };
    }

    // 派生文案：顯示在確認框內
    readonly statusConfirmConfig = computed<ConfirmationModalConfig>(() => {
        const target = this.pendingAction().target;
        return {
            title: '確認狀態變更',
            message: `您確定要${target?.isActive ? '停用' : '啟用'}課程「${target?.courseName}」嗎？`,
            icon: 'question-circle',
            confirmText: target?.isActive ? '停用' : '啟用',
            cancelText: '取消',
            confirmButtonClass: target?.isActive ? 'btn-warning' : 'btn-success',
        };
    });

    // 1) 進入確認流程（不直接改資料）
    onToggleStatus(course: Course): void {
        this.pendingAction.set({
            type: 'status-toggle',
            target: course
        });
    }

    // 2) 取消
    onToggleStatusCancel(): void {
        this.pendingAction.set({ type: null });
    }

    // 3) 確認：呼叫後端 → 重查 → 關閉
    async onToggleStatusConfirm(): Promise<void> {
        const action = this.pendingAction();
        const course = action.target;

        if (!course || action.loading) return;

        try {
            // 標記為loading狀態
            this.pendingAction.set({
                ...action,
                loading: true
            });

            const updated = await firstValueFrom(
                this.courseService.updateCourseStatus(course.courseId)
            );

            if (updated) {
                // 觸發 resource 重新載入以獲取最新資料
                const params = this.currentSearchParams();
                this.currentSearchParams.set({});
                setTimeout(() => {
                    this.currentSearchParams.set(params);
                    this.messageService.success('狀態已更新');
                }, 10);
            }

            this.pendingAction.set({ type: null });
        } catch (e) {
            this.messageService.warning('變更狀態失敗，請稍後再試');
            this.pendingAction.set({ type: null });
        }
    }


    // 分頁配置
    readonly paginationConfig = computed<PaginationConfig>(() => ({
        // 這四個值來自前面你定義的 computed（都是從 API response 推導出來的）。
        currentPage: this.currentPage(),
        totalPages: this.totalPages(),
        totalCount: this.totalRecords(),
        pageSize: this.pageSize(),

        pageSizeOptions: [10, 25, 50, 100],

        showPageSize: false,
        showTotalCount: false,
        showFirstLast: true,
        showPrevNext: true,
        maxVisiblePages: 7,

        ariaLabel: '課程列表分頁',
        disabled: this.loading()
    }));

    // 分頁
    onPageChange(page: number): void {
        // 當前頁面改變時，更新查詢參數並重新載入資料
        /**
         * this.currentSearchParams()
         * 取得目前的搜尋條件（例如：關鍵字、排序方式、目前頁數...）。
         * 這是一個 signal，呼叫 () 代表取值
         * this.pageSize()
         * 取得目前每頁顯示幾筆資料（例如 10 筆）。
         * 也是一個 computed signal。
         */
        /** this.withPageRange(...)這是一個小工具函式，用來「根據 page 與 pageSize，算出這一頁的範圍」*/
        const params = this.withPageRange(this.currentSearchParams(), page, this.pageSize());
        /** 把剛剛算好的新查詢參數（params）存回去。 */
        this.updateSearchParams(params, `已切換到第 ${page} 頁`);
    }

    // 批量刪除確認框配置
    readonly deleteConfirmConfig = computed<ConfirmationModalConfig>(() => ({
        title: '確認批量刪除',
        message: `您確定要刪除選中的 ${this.selectedCourses().size} 個課程嗎？此操作無法復原。`,
        icon: 'exclamation-triangle',
        confirmText: '確認刪除',
        cancelText: '取消',
        confirmButtonClass: 'btn-danger',
    }));

    onBulkDelete(): void {
        const selectedCount = this.selectedCourses().size;
        if (selectedCount === 0) return;

        this.pendingAction.set({
            type: 'bulk-delete'
        });
    }

    onBulkDeleteCancel(): void {
        this.pendingAction.set({ type: null });
    }

    async onBulkDeleteConfirm(): Promise<void> {
        const action = this.pendingAction();
        const selectedIds = Array.from(this.selectedCourses());

        if (selectedIds.length === 0 || action.loading) {
            this.pendingAction.set({ type: null });
            return;
        }

        try {
            // 標記為loading狀態
            this.pendingAction.set({
                ...action,
                loading: true
            });

            const result = await firstValueFrom(
                this.courseService.bulkDeleteCourses(selectedIds)
            );

            if (result.success) {
                // 重新載入資料，使用 resource 模式
                const newParams = { ...this.currentSearchParams() };
                this.currentSearchParams.set({});
                setTimeout(() => {
                    this.currentSearchParams.set(newParams);

                    // 根據刪除結果顯示相應訊息
                    if (result.deletedCount === result.totalCount) {
                        this.messageService.success(`已成功刪除 ${result.deletedCount} 個課程`);
                    } else {
                        this.messageService.warning(`已刪除 ${result.deletedCount}/${result.totalCount} 個課程，部分項目可能已被刪除或權限不足`);
                    }
                }, 10);

                // 清空選中項目
                this.selectedCourses.set(new Set());
            } else {
                this.messageService.error('批量刪除失敗，請稍後再試');
            }

            this.pendingAction.set({ type: null });
        } catch (error) {
            this.messageService.error('批量刪除失敗，請稍後再試');
            console.error('Bulk delete error:', error);
            this.pendingAction.set({ type: null });
        }
    }

    exportData(): void {
        // TODO: Implement export functionality
        this.messageService.info('Export data functionality to be implemented');
    }

    onCreateCourse(): void {
        this.formMode.set('create');
        this.selectedCourse.set(null);
        this.showForm.set(true);
    }

    onViewCourse(course: Course): void {
        this.messageService.info(`查看課程功能待實作：${course.courseName}`);
    }

    onEditCourse(course: Course): void {
        this.formMode.set('edit');
        this.selectedCourse.set(course);
        this.showForm.set(true);
    }

    onFormSaved(course: Course): void {
        const mode = this.formMode();
        const successMessage = mode === 'create'
            ? `課程「${course.courseName}」建立成功`
            : `課程「${course.courseName}」更新成功`;

        this.messageService.success(successMessage);
        this.onFormCancelled(); // 關閉表單

        // 重新載入資料
        this.refreshData();
    }

    onFormCancelled(): void {
        this.showForm.set(false);
        this.selectedCourse.set(null);
        this.formMode.set('create');
    }

    private refreshData(): void {
        // 使用 resource 模式重新載入資料
        const params = this.currentSearchParams();
        this.currentSearchParams.set({});
        setTimeout(() => {
            this.currentSearchParams.set(params);
        }, 10);
    }

    onDeleteCourse(course: Course): void {
        // TODO: 實作單一課程刪除確認對話框
        // 建議使用與批量刪除類似的確認機制
        this.messageService.info(`單一課程刪除功能待實作：${course.courseName}`);
    }
}
