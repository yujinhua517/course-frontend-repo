/**
 * 核心通用模型定義
 * 
 * 統一三個功能模組 (department, employee, job-role) 的查詢API設計
 * 遵循 Angular 19+ 規範，使用 camelCase 命名
 * 依賴攔截器進行前後端格式轉換
 */

/**
 * 基礎查詢 DTO - 對應後端 PageBean (前端使用 camelCase)
 */
export interface BaseQueryDto {
  /** 總筆數 */
  totalRecords?: number;
  /** 該頁第一筆的 index (由1開始) */
  firstIndexInPage?: number;
  /** 該頁最後一筆的 index (由1開始) */
  lastIndexInPage?: number;
  /** 是否要分頁查詢 */
  pageable?: boolean;
  /** 每頁筆數 */
  pageSize?: number;
  /** 要排序的欄位 */
  sortColumn?: string;
  /** 升/降序 */
  sortDirection?: string;
}

/**
 * 分頁結果 DTO - 對應後端 PagerDto<T> (前端使用 camelCase)
 */
export interface PagerDto<T> {
  /** 資料列表 */
  dataList: T[];
  /** 總筆數 */
  totalRecords: number;
  /** 該頁第一筆的 index (由1開始) */
  firstIndexInPage: number;
  /** 該頁最後一筆的 index (由1開始) */
  lastIndexInPage: number;
  /** 是否要分頁查詢 */
  pageable: boolean;
  /** 每頁筆數 */
  pageSize?: number;
  /** 要排序的欄位 */
  sortColumn?: string;
  /** 升/降序 */
  sortDirection?: string;
  
  // Spring Data Page 額外資訊（前端計算用）
  totalPages?: number;
  page?: number;
  size?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * API 回應包裝器 - 對應後端 ApiResponse<T>
 */
export interface ApiResponse<T> {
  /** 回應代碼，1000 表示成功 */
  code: number;
  /** 回應訊息 */
  message: string;
  /** 回應資料 */
  data?: T;
}

/**
 * 分頁查詢參數輔助介面 (用於前端組件)
 */
export interface PaginationParams {
  /** 當前頁數 (1-based) */
  page?: number;
  /** 每頁筆數 */
  size?: number;
  /** 排序欄位 */
  sort?: string;
  /** 排序方向 */
  direction?: 'asc' | 'desc';
}

/**
 * 統一查詢參數基礎介面
 * 所有模組的查詢參數都應該繼承此介面
 */
export interface BaseSearchParams extends BaseQueryDto {
  /** 關鍵字搜尋 */
  keyword?: string;
  /** 啟用狀態 */
  isActive?: boolean;
  /** 分頁頁數 (0-based, 用於內部計算) */
  pageIndex?: number;
  /** 分頁頁數 (1-based, 用於API請求) */
  page?: number;
}

/**
 * 排序方向類型
 */
export type SortDirection = 'asc' | 'desc' | 'ASC' | 'DESC';

/**
 * 排序配置介面
 */
export interface SortConfig<T = any> {
  /** 排序欄位 */
  field: keyof T;
  /** 排序方向 */
  direction: SortDirection;
}

/**
 * 分頁配置介面
 */
export interface PaginationConfig {
  /** 當前頁數 (1-based) */
  page: number;
  /** 每頁筆數 */
  pageSize: number;
}

/**
 * 統一查詢選項介面
 * 整合分頁、排序、篩選等所有查詢需求
 */
export interface QueryOptions<T = any, F = any> {
  // 分頁參數
  page?: number;
  pageSize?: number;
  
  /** 分頁配置 */
  pagination?: PaginationConfig;
  /** 排序配置 */
  sort?: SortConfig<T>;
  /** 搜尋關鍵字 */
  searchTerm?: string;
  /** 篩選條件 */
  filters?: F;
}

/**
 * 統一的 Service 列表回應介面
 */
export interface ServiceListResponse<T> {
  code: number;
  message: string;
  data: PagerDto<T>;
}

/**
 * 預設分頁常數
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  SORT_DIRECTION: 'asc' as const,
  MAX_PAGE_SIZE: 100
} as const;

/**
 * 預設排序常數
 */
export const SORT_DEFAULTS = {
  DIRECTION: 'asc' as const,
  DEPARTMENT: 'deptCode' as const,
  EMPLOYEE: 'empCode' as const,
  JOB_ROLE: 'jobRoleCode' as const
} as const;
