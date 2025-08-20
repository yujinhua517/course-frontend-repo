/**
 * 統一的基礎 Service 抽象類別
 * 
 * 提供功能模組共用的查詢、分頁、排序邏輯
 * 依賴攔截器進行前後端格式轉換
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, delay, catchError } from 'rxjs';
import {
    BaseSearchParams,
    BaseQueryDto,
    PagerDto,
    ApiResponse,
    ServiceListResponse,
    PAGINATION_DEFAULTS
} from '../../models/common.model';
import { PaginationUtil, QueryParamsBuilder, QueryTransformer } from '../utils/query.util';
import { HttpErrorHandlerService } from '../services/http-error-handler.service';
/**
 * 排序欄位映射函數類型
 */
export type ColumnMappingFn = (frontendColumn?: string) => string;

/**
 * 基礎查詢 Service 抽象類別
 */
@Injectable()
export abstract class BaseQueryService<T, TSearchParams extends BaseSearchParams> {
    protected readonly http = inject(HttpClient);
    protected readonly httpErrorHandler = inject(HttpErrorHandlerService);

    // 子類需要實作的屬性
    protected abstract readonly apiUrl: string;
    protected abstract readonly useMockData: boolean;
    protected abstract readonly defaultSortColumn: string;
    protected abstract readonly mockData: T[];

    /**
     * 映射排序欄位（子類可覆寫）
     */
    protected mapSortColumn(frontendColumn?: string): string {
        return frontendColumn || this.defaultSortColumn;
    }

    /**
     * 統一的分頁查詢方法
     */
    getPagedData(params?: TSearchParams): Observable<ServiceListResponse<T>> {
        if (this.useMockData) {
            return this.getMockPagedData(params);
        }
        return this.getRealPagedData(params);
    }

    /**
     * Mock 資料查詢實作
     */
    protected getMockPagedData(params?: TSearchParams): Observable<ServiceListResponse<T>> {
        let filteredData = [...this.mockData];

        // 應用篩選
        filteredData = this.applyMockFilters(filteredData, params);

        // 應用排序
        filteredData = this.applyMockSorting(filteredData, params);

        // 應用分頁
        const firstIndex = params?.firstIndexInPage || 1;
        const lastIndex = params?.lastIndexInPage || PAGINATION_DEFAULTS.PAGE_SIZE;
        const pageSize = lastIndex - firstIndex + 1;
        const page = PaginationUtil.calculatePage(firstIndex, pageSize);
        const startIndex = firstIndex - 1; // 轉為 0-based
        const endIndex = lastIndex;
        const pagedData = filteredData.slice(startIndex, endIndex);

        const result: PagerDto<T> = {
            dataList: pagedData,
            totalRecords: filteredData.length,
            firstIndexInPage: firstIndex,
            lastIndexInPage: Math.min(lastIndex, filteredData.length),
            page,
            pageSize,
            totalPages: PaginationUtil.calculateTotalPages(filteredData.length, pageSize),
            hasNext: page < PaginationUtil.calculateTotalPages(filteredData.length, pageSize),
            hasPrevious: page > 1
        };

        return of({
            code: 200,
            message: '查詢成功',
            data: result
        }).pipe(delay(300));
    }

    /**
     * 真實 API 查詢實作
     */
    protected getRealPagedData(params?: TSearchParams): Observable<ServiceListResponse<T>> {
        const apiParams = this.buildApiParams(params);

        return this.http.post<ApiResponse<PagerDto<T>>>(`${this.apiUrl}/query`, apiParams)
            .pipe(
                map(response => this.adaptApiResponse(response, params)),
                catchError(this.httpErrorHandler.handleError('分頁資料查詢', this.getEmptyResponse()))
            );
    }

    /**
     * 建構 API 請求參數 - 使用 QueryParamsBuilder 簡化
     */
    protected buildApiParams(params?: TSearchParams): BaseQueryDto & Record<string, any> {
        // 處理排序欄位映射
        const processedParams = {
            ...params,
            sortColumn: this.mapSortColumn(params?.sortColumn) || this.defaultSortColumn,
            sortDirection: params?.sortDirection || 'asc'
        };

        // 使用 QueryParamsBuilder 建構基礎參數
        const baseQuery = QueryParamsBuilder.buildBaseQuery(processedParams);
        
        // 合併自訂參數
        return {
            ...baseQuery,
            ...(params?.isActive !== undefined && { isActive: params.isActive }),
            ...this.buildCustomApiParams(params)
        };
    }

    /**
     * 適配 API 回應 - 使用 QueryTransformer 簡化
     */
    protected adaptApiResponse(
        response: ApiResponse<PagerDto<T>>,
        requestParams?: TSearchParams
    ): ServiceListResponse<T> {
        // 使用 QueryTransformer 處理回應適配
        const adaptedData = QueryTransformer.adaptResponse(response, requestParams || {});

        return {
            code: 200,
            message: '查詢成功',
            data: adaptedData
        };
    }

    /**
     * 建構自訂 API 參數（子類可覆寫）
     */
    protected buildCustomApiParams(params?: TSearchParams): Record<string, any> {
        return {};
    }

    /**
     * 應用 Mock 篩選（子類需實作）
     */
    protected abstract applyMockFilters(data: T[], params?: TSearchParams): T[];

    /**
     * 應用 Mock 排序（子類可覆寫）
     */
    protected applyMockSorting(data: T[], params?: TSearchParams): T[] {
        if (!params?.sortColumn || !params?.sortDirection) {
            return data;
        }

        return [...data].sort((a, b) => {
            const aValue = (a as any)[params.sortColumn!];
            const bValue = (b as any)[params.sortColumn!];

            if (aValue === undefined || bValue === undefined) return 0;

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;

            return params.sortDirection === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * 取得空回應（錯誤處理用）
     */
    protected getEmptyResponse(): ServiceListResponse<T> {
        return {
            code: -1,
            message: '查詢失敗',
            data: {
                dataList: [],
                totalRecords: 0,
                page: PAGINATION_DEFAULTS.PAGE,
                pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false
            }
        };
    }

    /**
     * 建構查詢參數的輔助方法 - 直接使用 QueryParamsBuilder
     */
    protected buildSearchParams(
        baseParams: TSearchParams,
        updates: Partial<TSearchParams>
    ): TSearchParams {
        return QueryParamsBuilder.mergeSearchParams(baseParams, updates);
    }

    /**
     * 重設到第一頁的輔助方法 - 直接使用 QueryParamsBuilder
     */
    protected resetToFirstPage(params: TSearchParams): TSearchParams {
        return QueryParamsBuilder.resetToFirstPage(params);
    }
}
