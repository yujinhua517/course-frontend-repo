import {
    BaseSearchParams,
    QueryOptions,
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../models/common.model';

/* ----------------------------------------------------------------
 * 基本常數 / 型別
 * ---------------------------------------------------------------- */

/** 上下半年選項（常數 + 型別同源，避免拼錯） */
export const SEMESTER_OPTIONS = [
    { value: 'H1', label: '上半年 (H1)', description: '1月至6月' },
    { value: 'H2', label: '下半年 (H2)', description: '7月至12月' }
] as const;

/** 由常數推導出的安全型別：'H1' | 'H2' */
export type Semester = typeof SEMESTER_OPTIONS[number]['value'];

/** 共用日期區間型別（UI 層好維護；呼叫 API 再展開為 from/to） */
export interface DateRange {
    from?: string; // ISO yyyy-MM-dd
    to?: string;   // ISO yyyy-MM-dd
}

/* ----------------------------------------------------------------
 * 核心資料型別（前端 View/Domain Model）
 * ---------------------------------------------------------------- */


// 課程活動主資料（列表/詳情通用藍圖）
// - 系統欄位（create*/update*）由後端產生 → 設為可選
// - 新增前沒有 id → courseEventId 可選

export interface CourseEvent {
    courseEventId?: number;           // 主鍵，自動遞增
    year: string;                     // 年度（例如 2025）
    semester: Semester;               // 學期：H1/H2（型別安全）
    activityTitle: string;            // 活動標題
    description?: string;             // 活動描述
    expectedCompletionDate?: string;  // 預期完成日期（ISO）
    submissionDeadline?: string;      // 提交截止日期（ISO）
    activationDate?: string;          // 啟動日期（ISO）
    isActive: boolean;                // 是否啟用
    createTime?: string;              // 建立時間（後端產生）
    createUser?: string;              // 建立者（後端產生）
    updateTime?: string;              // 最後更新時間（後端產生）
    updateUser?: string;              // 最後更新者（後端產生）
}

/* ----------------------------------------------------------------
 * DTO（與後端傳輸專用；用型別運算自動對齊核心型別）
 * ---------------------------------------------------------------- */

/** 建立用 DTO（移除 id 與系統欄位，永遠與主型別同步） */
export type CourseEventCreateDto = Omit<
    CourseEvent,
    'courseEventId' | 'createTime' | 'createUser' | 'updateTime' | 'updateUser'
>;

/** 更新用 DTO（允許部分更新 + 需要 id） */
export type CourseEventUpdateDto = Partial<CourseEventCreateDto> & {
    courseEventId: number;
};

/* ----------------------------------------------------------------
 * 查詢 / 篩選
 * ---------------------------------------------------------------- */

/**
 * API 搜尋參數（傳給後端的最終格式）
 * - 若 UI 使用 DateRange，請在 Service 端轉成下列 from/to 欄位
 */
export interface CourseEventSearchParams extends BaseSearchParams {
    courseEventId?: number;
    year?: string;
    semester?: Semester;
    activityTitle?: string;
    description?: string;

    expectedCompletionDate?: string;
    expectedCompletionDateFrom?: string;
    expectedCompletionDateTo?: string;

    submissionDeadline?: string;
    submissionDeadlineFrom?: string;
    submissionDeadlineTo?: string;

    activationDate?: string;
    activationDateFrom?: string;
    activationDateTo?: string;

    isActive?: boolean;
}

/** UI 篩選條件（頁面狀態） */
export interface CourseEventFilters {
    year?: string;
    semester?: Semester;
    isActive?: boolean;
    expectedCompletionDate?: DateRange;
    submissionDeadline?: DateRange;
    activationDate?: DateRange;
}

/** 查詢選項（若你有共用表格/搜尋模組，維持泛型相容） */
export interface CourseEventQueryOptions
    extends QueryOptions<CourseEvent, CourseEventFilters> { }

/* ----------------------------------------------------------------
 * 回應型別
 * ---------------------------------------------------------------- */

/** 列表回應（沿用你的共用泛型封裝） */
export interface CourseEventListResponse extends ServiceListResponse<CourseEvent> { }

/* ----------------------------------------------------------------
 * UI 輔助工具（下拉選項/預設值）
 * ---------------------------------------------------------------- */

/** 年度選項 */
export interface YearOption {
    value: string;
    label: string;
}

/**
 * 產生年度選項
 * @param span     當前年份前後跨度（預設 5 → 共 11 年）
 * @param sort     排序方向（預設新到舊 desc）
 */
export function generateYearOptions(
    span: number = 5,
    sort: 'asc' | 'desc' = 'desc'
): YearOption[] {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: span * 2 + 1 }, (_, i) => currentYear - span + i)
        .map(y => ({ value: String(y), label: String(y) }));
    return sort === 'asc' ? years : years.reverse();
}

/** 取得當前半年度（H1/H2） */
export function getCurrentSemester(): Semester {
    const m = new Date().getMonth() + 1; // 1..12
    return m <= 6 ? 'H1' : 'H2';
}

/** 取得當前年度（yyyy） */
export function getCurrentYear(): string {
    return String(new Date().getFullYear());
}

/* ----------------------------------------------------------------
 * 重新匯出共用型別（讓其他模組可從此檔一次取得）
 * ---------------------------------------------------------------- */
export type {
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../models/common.model';
/* ----------------------------------------------------------------
 * （選擇性）UI Filters → API SearchParams 轉換器
 * 放這或放 Service/Utils 皆可；讓 UI 狀態更乾淨
 * ---------------------------------------------------------------- */
export function buildCourseEventSearchParams(
    filters: CourseEventFilters,
    base: BaseSearchParams
): CourseEventSearchParams {
    const params: CourseEventSearchParams = { ...base };

    if (filters.year) params.year = filters.year;
    if (filters.semester) params.semester = filters.semester;
    if (typeof filters.isActive === 'boolean') params.isActive = filters.isActive;

    if (filters.expectedCompletionDate) {
        params.expectedCompletionDateFrom = filters.expectedCompletionDate.from;
        params.expectedCompletionDateTo = filters.expectedCompletionDate.to;
    }
    if (filters.submissionDeadline) {
        params.submissionDeadlineFrom = filters.submissionDeadline.from;
        params.submissionDeadlineTo = filters.submissionDeadline.to;
    }
    if (filters.activationDate) {
        params.activationDateFrom = filters.activationDate.from;
        params.activationDateTo = filters.activationDate.to;
    }

    return params;
}
