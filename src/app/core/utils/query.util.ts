/**
 * 統一查詢工具函數
 * 
 * 提供三個功能模組共用的查詢、分頁、排序相關工具函數
 * 符合 Angular 19+ 規範，使用純函數設計
 */

import { BaseQueryDto, BaseSearchParams, PAGINATION_DEFAULTS } from '../../models/common.model';

/**
 * 本地型別定義
 */
interface PaginationConfig {
    page: number;
    pageSize: number;
}

interface SortConfig<T> {
    field: keyof T;
    direction: 'asc' | 'desc';
}

/**
 * 分頁計算工具類
 */
export class PaginationUtil {
    /**
     * 根據 firstIndex 和 pageSize 計算頁數 (1-based)
     */
    static calculatePage(firstIndex: number, pageSize: number): number {
        return Math.floor((firstIndex - 1) / pageSize) + 1;
    }

    /**
     * 根據頁數和每頁筆數計算 firstIndex (1-based)
     */
    static calculateFirstIndex(page: number, pageSize: number): number {
        return (page - 1) * pageSize + 1;
    }

    /**
     * 根據頁數和每頁筆數計算 lastIndex (1-based)
     */
    static calculateLastIndex(page: number, pageSize: number): number {
        return page * pageSize;
    }

    /**
     * 計算總頁數
     */
    static calculateTotalPages(totalRecords: number, pageSize: number): number {
        return Math.ceil(totalRecords / pageSize);
    }

    /**
     * 驗證分頁參數
     */
    static validatePagination(page: number, pageSize: number): PaginationConfig {
        const validPage = Math.max(1, page);
        const validPageSize = Math.min(Math.max(1, pageSize), PAGINATION_DEFAULTS.MAX_PAGE_SIZE);

        return {
            page: validPage,
            pageSize: validPageSize
        };
    }

    /**
     * 將前端的 page/pageSize 轉換為後端的 firstIndexInPage/lastIndexInPage
     * 這個方法專門用於 Store 到 API 的轉換
     */
    static toBackendPagination(page: number, pageSize: number): {
        firstIndexInPage: number;
        lastIndexInPage: number;
    } {
        return {
            firstIndexInPage: this.calculateFirstIndex(page, pageSize),
            lastIndexInPage: this.calculateLastIndex(page, pageSize)
        };
    }

    /**
     * 將後端的 firstIndexInPage/lastIndexInPage 轉換為前端的 page/pageSize
     * 這個方法專門用於 API 回應到 Store 的轉換
     */
    static toFrontendPagination(firstIndexInPage: number, lastIndexInPage: number): {
        page: number;
        pageSize: number;
    } {
        const pageSize = lastIndexInPage - firstIndexInPage + 1;
        const page = this.calculatePage(firstIndexInPage, pageSize);
        return { page, pageSize };
    }
}

/**
 * 查詢參數建構工具類
 */
export class QueryParamsBuilder {
    /**
     * 建構基礎查詢參數（用於 API 請求）
     */
    static buildBaseQuery(params: BaseSearchParams): BaseQueryDto {
        return {
            pageable: params.pageable ?? true,
            firstIndexInPage: params.firstIndexInPage,
            lastIndexInPage: params.lastIndexInPage,
            sortColumn: params.sortColumn,
            sortDirection: params.sortDirection
        };
    }

    /**
     * 合併搜尋參數
     */
    static mergeSearchParams<T extends BaseSearchParams>(
        existing: T,
        updates: Partial<T>
    ): T {
        return { ...existing, ...updates };
    }

    /**
     * 重設分頁到第一頁（用於搜尋、篩選時）
     */
    static resetToFirstPage<T extends BaseSearchParams>(params: T): T {
        return {
            ...params,
            firstIndexInPage: 1,
            lastIndexInPage: PAGINATION_DEFAULTS.PAGE_SIZE
        };
    }
}

