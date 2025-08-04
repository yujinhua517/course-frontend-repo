import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * 篩選選項配置
 */
export interface FilterOption {
    key: string;
    label: string;
    options: { value: any; text: string }[];
    value?: any;
}

/**
 * 搜尋篩選元件配置
 */
export interface SearchFilterConfig {
    searchPlaceholder?: string;
    searchLabel?: string;
    filters?: FilterOption[];
    showPageSize?: boolean;
    pageSizeOptions?: number[];
    showTotalCount?: boolean;
    totalCountLabel?: string;
    showClearButton?: boolean;
}

/**
 * 搜尋篩選事件
 */
export interface SearchFilterEvent {
    searchKeyword: string;
    filters: Record<string, any>;
    pageSize?: number;
}

/**
 * 通用搜尋篩選元件
 * 
 * 提供統一的搜尋輸入框、篩選下拉選單、每頁筆數選擇器等功能
 * 支援自定義篩選選項和配置
 */
@Component({
    selector: 'app-search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.scss'],
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilterComponent {
    // 輸入屬性
    readonly config = input.required<SearchFilterConfig>();
    readonly searchKeyword = input<string>('');
    readonly pageSize = input<number>(10);
    readonly totalCount = input<number>(0);
    readonly loading = input<boolean>(false);
    readonly filterValues = input<Record<string, any>>({});

    // 輸出事件
    readonly searchChanged = output<string>();
    readonly filterChanged = output<{ key: string; value: any }>();
    readonly pageSizeChanged = output<number>();
    readonly searchCleared = output<void>();

    // 內部狀態
    protected readonly currentSearchKeyword = signal('');

    // 計算屬性
    protected readonly hasSearchKeyword = computed(() =>
        this.currentSearchKeyword().trim().length > 0
    );

    protected readonly shouldShowClearButton = computed(() =>
        this.config().showClearButton !== false && this.hasSearchKeyword()
    );

    protected readonly totalCountText = computed(() => {
        const config = this.config();
        const count = this.totalCount();
        const label = config.totalCountLabel || '筆資料';
        return `總共 "${count}" ${label}`;
    });

    constructor() {
        // 同步搜尋關鍵字
        this.currentSearchKeyword.set(this.searchKeyword());
    }

    /**
     * 執行搜尋
     */
    protected onSearch(): void {
        const keyword = this.currentSearchKeyword().trim();
        this.searchChanged.emit(keyword);
    }

    /**
     * 處理 Enter 鍵搜尋
     */
    protected onSearchEnter(): void {
        this.onSearch();
    }

    /**
     * 清除搜尋
     */
    protected onClearSearch(): void {
        this.currentSearchKeyword.set('');
        this.searchChanged.emit('');
        this.searchCleared.emit();
    }

    /**
     * 處理篩選變更
     */
    protected onFilterChange(filterKey: string, event: Event): void {
        const target = event.target as HTMLSelectElement;
        let value: any = target.value === '' ? undefined : target.value;

        // 特殊處理 boolean 類型的值
        if (value === 'true') {
            value = true;
        } else if (value === 'false') {
            value = false;
        }

        //console.log(`Filter change - Key: ${filterKey}, Value: ${value}, Type: ${typeof value}`);

        this.filterChanged.emit({ key: filterKey, value });
    }

    /**
     * 處理每頁筆數變更
     */
    protected onPageSizeChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const pageSize = parseInt(target.value, 10);
        this.pageSizeChanged.emit(pageSize);
    }

    /**
     * 獲取篩選器的當前值
     */
    protected getFilterValue(filterKey: string): any {
        return this.filterValues()[filterKey] ?? '';
    }

    /**
     * 生成篩選器的唯一 ID
     */
    protected getFilterId(filterKey: string): string {
        return `filter-${filterKey}`;
    }

    /**
     * 生成篩選器的 aria-label
     */
    protected getFilterAriaLabel(filter: FilterOption): string {
        return `${filter.label}篩選`;
    }
}
