/**
 * 核心通用模型
 * - 前端統一 camelCase，由攔截器轉換 snake_case
 * - 清楚區分「請求」與「回應」
 * 🔴 跟後端有關（請求/回應契約，欄位與格式要對齊）
 * 🟢 純前端自用（UI 狀態/預設值/工具，後端不知道）
 */

/* ================== 基礎請求 ================== */

/** 🔴 基礎查詢 DTO（純請求用；後端會解析這些欄位） */
export interface BaseQueryDto {
    pageable?: boolean;           // 是否分頁（預設 true）
    firstIndexInPage?: number;    // 該頁第一筆的 index (由1開始)
    lastIndexInPage?: number;     // 該頁最後一筆的 index (由1開始)
    sortColumn?: string;          // 排序欄位名
    sortDirection?: 'asc' | 'desc';
}

/** 🟢 前端 UI 用的分頁/排序/篩選封裝（送出前會轉成 BaseQueryDto + 篩選） */
export interface QueryOptions<T = any, F = any> {
    page?: number;
    pageSize?: number;
    sort?: { field: keyof T; direction: 'asc' | 'desc' }; // keyof T = 編譯期防呆
    searchTerm?: string;
    filters?: F; // UI 狀態；送出前再轉對應 API 欄位；F = 一個泛型，代表「不同功能」可以決定自己要的過濾型別。
}

/** 🔴 模組可繼承的搜尋基底（屬請求契約的一部分） */
export interface BaseSearchParams extends BaseQueryDto {
    keyword?: string; //在service做映射
    isActive?: boolean;
}

/* ================== 基礎回應 ================== */

/** 🔴 分頁結果 DTO（回應用；鍵名/結構要接住後端回傳） */
export interface PagerDto<T> {
    dataList: T[];                // 後端 data_list，攔截器自動轉換
    totalRecords: number;         // 後端 total_records，攔截器自動轉換
    firstIndexInPage?: number;    // 後端 first_index_in_page，攔截器自動轉換
    lastIndexInPage?: number;     // 後端 last_index_in_page，攔截器自動轉換
    pageable?: boolean;           // 後端 pageable，無需轉換
    sortColumn?: string;          // 後端 sort_column，攔截器自動轉換
    sortDirection?: string;       // 後端 sort_direction，攔截器自動轉換
    // 前端計算欄位（為了 UI 方便）
    page?: number;
    pageSize?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

/** 🔴 API 回應包裝器（code/message/data 與後端一致） */
export interface ApiResponse<T> {
    code: number;     // 1000 = success（契約）
    message: string;
    data?: T;
}

/** 🔴 列表回應別名（= ApiResponse<PagerDto<T>>，屬回應契約） */
export type ServiceListResponse<T> = ApiResponse<PagerDto<T>>;

/* ================== 常數 ================== */

/** 🟢 前端預設分頁常數（UI/Service 使用） */
export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    PAGE_SIZE: 10,
    SORT_DIRECTION: 'asc' as const,
    MAX_PAGE_SIZE: 100,
} as const;

/** 🟢 模組預設排序欄位（前端自訂；值需對應後端白名單實際欄位名） */
export const SORT_DEFAULTS = {
    DEPARTMENT: 'deptCode' as const,
    EMPLOYEE: 'empCode' as const,
    JOB_ROLE: 'jobRoleCode' as const,
    COURSE: 'courseName' as const,
    COURSE_EVENT: 'activityTitle' as const,
} as const;