/**
 * 排序工具類
 */
export class SortUtil {
    /**
     * 標準化排序方向
     */
    static normalizeDirection(direction?: string): 'asc' | 'desc' {
        if (!direction) return 'asc';
        return direction.toLowerCase() === 'desc' ? 'desc' : 'asc';
    }

    /**
     * 轉換排序方向為後端格式
     */
    static toBackendDirection(direction: 'asc' | 'desc'): 'ASC' | 'DESC' {
        return direction.toUpperCase() as 'ASC' | 'DESC';
    }

    /**
     * 建構排序配置
     */
    static buildSortConfig<T>(
        field: keyof T,
        direction: 'asc' | 'desc' = 'asc'
    ): SortConfig<T> {
        return {
            field,
            direction: SortUtil.normalizeDirection(direction)
        };
    }

    /**
     * 切換排序方向
     */
    static toggleDirection(currentDirection: 'asc' | 'desc'): 'asc' | 'desc' {
        return currentDirection === 'asc' ? 'desc' : 'asc';
    }
}

/**
 * 篩選工具類
 */
export class FilterUtil {
    /**
     * 清理空值篩選條件
     */
    static cleanFilters<T extends Record<string, any>>(filters: T): Partial<T> {
        const cleaned: Partial<T> = {};

        for (const [key, value] of Object.entries(filters)) {
            if (value !== null && value !== undefined && value !== '') {
                cleaned[key as keyof T] = value;
            }
        }

        return cleaned;
    }

    /**
     * 合併篩選條件
     */
    static mergeFilters<T extends Record<string, any>>(
        existing: T,
        updates: Partial<T>
    ): T {
        return { ...existing, ...FilterUtil.cleanFilters(updates) };
    }
}

/**
 * 通用查詢參數轉換器
 * 負責將前端查詢參數轉換為符合後端 API 格式的請求參數
 */
export class QueryTransformer {
    /**
     * 轉換為統一的 API 請求參數格式
     */
    static toApiParams<T extends BaseSearchParams>(
        params: T,
        columnMapping?: Record<string, string>
    ): Record<string, any> {
        const baseQuery = QueryParamsBuilder.buildBaseQuery(params);

        // 映射排序欄位（如果有提供映射表）
        const sortColumn = columnMapping && params.sortColumn
            ? columnMapping[params.sortColumn] || params.sortColumn
            : params.sortColumn;

        return {
            ...baseQuery,
            ...(sortColumn && { sortColumn }),
            ...(params.keyword && { keyword: params.keyword }),
            ...(params.isActive !== undefined && { isActive: params.isActive }),
        };
    }

    /**
     * 適配後端回應為前端格式
     * 注意：攔截器已經處理了 snake_case -> camelCase 轉換
     */
    static adaptResponse<T>(
        backendResponse: any,
        requestParams: BaseSearchParams
    ): any {
        if (backendResponse.code !== 1000) {
            throw new Error(backendResponse.message || '查詢失敗');
        }

        const data = backendResponse.data;

        // 攔截器已經轉換了欄位名稱，直接使用即可
        // 只需要計算前端 UI 需要的額外欄位
        const firstIndex = data.firstIndexInPage || 1;
        const lastIndex = data.lastIndexInPage || PAGINATION_DEFAULTS.PAGE_SIZE;
        const pageSize = lastIndex - firstIndex + 1;
        const page = PaginationUtil.calculatePage(firstIndex, pageSize);

        return {
            ...data, // 包含 dataList, totalRecords, firstIndexInPage, lastIndexInPage 等
            // 計算額外分頁資訊供 UI 使用
            page: page,
            pageSize: pageSize,
            totalPages: PaginationUtil.calculateTotalPages(data.totalRecords || 0, pageSize),
            hasNext: page < PaginationUtil.calculateTotalPages(data.totalRecords || 0, pageSize),
            hasPrevious: page > 1
        };
    }
}