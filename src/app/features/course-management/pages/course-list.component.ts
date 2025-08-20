import { Component, inject, signal, computed, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { UserStore } from '../../../core/auth/user.store';
import type { User, Permission } from '../../../models/user.model';
import { SearchFilterComponent, SearchFilterConfig } from '../../../shared/components/search-filter/search-filter.component';

import { CourseService } from '../services/course.service';
import { GlobalMessageService } from '../../../core/message/global-message.service';

import { Course, CourseSearchParams, LEARNING_TYPE_OPTIONS, SKILL_TYPE_OPTIONS, LEVEL_OPTIONS } from '../models/course.model';
import { ServiceListResponse } from '../../../models/common.model';
import { PaginationUtil, QueryParamsBuilder } from '../../../core/utils/query.util';

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchFilterComponent],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit {
    // ===== DI =====
    private readonly courseService = inject(CourseService);
    private readonly messageService = inject(GlobalMessageService);
    private readonly userStore = inject(UserStore);

    // ===== 常數（專案 API 成功碼）=====
    private static readonly API_SUCCESS = 1000;

    // ===== 本地狀態 signals =====
    readonly searchKeyword = signal<string>(''); // 搜尋框文字。
    readonly currentSearchParams = signal<CourseSearchParams>({}); // 目前查詢參數（例：排序、篩選、分頁）。
    readonly selectedCourses = signal<Set<number>>(new Set()); // 被勾選的課程 id 集合。
    readonly isInitialized = signal<boolean>(false); // 是否已完成初始化（避免一開始就亂觸發搜尋）。

    // 資料 & 載入狀態
    readonly coursesData = signal<Course[]>([]); // 畫面要顯示的課程陣列。
    readonly loadingState = signal<boolean>(false); // 是否載入中。

    // 分頁顯示資訊（全部由 API 回應推導）
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

    // ===== computed: 從狀態「算出來」的值 =====
    readonly courses = computed(() => this.coursesData());
    readonly loading = computed(() => this.loadingState());
    readonly totalRecords = computed(() => this.paginationInfo().totalRecords);
    readonly currentPage = computed(() => this.paginationInfo().currentPage);
    readonly pageSize = computed(() => this.paginationInfo().pageSize);
    readonly totalPages = computed(() => this.paginationInfo().totalPages);
    readonly hasNext = computed(() => this.paginationInfo().hasNext);
    readonly hasPrevious = computed(() => this.paginationInfo().hasPrevious);

    // 選取狀態
    readonly hasSelectedCourses = computed(() => this.selectedCourses().size > 0);
    readonly selectedCount = computed(() => this.selectedCourses().size);
    readonly isEmpty = computed(() => this.courses().length === 0);
    readonly hasData = computed(() => this.courses().length > 0);

    // 權限（讀 userStore 即時計算）
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

    // 搜尋副作用：keyword 變更就觸發（初始化後才生效）
    /**
     * 每次 searchKeyword 改變，這段就會「自動」跑。
     * 只有在初始化完成，且字數 ≥ 2 才發出搜尋。
     */
    private readonly searchEffect = effect(() => {
        const keyword = this.searchKeyword().trim();
        if (this.isInitialized() && keyword.length >= 2) {
            this.performSearch(keyword);
        }
    });

    // ================== 生命週期 ==================
    /**
     * 一進來就載入第一批列表資料。
     * 然後打開 isInitialized，讓 effect 從此生效。
     */
    ngOnInit(): void {
        this.loadInitialData();
        this.isInitialized.set(true);
    }

    // ================== 共用私有工具 ==================
    private isApiSuccess<T>(res: ServiceListResponse<T>): boolean {
        return res.code === CourseListComponent.API_SUCCESS;
    }

    /** 用 PaginationUtil 由 page/pageSize 轉成 first/lastIndex（1-based）並合併成查詢參數 */
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

    /** 合併查詢條件→重設第一頁→套 page/pageSize 範圍 */
    private buildParams(updates: Partial<CourseSearchParams>): CourseSearchParams {
        const merged = QueryParamsBuilder.mergeSearchParams(this.currentSearchParams(), updates);
        const resetFirst = QueryParamsBuilder.resetToFirstPage(merged);
        return this.withPageRange(resetFirst, 1, this.pageSize());
    }


    /** 把 API 回來的 dataList 與分頁數字，存到本地 signals。*/
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

    /** 把「第幾頁/每頁幾筆」換算成 API 需要的「第幾筆到第幾筆」（1-based）。*/
    private setRangeByPage(page: number, pageSize: number, base: CourseSearchParams) {
        const first = (page - 1) * pageSize + 1;
        const last = page * pageSize;
        return { ...base, firstIndexInPage: first, lastIndexInPage: last };
    }

    /** 統一呼叫查詢 + finalize 關閉 loading + 成功即套用回應 */
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
                //成功就把資料丟進 applyPagerResponse，順便顯示成功訊息（如果有）。
                next: (res) => {
                    if (this.isApiSuccess(res) && res.data) {
                        this.applyPagerResponse(res);
                        if (successMsg) this.messageService.success(successMsg);
                    }
                    //失敗就顯示錯誤訊息。
                    else {
                        this.messageService.error(errorMsg ?? '查詢失敗');
                    }
                },
                error: () => this.messageService.error(errorMsg ?? '查詢失敗，請稍後再試'),
            });
    }

    // ================== 初始化 / 搜尋 ==================

    /** 初始載入：預設排序 + 第一頁 + 10 筆 */
    private loadInitialData(): void {
        const base: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortColumn: 'coursId',
            sortDirection: 'asc',
        };
        const initial = this.setRangeByPage(1, this.paginationInfo().pageSize, base);
        // 用統一方法 queryAndApply 發送與處理回應。
        this.queryAndApply(initial, undefined, '課程資料載入失敗');
    }

    /** 關鍵字搜尋：重置為第一頁 */
    private performSearch(keyword: string): void {
        const base = { ...this.currentSearchParams(), keyword };
        const params = this.setRangeByPage(1, this.pageSize(), base);
        this.queryAndApply(params, undefined, '搜尋失敗');
    }

    // ================== SearchFilterComponent 綁定 ==================

    /** SearchFilter 設定 */
    readonly searchFilterConfig = computed<SearchFilterConfig>(() => ({
        searchPlaceholder: '請輸入課程名稱或關鍵字…',
        searchLabel: '課程搜尋',
        showPageSize: true,
        pageSizeOptions: [10, 20, 50, 100],
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

    /** currentSearchParams → SearchFilter 的顯示值 */
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

    /** 搜尋框變更（effect 會自動觸發搜尋） */
    onSearchChange(keyword: string): void {
        this.searchKeyword.set(keyword);
    }

    /** 篩選變更（收斂型別，避免 any） */
    // 把新的篩選條件加進 currentSearchParams，重置回第 1 頁，再查一次。
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

    /** 每頁筆數變更：重置第一頁並沿用其它條件 */
    // 改每頁筆數 → 回到第 1 頁 → 查一次。
    onPageSizeChange(pageSize: number): void {
        // 同步顯示（避免 UI 間隙顯示舊 pageSize）
        this.paginationInfo.set({ ...this.paginationInfo(), pageSize });

        // 保留現有條件，只換 page/pageSize → first/lastIndex
        const merged = QueryParamsBuilder.mergeSearchParams(this.currentSearchParams(), {});
        const params = this.withPageRange(merged, 1, pageSize);

        this.queryAndApply(params, `已調整為每頁 ${pageSize} 筆`, '分頁設定失敗');
    }

    /** 清除搜尋條件（保留目前 pageSize） */
    clearSearch(): void {
        this.searchKeyword.set('');
        this.selectedCourses.set(new Set());

        const base: CourseSearchParams = {
            keyword: '',
            pageable: true,
            sortColumn: 'courseName',
            sortDirection: 'asc',
        };
        const params = this.setRangeByPage(1, this.pageSize(), base);
        this.queryAndApply(params, '已清除所有搜尋條件', '清除搜尋失敗');
    }

    // ================== 選取功能 ==================

    /** 切換單筆勾選。 */
    toggleCourseSelection(courseId: number): void {
        const set = new Set(this.selectedCourses());
        set.has(courseId) ? set.delete(courseId) : set.add(courseId);
        this.selectedCourses.set(set);
    }

    /** 這筆是否有被勾。 */
    isCourseSelected(courseId: number): boolean {
        return this.selectedCourses().has(courseId);
    }

    /** 如果都勾了就全取消；否則把目前頁面所有 id 全放進去。 */
    toggleSelectAll(): void {
        const allIds = this.courses().map((c) => c.courseId);
        const selected = this.selectedCourses();
        this.selectedCourses.set(
            selected.size === allIds.length ? new Set() : new Set(allIds),
        );
    }
}
