import {
    BaseSearchParams,
    QueryOptions,
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

/** 年度（yyyy 字串）— 若要更嚴，之後可改 template literal 型別 */
export type Year = string;

/** 共用日期區間型別（UI 層好維護；呼叫 API 再展開為 from/to） */
export interface DateRange {
    from?: string; // ISO 日期 yyyy-MM-dd
    to?: string;   // ISO 日期 yyyy-MM-dd
}

/* ----------------------------------------------------------------
 * 核心資料型別（前端 View/Domain Model）
 * ---------------------------------------------------------------- */

/**
 * 課程活動主資料（列表/詳情通用藍圖）
 * - 系統欄位（create/update）由後端產生 → 設為可選
 * - 新增前沒有 id → courseEventId 可選
*/
export interface CourseEvent {
    courseEventId?: number;           // 主鍵，自動遞增
    year: Year;                       // 例如 "2025"
    semester: Semester;               // 'H1' | 'H2'
    activityTitle: string;            // 活動標題
    description?: string;             // 活動描述
    /** ISO 日期（YYYY-MM-DD） */
    expectedCompletionDate?: string;  // 預期完成日期
    /** ISO 日期（YYYY-MM-DD） */
    submissionDeadline?: string;      // 提交截止日期
    /** ISO 日期（YYYY-MM-DD） */
    activationDate?: string;          // 啟動日期
    isActive: boolean;                // 是否啟用
    /** ISO 日期時間（YYYY-MM-DDTHH:mm:ss） */
    createTime?: string;              // 建立時間（後端產生）
    createUser?: string;              // 建立者（後端產生）
    /** ISO 日期時間（YYYY-MM-DDTHH:mm:ss） */
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
 * - 單值欄位（expectedCompletionDate/submissionDeadline/activationDate）
 *   代表「等於某一天」的語意；若用不到可在專案規約中關閉
 */
export interface CourseEventSearchParams extends BaseSearchParams {
    courseEventId?: number;
    year?: Year;
    semester?: Semester;
    activityTitle?: string;
    description?: string;

    /** 精準等於（可選用） */
    expectedCompletionDate?: string;
    /** 區間 */
    expectedCompletionDateFrom?: string;
    expectedCompletionDateTo?: string;

    /** 精準等於（可選用） */
    submissionDeadline?: string;
    /** 區間 */
    submissionDeadlineFrom?: string;
    submissionDeadlineTo?: string;

    /** 精準等於（可選用） */
    activationDate?: string;
    /** 區間 */
    activationDateFrom?: string;
    activationDateTo?: string;

    isActive?: boolean;
}

/** UI 篩選條件（頁面狀態） */
export interface CourseEventFilters {
    year?: Year;
    semester?: Semester;
    isActive?: boolean;
    expectedCompletionDate?: DateRange;
    submissionDeadline?: DateRange;
    activationDate?: DateRange;
}

/** 查詢選項（若你有共用表格/搜尋模組，維持泛型相容） */
export type CourseEventQueryOptions = QueryOptions<CourseEvent, CourseEventFilters>;

/* ----------------------------------------------------------------
 * 回應型別
 * ---------------------------------------------------------------- */

/** 列表回應（語意型別別名；更精簡） */
export type CourseEventListResponse = ServiceListResponse<CourseEvent>;

/* ----------------------------------------------------------------
 * UI 輔助工具（下拉選項/預設值）
 * ---------------------------------------------------------------- */

export interface YearOption {
    value: string;
    label: string;
}

/**
 * 產生年度選項
 * @param span     當前年份前後跨度（預設 5 → 共 11 年）
 * @param sort     排序方向（預設新到舊 desc）
 * @param baseYear 預設使用系統年；可在測試/SSR 場景指定
 */
export function generateYearOptions(
    span: number = 5,
    sort: 'asc' | 'desc' = 'desc',
    baseYear: number = new Date().getFullYear()
): YearOption[] {
    const years = Array.from({ length: span * 2 + 1 }, (_, i) => baseYear - span + i)
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
 * （選擇性）UI Filters → API SearchParams 轉換器
 * 放這或放 Service/Utils 皆可；讓 UI 狀態更乾淨
 * ---------------------------------------------------------------- */
export function buildCourseEventSearchParams(
    filters: CourseEventFilters,
    base: BaseSearchParams
): CourseEventSearchParams {
    const params: CourseEventSearchParams = { ...base };

    const {
        year, semester, isActive,
        expectedCompletionDate, submissionDeadline, activationDate
    } = filters ?? {};

    if (year) params.year = year;
    if (semester) params.semester = semester;
    if (typeof isActive === 'boolean') params.isActive = isActive;

    if (expectedCompletionDate) {
        params.expectedCompletionDateFrom = expectedCompletionDate.from;
        params.expectedCompletionDateTo = expectedCompletionDate.to;
    }
    if (submissionDeadline) {
        params.submissionDeadlineFrom = submissionDeadline.from;
        params.submissionDeadlineTo = submissionDeadline.to;
    }
    if (activationDate) {
        params.activationDateFrom = activationDate.from;
        params.activationDateTo = activationDate.to;
    }

    return params;
}
