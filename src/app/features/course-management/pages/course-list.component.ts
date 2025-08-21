import { Component, inject, signal, computed, effect, OnInit, ChangeDetectionStrategy, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { UserStore } from '../../../core/auth/user.store';
import type { User, Permission } from '../../../models/user.model';

import { SearchFilterComponent, SearchFilterConfig } from '../../../shared/components/search-filter/search-filter.component';
import { LoadingStateComponent, LoadingStateConfig } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageConfig, ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { EmptyStateConfig, EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { TableHeaderComponent, TableHeaderConfig } from '../../../shared/components';
import { TableBodyConfig, TableBodyComponent } from '../../../shared/components';
import { ActionButtonConfig, ActionButtonGroupComponent, ActionButton } from '../../../shared/components';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';

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
        HighlightPipe
    ],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit {
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

    /** 當前頁面的錯誤訊息；為 null 表示沒有錯誤 */
    readonly errorState = signal<string | null>(null);

    /** 從 API 取得並顯示在表格上的課程資料 */
    readonly coursesData = signal<Course[]>([]);
    /** 是否處於載入中，用來顯示 overlay 或 loading 樣式 */
    readonly loadingState = signal<boolean>(false);

    /** 分頁資訊（由 API 回傳後計算） */
    readonly paginationInfo = signal<{
        totalRecords: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    }>({
        totalRecords: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
    });

    /** 由 signals 推導出的唯讀值，方便 template 綁定 */
    readonly courses = computed(() => this.coursesData());
    readonly loading = computed(() => this.loadingState());
    readonly totalRecords = computed(() => this.paginationInfo().totalRecords);
    readonly currentPage = computed(() => this.paginationInfo().currentPage);
    readonly pageSize = computed(() => this.paginationInfo().pageSize);
    readonly totalPages = computed(() => this.paginationInfo().totalPages);
    readonly hasNext = computed(() => this.paginationInfo().hasNext);
    readonly hasPrevious = computed(() => this.paginationInfo().hasPrevious);

    // 選取相關的派生狀態（供 template 與邏輯使用）
    readonly hasSelectedCourses = computed(() => this.selectedCourses().size > 0);
    readonly selectedCount = computed(() => this.selectedCourses().size);
    // TableBodyComponent expects an array of selected items. We keep internal selection as Set<number>
    // for efficient add/remove, but expose an array of Course objects for the table's `selectedItems` input.
    readonly selectedCourseItems = computed(() => {
        const ids = this.selectedCourses();
        return this.courses().filter((c) => ids.has(c.courseId));
    });
    readonly isEmpty = computed(() => this.courses().length === 0);
    readonly hasData = computed(() => this.courses().length > 0);

    // 派生的選取/排序狀態，供 template 與其他 computed 重用
    readonly isAllSelected = computed(() => {
        const pageIds = this.courses().map((c) => c.courseId);
        if (pageIds.length === 0) return false;
        const selectedSet = this.selectedCourses();
        return pageIds.every((id) => selectedSet.has(id));
    });

    // 檢查是否需要固定高度 (數據行數 >= 10)
    readonly shouldUseFixedHeight = computed(() => this.courses().length >= 10);

    readonly isPartiallySelected = computed(() => {
        const pageIds = this.courses().map((c) => c.courseId);
        if (pageIds.length === 0) return false;
        const selectedSet = this.selectedCourses();
        const selectedOnPageCount = pageIds.filter((id) => selectedSet.has(id)).length;
        return selectedOnPageCount > 0 && selectedOnPageCount < pageIds.length;
    });

    // 從 currentSearchParams 推導出的排序欄位與方向，用於 TableHeader 與查詢
    readonly sortColumn = computed(() => ((this.currentSearchParams() as any).sortColumn as string) ?? '');
    readonly sortDirection = computed(() => ((this.currentSearchParams() as any).sortDirection as 'asc' | 'desc' | undefined));

    readonly error = computed(() => this.errorState())

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

    // ================== 生命週期 ==================
    /**
     * 元件初始化：載入第一頁資料並標記為已初始化。
     */
    ngOnInit(): void {
        this.loadInitialData();
        this.isInitialized.set(true);
    }

    // TemplateRefs for custom column templates defined in the component HTML.
    // Use { static: true } so they are available during the first change detection cycle
    // (matches other list components pattern in the project).
    @ViewChild('idTemplate', { static: true }) idTemplate?: TemplateRef<any>;
    @ViewChild('codeTemplate', { static: true }) codeTemplate?: TemplateRef<any>;
    @ViewChild('nameTemplate', { static: true }) nameTemplate?: TemplateRef<any>;
    @ViewChild('emailTemplate', { static: true }) emailTemplate?: TemplateRef<any>;
    @ViewChild('deptTemplate', { static: true }) deptTemplate?: TemplateRef<any>;
    @ViewChild('statusTemplate', { static: true }) statusTemplate?: TemplateRef<any>;
    @ViewChild('timeTemplate', { static: true }) timeTemplate?: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate?: TemplateRef<any>;

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
     * 將後端分頁回應寫回本地 signals（更新 coursesData 與 paginationInfo）。
     */
    private applyPagerResponse(res: ServiceListResponse<Course>) {
        const d = res.data!;
        this.coursesData.set(d.dataList);
        this.paginationInfo.set({
            totalRecords: d.totalRecords,
            currentPage: d.page ?? 1,
            pageSize: d.pageSize ?? 10,
            totalPages: d.totalPages ?? 0,
            hasNext: d.hasNext ?? false,
            hasPrevious: d.hasPrevious ?? false,
        });
    }

    /**
     * 內部工具：根據 page 與 pageSize 計算 firstIndexInPage / lastIndexInPage（1-based）。
     */
    private setRangeByPage(page: number, pageSize: number, base: CourseSearchParams) {
        const first = (page - 1) * pageSize + 1;
        const last = page * pageSize;
        return { ...base, firstIndexInPage: first, lastIndexInPage: last };
    }

    /**
     * 呼叫 CourseService.searchCourses 並統一處理：
     * - 設定 loading 狀態與 currentSearchParams
     * - 成功則寫回資料並顯示通知（如有）
     * - 失敗或錯誤則設定 errorState 與顯示錯誤通知
     */
    private queryAndApply(params: CourseSearchParams, successMsg?: string, errorMsg?: string) {
        //設定 loading 中、記住目前查詢參數。
        this.loadingState.set(true);
        this.currentSearchParams.set(params);

        //呼叫 CourseService.searchCourses 去後端拿資料。
        this.courseService
            .searchCourses(params)
            //finalize：不管成功/失敗都把 loading 關掉。
            .pipe(finalize(() => this.loadingState.set(false)))
            .subscribe({
                // 成功就把資料丟進 applyPagerResponse，順便顯示成功訊息（如果有），並清除頁面錯誤。
                next: (res) => {
                    if (this.isApiSuccess(res) && res.data) {
                        this.applyPagerResponse(res);
                        if (successMsg) this.messageService.success(successMsg);
                        // 成功時清除本地錯誤顯示
                        this.errorState.set(null);
                    }
                    // 失敗：設定本地錯誤並顯示 toast
                    else {
                        const msg = errorMsg ?? '查詢失敗';
                        this.errorState.set(msg);
                        this.messageService.error(msg);
                    }
                },
                // HTTP 或網路錯誤：同樣設定本地錯誤並顯示 toast
                error: () => {
                    const msg = errorMsg ?? '查詢失敗，請稍後再試';
                    this.errorState.set(msg);
                    this.messageService.error(msg);
                },
            });
    }

    // ================== 初始化 / 搜尋 ==================

    /** 初始載入第一頁資料（使用預設查詢參數）。 */
    private loadInitialData(): void {
        const base: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortDirection: 'asc',
        };
        const initial = this.setRangeByPage(1, this.paginationInfo().pageSize, base);
        // 用統一方法 queryAndApply 發送與處理回應。
        this.queryAndApply(initial, undefined, '課程資料載入失敗');
    }

    /** 使用者觸發搜尋（按搜尋或 Enter）：重置到第 1 頁並執行查詢。 */
    private performSearch(keyword: string): void {
        const base = { ...this.currentSearchParams(), keyword };
        const params = this.setRangeByPage(1, this.pageSize(), base);
        this.queryAndApply(params, undefined, '搜尋失敗');
    }

    // ================== SearchFilterComponent 綁定 ==================

    /** 傳給 SearchFilterComponent 的設定（placeholder、filter、pageSize 等）。 */
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '請輸入課程名稱或關鍵字…',
        searchLabel: '課程搜尋',
        showPageSize: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotalCount: true,
        totalCountLabel: '筆課程',
        showClearButton: true,
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
        this.queryAndApply(params, '篩選條件已套用', '篩選失敗');
    }

    /** 處理 pageSize 改變：同步顯示並以新 pageSize 查詢（回到第 1 頁）。 */
    onPageSizeChange(pageSize: number): void {
        // 同步顯示（避免 UI 間隙顯示舊 pageSize）
        this.paginationInfo.set({ ...this.paginationInfo(), pageSize });

        // 保留現有條件，只換 page/pageSize → first/lastIndex
        const merged = QueryParamsBuilder.mergeSearchParams(this.currentSearchParams(), {});
        const params = this.withPageRange(merged, 1, pageSize);

        this.queryAndApply(params, `已調整為每頁 ${pageSize} 筆`, '分頁設定失敗');
    }

    /** 清除搜尋與篩選（保留 pageSize），回到第 1 頁並查詢。 */
    clearSearch(): void {
        this.searchKeyword.set('');
        this.selectedCourses.set(new Set());

        const base: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortDirection: 'asc',
        };
        const params = this.setRangeByPage(1, this.pageSize(), base);
        this.queryAndApply(params, '已清除所有搜尋條件', '清除搜尋失敗');
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
        const allIds = this.courses().map((c) => c.courseId);
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

    /** 清除頁面錯誤訊息（template 綁定）。 */
    clearError(): void { this.errorState.set(null); }

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
            // 如果有建立流程（例如開啟 modal 或導到編輯頁），改在此處呼叫。
            //TODO
            this.messageService.info('請使用新增功能建立課程。');
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
            { key: 'courseName', label: '課程名稱', sortable: true, width: '20%' },
            { key: 'learningType', label: '學習方式', sortable: true, width: '12%' },
            { key: 'skillType', label: '技能類型', sortable: false, width: '12%' },
            { key: 'level', label: '課程等級', sortable: false, width: '10%' },
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
        // If templates are not yet available, return a safe empty config to avoid template errors.
        if (!this.idTemplate || !this.codeTemplate || !this.nameTemplate || !this.emailTemplate || !this.deptTemplate || !this.timeTemplate || !this.actionsTemplate) {
            return {
                data: this.courses(),
                trackByFn: (i: number, item: Course) => item.courseId,
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
                width: '11%'
            },
            {
                key: 'learningType',
                cssClass: 'fw-medium',
                width: '16%'
            },
            {
                key: 'skillType',
                cssClass: 'text-muted',
                width: '17%'
            },
            {
                key: 'level',
                cssClass: 'text-muted',
                width: '11%'
            },
            {
                key: 'isActive',
                align: 'center',
                width: '10%'
            },
            {
                key: 'createTime',
                cssClass: 'text-muted small',
                width: '12%'
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

            // attach the correct template by key
            switch (c.key) {
                case 'courseId':
                    col.template = this.idTemplate;
                    break;
                case 'courseName':
                    col.template = this.codeTemplate;
                    break;
                case 'learningType':
                    col.template = this.nameTemplate;
                    break;
                case 'skillType':
                    col.template = this.emailTemplate;
                    break;
                case 'level':
                    col.template = this.deptTemplate;
                    break;
                case 'isActive':
                    col.template = this.statusTemplate ?? undefined;
                    break;
                case 'createTime':
                    col.template = this.timeTemplate;
                    break;
                case 'actions':
                    col.template = this.actionsTemplate;
                    break;
            }

            return col;
        });

        return {
            data: this.courses(),
            trackByFn: (i: number, item: Course) => item.courseId,
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
        this.queryAndApply(params, undefined, '排序失敗');
    }

    /** 處理表頭全選 checkbox（以目前頁面的 items 為準）。 */
    onTableSelectAll(checked: boolean): void {
        const pageIds = this.courses().map((c) => c.courseId);
        const next = new Set(this.selectedCourses());
        if (checked) {
            pageIds.forEach((id) => next.add(id));
        } else {
            pageIds.forEach((id) => next.delete(id));
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

    // 編輯/查看/刪除按鈕處理（可改為路由或 modal）
    onView(item: Course): void {
        // TODO: 導航到查看頁或開啟 modal
        this.messageService.info(`查看課程 ${item.courseId}`);
    }

    // 編輯按鈕處理（可改為路由導航或開啟編輯 modal）
    onEdit(item: Course): void {
        // TODO: 導航到編輯頁或開啟 modal
        this.messageService.info(`編輯課程 ${item.courseId}`);
    }

    // 刪除按鈕處理（示範）：確認後應呼叫 service 並刷新資料。
    onDelete(item: Course): void {
        // 若有 confirm API，可改用 confirmation dialog
        const confirmed = confirm(`確定要刪除課程 ${item.courseId} - ${item.courseName} 嗎？`);
        if (!confirmed) return;

        // TODO: 呼叫 courseService.deleteCourse(item.courseId) 並重新查詢或移除 local data
        this.messageService.info(`已執行刪除（模擬）：${item.courseId}`);
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


}
