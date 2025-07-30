import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 分頁配置介面
 */
export interface PaginationConfig {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    pageSizeOptions?: number[];
    showPageSize?: boolean;
    showTotalCount?: boolean;
    showFirstLast?: boolean;
    showPrevNext?: boolean;
    maxVisiblePages?: number;
    ariaLabel?: string;
    disabled?: boolean;
}

/**
 * 分頁事件介面
 */
export interface PaginationEvent {
    page: number;
    pageSize: number;
}

/**
 * 通用分頁控制元件
 * 
 * 提供完整的分頁功能，包括：
 * - 智慧型頁碼顯示（含省略號）
 * - 每頁筆數選擇器
 * - 資料統計顯示
 * - 完整的鍵盤導航支援
 * - 響應式佈局
 */
@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
    // 輸入屬性
    readonly config = input.required<PaginationConfig>();

    // 輸出事件
    readonly pageChanged = output<number>();
    readonly pageSizeChanged = output<number>();

    // 計算屬性
    protected readonly hasPreviousPage = computed(() =>
        this.config().currentPage > 1
    );

    protected readonly hasNextPage = computed(() =>
        this.config().currentPage < this.config().totalPages
    );

    protected readonly showPagination = computed(() =>
        this.config().totalPages > 1
    );

    protected readonly pageNumbers = computed(() => {
        const config = this.config();
        const { currentPage, totalPages } = config;
        const maxVisible = config.maxVisiblePages || 7;

        if (totalPages <= maxVisible) {
            // 如果總頁數小於等於最大顯示數，顯示所有頁碼
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];
        const halfVisible = Math.floor(maxVisible / 2);

        // 計算顯示範圍
        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, currentPage + halfVisible);

        // 調整範圍以確保顯示足夠的頁碼
        if (endPage - startPage < maxVisible - 1) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxVisible - 1);
            } else {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
        }

        // 添加第一頁和省略號
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push('...');
            }
        }

        // 添加中間頁碼
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // 添加省略號和最後一頁
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    });

    protected readonly startIndex = computed(() => {
        const config = this.config();
        return (config.currentPage - 1) * config.pageSize + 1;
    });

    protected readonly endIndex = computed(() => {
        const config = this.config();
        const end = config.currentPage * config.pageSize;
        return Math.min(end, config.totalCount);
    });

    protected readonly totalCountText = computed(() => {
        const config = this.config();
        const start = this.startIndex();
        const end = this.endIndex();
        const total = config.totalCount;

        if (total === 0) {
            return '無資料';
        }

        return `顯示 ${start}-${end} 筆，共 ${total} 筆資料`;
    });

    protected readonly ariaLabel = computed(() =>
        this.config().ariaLabel || '分頁導航'
    );

    /**
     * 跳轉到指定頁面
     */
    protected onPageChange(page: number): void {
        const config = this.config();

        if (page < 1 || page > config.totalPages || page === config.currentPage || config.disabled) {
            return;
        }

        this.pageChanged.emit(page);
    }

    /**
     * 跳轉到上一頁
     */
    protected onPreviousPage(): void {
        if (this.hasPreviousPage() && !this.config().disabled) {
            this.onPageChange(this.config().currentPage - 1);
        }
    }

    /**
     * 跳轉到下一頁
     */
    protected onNextPage(): void {
        if (this.hasNextPage() && !this.config().disabled) {
            this.onPageChange(this.config().currentPage + 1);
        }
    }

    /**
     * 跳轉到第一頁
     */
    protected onFirstPage(): void {
        if (this.config().currentPage !== 1 && !this.config().disabled) {
            this.onPageChange(1);
        }
    }

    /**
     * 跳轉到最後一頁
     */
    protected onLastPage(): void {
        const lastPage = this.config().totalPages;
        if (this.config().currentPage !== lastPage && !this.config().disabled) {
            this.onPageChange(lastPage);
        }
    }

    /**
     * 處理每頁筆數變更
     */
    protected onPageSizeChange(event: Event): void {
        if (this.config().disabled) {
            return;
        }

        const target = event.target as HTMLSelectElement;
        const pageSize = parseInt(target.value, 10);
        this.pageSizeChanged.emit(pageSize);
    }

    /**
     * 檢查是否為當前頁面
     */
    protected isCurrentPage(page: number | string): boolean {
        return typeof page === 'number' && page === this.config().currentPage;
    }

    /**
     * 檢查是否為省略號
     */
    protected isEllipsis(page: number | string): boolean {
        return page === '...';
    }

    /**
     * 獲取頁碼按鈕的 aria-label
     */
    protected getPageAriaLabel(page: number | string): string {
        if (this.isEllipsis(page)) {
            return '更多頁面';
        }

        const pageNum = page as number;
        const isCurrent = this.isCurrentPage(pageNum);
        return isCurrent ? `第 ${pageNum} 頁，目前頁面` : `第 ${pageNum} 頁`;
    }

    /**
     * 獲取 aria-current 屬性值
     */
    protected getAriaCurrent(page: number | string): string | null {
        return this.isCurrentPage(page as number) ? 'page' : null;
    }
}
