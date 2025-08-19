import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
    Course,
    CourseCreateDto,
    CourseUpdateDto,
    CourseSearchParams,
    CourseListResponse,
    CourseFilters,
    CourseQueryOptions
} from '../models/course.model';
import {
    PagerDto,
    ApiResponse,
    PAGINATION_DEFAULTS,
    SORT_DEFAULTS
} from '../../../models/common.model';
import {
    PaginationUtil,
    QueryParamsBuilder,
    SortUtil,
    FilterUtil
} from '../../../core/utils/query.util';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
    // 🚀 使用 inject()
    protected readonly http = inject(HttpClient);
    protected readonly errorHandler = inject(HttpErrorHandlerService);
    protected readonly apiUrl = `${environment.apiBaseUrl}/courses`;

    // 📊 使用 signals 管理狀態
    protected readonly coursesSignal = signal<Course[]>([]);
    protected readonly loadingSignal = signal<boolean>(false);
    protected readonly searchParamsSignal = signal<CourseSearchParams>({});
    protected readonly paginationSignal = signal<PagerDto<Course> | null>(null);

    // 🔍 公開的 computed signals
    readonly courses = this.coursesSignal.asReadonly(); // 外部只能讀取，不能修改
    readonly loading = this.loadingSignal.asReadonly();
    readonly searchParams = this.searchParamsSignal.asReadonly();
    readonly pagination = this.paginationSignal.asReadonly();

    // 📈 計算屬性 - 使用工具函數
    readonly totalRecords = computed(() => this.pagination()?.totalRecords || 0);
    readonly currentPage = computed(() => this.pagination()?.page || 1);
    readonly pageSize = computed(() => this.pagination()?.pageSize || PAGINATION_DEFAULTS.PAGE_SIZE);
    readonly totalPages = computed(() => this.pagination()?.totalPages || 0);
    readonly hasNext = computed(() => this.pagination()?.hasNext || false);
    readonly hasPrevious = computed(() => this.pagination()?.hasPrevious || false);
    readonly firstIndexInPage = computed(() => this.pagination()?.firstIndexInPage || 1);
    readonly lastIndexInPage = computed(() => this.pagination()?.lastIndexInPage || 0);

    /**
     * 🔍 搜尋課程 - 主要的查詢方法
     * @param params 查詢參數
     * @returns 課程列表回應的 Observable
     */
    /**
     * 簡單直接的 API 呼叫
     */
    searchCourses(params: CourseSearchParams): Observable<CourseListResponse> {
        this.loadingSignal.set(true);

        // 確保 sort_column 和 sort_direction 包含在 API 請求中，使用預設值
        const apiParams = {
            ...params,
            sort_column: params.sortColumn || 'courseId',
            sort_direction: params.sortDirection || 'asc'
        };

        return this.http.post<CourseListResponse>(`${this.apiUrl}/query`, apiParams).pipe(
            tap(response => {
                // 自動更新狀態
                if (response.code === 1000) {
                    this.coursesSignal.set(response.data?.dataList || []);
                    // 更新分頁資訊
                    this.paginationSignal.set(response.data || null);
                    // 更新搜尋參數
                    this.searchParamsSignal.set(params);
                }
                this.loadingSignal.set(false);
            }),
            // 👨‍🏫 學習老師：統一錯誤處理
            catchError(error => {
                this.loadingSignal.set(false);
                this.coursesSignal.set([]);
                this.paginationSignal.set(null);
                return this.errorHandler.handleError<CourseListResponse>('課程查詢', {
                    code: -1,
                    message: '課程查詢失敗',
                    data: {
                        dataList: [],
                        totalRecords: 0,
                        pageable: true,
                        page: 1,
                        pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                        totalPages: 0,
                        hasNext: false,
                        hasPrevious: false
                    }
                })(error);
            })
        );
    }

    /**
     * 🎯 三態排序功能
     * @param sortColumn 排序欄位
     * @param sortDirection 排序方向 (asc/desc/null)
     * @returns 排序後的課程列表 Observable
     */
    sortCourses(sortColumn: keyof Course, sortDirection: 'asc' | 'desc' | null): Observable<CourseListResponse> {
        const currentParams = { ...this.searchParamsSignal() };

        if (sortDirection === null) {
            // 清除排序 - 三態排序的第三態
            delete currentParams.sortColumn;
            delete currentParams.sortDirection;
        } else {
            // 設定新的排序，使用 SortUtil 標準化
            currentParams.sortColumn = sortColumn as string;
            currentParams.sortDirection = SortUtil.normalizeDirection(sortDirection);
        }

        return this.searchCourses(currentParams);
    }

    /**
     * 🔄 切換排序方向
     * @param sortColumn 排序欄位
     * @returns 切換排序後的課程列表 Observable
     */
    toggleSort(sortColumn: keyof Course): Observable<CourseListResponse> {
        const currentParams = this.searchParamsSignal();
        const currentColumn = currentParams.sortColumn;
        const currentDirection = currentParams.sortDirection as 'asc' | 'desc';

        let newDirection: 'asc' | 'desc' | null;

        if (currentColumn !== sortColumn) {
            // 點擊不同欄位，預設升序
            newDirection = 'asc';
        } else {
            // 點擊相同欄位，使用 SortUtil 切換方向（三態循環）
            if (currentDirection === 'asc') {
                newDirection = 'desc';
            } else if (currentDirection === 'desc') {
                newDirection = null; // 第三態：清除排序
            } else {
                newDirection = 'asc';
            }
        }

        return this.sortCourses(sortColumn, newDirection);
    }

    /**
     * 🔎 關鍵字搜尋
     * @param keyword 搜尋關鍵字
     * @returns 搜尋結果 Observable
     * 自動清理空白字元
     * 重置到第一頁
     * 保留其他搜尋條件
     */
    searchByKeyword(keyword: string): Observable<CourseListResponse> {
        const currentParams = { ...this.searchParamsSignal() };

        // 使用 QueryParamsBuilder 重設到第一頁
        const resetParams = QueryParamsBuilder.resetToFirstPage(currentParams);

        const searchParams = QueryParamsBuilder.mergeSearchParams(resetParams, {
            keyword: keyword.trim() || undefined
        });

        return this.searchCourses(searchParams);
    }

    /**
     * 📂 多重篩選功能
     * @param filters 篩選條件
     * @returns 篩選結果 Observable
     * 使用 FilterUtil.cleanFilters() 清理空值
     * 合併現有搜尋條件
     * 重置到第一頁
     */
    filterCourses(filters: CourseFilters): Observable<CourseListResponse> {
        const currentParams = { ...this.searchParamsSignal() };

        // 使用 FilterUtil 清理空值並重設到第一頁
        const cleanedFilters = FilterUtil.cleanFilters(filters);
        const resetParams = QueryParamsBuilder.resetToFirstPage(currentParams);
        const mergedParams = FilterUtil.mergeFilters(resetParams, cleanedFilters);

        return this.searchCourses(mergedParams);
    }

    /**
     * 📄 分頁功能 - 使用 PaginationUtil
     * @param page 頁碼 (從 1 開始)
     * @param pageSize 每頁筆數
     * @returns 分頁結果 Observable
     */
    /**
     * 執行步驟：
     * 1. 參數驗證：PaginationUtil.validatePagination()
     * 2. 格式轉換：PaginationUtil.toBackendPagination()
     * 3. 合併參數：QueryParamsBuilder.mergeSearchParams()
     * 4. 執行查詢：呼叫 searchCourses()
     */
    loadPage(page: number, pageSize?: number): Observable<CourseListResponse> {
        const currentParams = { ...this.searchParamsSignal() };
        const size = pageSize || this.pageSize() || PAGINATION_DEFAULTS.PAGE_SIZE;

        // 使用 PaginationUtil 驗證和轉換分頁參數
        const validatedPagination = PaginationUtil.validatePagination(page, size);
        const backendPagination = PaginationUtil.toBackendPagination(
            validatedPagination.page,
            validatedPagination.pageSize
        );

        const searchParams = QueryParamsBuilder.mergeSearchParams(currentParams, {
            ...backendPagination,
            pageable: true
        });

        return this.searchCourses(searchParams);
    }

    /**
     * 自動檢查是否有下一頁
     * @returns 下一頁結果 Observable
     */
    nextPage(): Observable<CourseListResponse> {
        if (!this.hasNext()) {
            return this.searchCourses(this.searchParamsSignal());
        }

        const currentPage = this.currentPage();
        return this.loadPage(currentPage + 1);
    }

    /**
     * 自動檢查是否有上一頁
     * @returns 上一頁結果 Observable
     */
    previousPage(): Observable<CourseListResponse> {
        if (!this.hasPrevious()) {
            return this.searchCourses(this.searchParamsSignal());
        }

        const currentPage = this.currentPage();
        return this.loadPage(Math.max(1, currentPage - 1));
    }

    /**
     * 🔄 重新載入 - 使用當前搜尋條件
     * @returns 重新載入結果 Observable
     */
    reload(): Observable<CourseListResponse> {
        return this.searchCourses(this.searchParamsSignal());
    }

    /**
     * 🧹 清除搜尋條件
     * @returns 清除後的結果 Observable
     */
    clearSearch(): Observable<CourseListResponse> {
        const resetParams: CourseSearchParams = {
            ...PaginationUtil.toBackendPagination(1, PAGINATION_DEFAULTS.PAGE_SIZE),
            pageable: true,
            sortColumn: SORT_DEFAULTS.COURSE,
            sortDirection: PAGINATION_DEFAULTS.SORT_DIRECTION
        };

        return this.searchCourses(resetParams);
    }

    /**
     * 🎛️ 使用 QueryOptions 進行查詢 (UI 友善的介面)
     * @param options UI 查詢選項
     * @returns 查詢結果 Observable
     */
    searchWithOptions(options: CourseQueryOptions): Observable<CourseListResponse> {
        const {
            page = 1,
            pageSize = PAGINATION_DEFAULTS.PAGE_SIZE,
            sort,
            searchTerm,
            filters
        } = options;

        // 使用工具函數轉換參數
        const validatedPagination = PaginationUtil.validatePagination(page, pageSize);
        const backendPagination = PaginationUtil.toBackendPagination(
            validatedPagination.page,
            validatedPagination.pageSize
        );

        const baseParams: CourseSearchParams = {
            ...backendPagination,
            pageable: true,
            keyword: searchTerm?.trim() || undefined
        };

        // 處理排序
        if (sort) {
            baseParams.sortColumn = sort.field as string;
            baseParams.sortDirection = SortUtil.normalizeDirection(sort.direction);
        }

        // 處理篩選條件
        const cleanedFilters = filters ? FilterUtil.cleanFilters(filters) : {};
        const finalParams = FilterUtil.mergeFilters(baseParams, cleanedFilters);

        return this.searchCourses(finalParams);
    }


    //CRUD實作
    /**
     * 統一回應處理：
     * map(response => response.code === 1000 ? response.data || null : null)
     * 檢查成功碼 (1000)
     * 提取實際資料
     * 失敗時回傳 null
     */
    /**
     * 📝 取得單一課程資料
     * @param courseId 課程ID
     * @returns 課程詳細資料 Observable
     */
    getCourse(courseId: number): Observable<Course | null> {
        return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/find/${courseId}`).pipe(
            map(response => response.code === 1000 ? response.data || null : null),
            catchError(this.errorHandler.handleError<Course | null>('課程詳細資料查詢', null))
        );
    }

    /**
     * ➕ 新增課程
     * @param data 課程資料
     * @returns 新增後的課程資料 Observable
     */
    createCourse(data: CourseCreateDto): Observable<Course | null> {
        return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/create`, data).pipe(
            map(response => response.code === 1000 ? response.data || null : null),
            tap(result => {
                if (result) {
                    // 新增成功後重新載入列表
                    this.reload().subscribe();
                }
            }),
            catchError(this.errorHandler.handleError<Course | null>('課程新增', null))
        );
    }

    /**
     * ✏️ 更新課程
     * @param data 課程資料
     * @returns 更新後的課程資料 Observable
     */
    updateCourse(data: CourseUpdateDto): Observable<Course | null> {
        return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/update`, data).pipe(
            map(response => response.code === 1000 ? response.data || null : null),
            tap(result => {
                if (result) {
                    // 更新成功後重新載入列表
                    this.reload().subscribe();
                }
            }),
            catchError(this.errorHandler.handleError<Course | null>('課程更新', null))
        );
    }

    /**
     * 🗑️ 刪除課程
     * @param courseId 課程ID
     * @returns 刪除結果 Observable
     */
    deleteCourse(courseId: number): Observable<boolean> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { courseId }).pipe(
            map(response => response.code === 1000),
            tap(success => {
                if (success) {
                    // 刪除成功後重新載入列表
                    this.reload().subscribe();
                }
            }),
            catchError(this.errorHandler.handleError<boolean>('課程刪除', false))
        );
    }

    // 輔助工具
    /**
     * 📊 取得目前載入狀態
     * @returns 是否正在載入
     */
    isLoading(): boolean {
        return this.loadingSignal();
    }

    /**
     * 📋 取得目前搜尋參數
     * @returns 當前搜尋參數
     */
    getCurrentSearchParams(): CourseSearchParams {
        return { ...this.searchParamsSignal() };
    }

    /**
     * 🔢 取得目前課程數量
     * @returns 目前載入的課程數量
     */
    getCourseCount(): number {
        return this.coursesSignal().length;
    }

    /**
     * 🎯 檢查是否有搜尋條件
     * @returns 是否有搜尋條件
     */
    hasSearchParams(): boolean {
        const params = this.searchParamsSignal();
        return !!(
            params.keyword ||
            params.courseEventId ||
            params.learningType ||
            params.skillType ||
            params.level ||
            params.isActive !== undefined ||
            params.sortColumn
        );
    }

    /**
     * 📊 取得完整分頁資訊
     * @returns 分頁資訊物件
     */
    getPaginationInfo() {
        return {
            currentPage: this.currentPage(),
            pageSize: this.pageSize(),
            totalPages: this.totalPages(),
            totalRecords: this.totalRecords(),
            hasNext: this.hasNext(),
            hasPrevious: this.hasPrevious(),
            firstIndexInPage: this.firstIndexInPage(),
            lastIndexInPage: this.lastIndexInPage()
        };
    }

    /**
     * 🔍 取得目前排序狀態
     * @returns 排序資訊
     */
    getCurrentSort(): { column?: string; direction?: 'asc' | 'desc' } {
        const params = this.searchParamsSignal();
        return {
            column: params.sortColumn,
            direction: params.sortDirection as 'asc' | 'desc'
        };
    }

    /**
     * 📈 取得統計資訊
     * @returns 課程統計
     */
    getStatistics() {
        const courses = this.coursesSignal();
        return {
            total: this.totalRecords(), // 總筆數
            currentPageCount: courses.length, // 當前頁筆數
            activeCount: courses.filter(c => c.isActive).length, // 啟用課程數
            inactiveCount: courses.filter(c => !c.isActive).length // 停用課程數
        };
    }
}