/**
 * 統一查詢工具函數
 * 
 * 提供三個功能模組共用的查詢、分頁、排序相關工具函數
 * 符合 Angular 19+ 規範，使用純函數設計
 */

import { BaseQueryDto, BaseSearchParams, PaginationConfig, SortConfig, PAGINATION_DEFAULTS } from '../models/common.model';

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
}

/**
 * 查詢參數建構工具類
 */
export class QueryParamsBuilder {
    /**
     * 建構基礎查詢參數（用於 API 請求）
     */
    static buildBaseQuery(params: BaseSearchParams): BaseQueryDto {
        const page = params.page || 1;
        const pageSize = params.pageSize || PAGINATION_DEFAULTS.PAGE_SIZE;

        return {
            firstIndexInPage: PaginationUtil.calculateFirstIndex(page, pageSize),
            lastIndexInPage: PaginationUtil.calculateLastIndex(page, pageSize),
            pageable: true,
            pageSize,
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
            page: 1,
            pageIndex: 0,
            firstIndexInPage: 1
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
            // 移除不需要的參數
            pageIndex: undefined,
            page: undefined
        };
    }

    /**
     * 適配後端回應為前端格式
     */
    static adaptResponse<T>(
        backendResponse: any,
        requestParams: BaseSearchParams
    ): any {
        if (backendResponse.code !== 1000) {
            throw new Error(backendResponse.message || '查詢失敗');
        }

        const data = backendResponse.data;
        const page = requestParams.page || 1;
        const pageSize = requestParams.pageSize || PAGINATION_DEFAULTS.PAGE_SIZE;

        return {
            dataList: data.dataList || [],
            totalRecords: data.totalRecords || 0,
            firstIndexInPage: PaginationUtil.calculateFirstIndex(page, pageSize),
            lastIndexInPage: Math.min(
                PaginationUtil.calculateLastIndex(page, pageSize),
                data.totalRecords || 0
            ),
            pageable: data.pageable ?? true,
            sortColumn: data.sortColumn,
            sortDirection: data.sortDirection,
            // 計算額外分頁資訊
            totalPages: PaginationUtil.calculateTotalPages(data.totalRecords || 0, pageSize),
            page: requestParams.pageIndex || 0,
            size: pageSize,
            hasNext: page < PaginationUtil.calculateTotalPages(data.totalRecords || 0, pageSize),
            hasPrevious: page > 1
        };
    }
}
