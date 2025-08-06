import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    cssClass?: string;
}

export interface TableHeaderConfig {
    // columns: TableColumn[];
    // showSelectAll?: boolean;
    // sortBy?: string;
    // sortDirection?: 'asc' | 'desc';
    // isAllSelected?: boolean;
    // isPartiallySelected?: boolean;

    //新的
    showSelectColumn?: boolean; // 改為或新增這個屬性
    // 或者保留兩個都支持：
    // showSelectAll?: boolean; // 舊的屬性名
    // showSelectColumn?: boolean; // 新的屬性名
    isAllSelected?: boolean;
    isPartiallySelected?: boolean;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    columns: TableColumn[];
}

@Component({
    selector: 'app-table-header',
    templateUrl: './table-header.component.html',
    styleUrls: ['./table-header.component.scss'],
    imports: [CommonModule]
})
export class TableHeaderComponent {
    // Inputs
    config = input.required<TableHeaderConfig>();

    // Outputs
    sortChanged = output<{ column: string; direction: 'asc' | 'desc' | null }>();
    selectAllChanged = output<boolean>();

    /**
     * 處理排序點擊 - 支援三階段排序（升冪/降冪/無排序）
     */
    onSort(column: TableColumn): void {
        if (!column.sortable) return;

        console.log('表頭排序點擊:', column.key);
        const currentSort = this.config();
        let newDirection: 'asc' | 'desc' | null = 'asc';
        let newColumn = column.key;

        if (currentSort.sortColumn === column.key) {
            // 同一欄位：asc -> desc -> null（無排序）
            if (currentSort.sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (currentSort.sortDirection === 'desc') {
                newDirection = null; // 重設為無排序
                newColumn = ''; // 清空排序欄位
            } else {
                newDirection = 'asc';
            }
        }

        console.log('發送排序事件:', { column: newColumn, direction: newDirection });
        this.sortChanged.emit({
            column: newColumn,
            direction: newDirection
        });
    }

    /**
     * 處理全選/取消全選
     */
    onSelectAll(event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        this.selectAllChanged.emit(checkbox.checked);
    }

    /**
     * 獲取排序圖示 - 支援三階段顯示
     */
    getSortIcon(column: TableColumn): string {
        if (!column.sortable) return '';

        const config = this.config();
        if (config.sortColumn !== column.key) return 'bi-chevron-expand';

        if (config.sortDirection === 'asc') return 'bi-chevron-up';
        if (config.sortDirection === 'desc') return 'bi-chevron-down';
        return 'bi-chevron-expand'; // 無排序狀態
    }

    /**
     * 獲取欄位對齊樣式類別
     */
    getAlignClass(column: TableColumn): string {
        switch (column.align) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-end';
            default:
                return '';
        }
    }

    /**
     * 獲取欄位樣式
     */
    getColumnStyle(column: TableColumn): Record<string, string> {
        const style: Record<string, string> = {};
        if (column.width) {
            style['width'] = column.width;
        }
        return style;
    }
}
