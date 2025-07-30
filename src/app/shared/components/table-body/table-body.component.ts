import { Component, input, output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableBodyColumn {
    key: string;
    template?: TemplateRef<any>;
    cssClass?: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
}

export interface TableBodyConfig {
    data: any[];
    trackByFn?: (index: number, item: any) => any;
    rowCssClass?: (item: any) => string;
    showSelectColumn?: boolean;
    columns: TableBodyColumn[];
}

@Component({
    selector: 'app-table-body',
    templateUrl: './table-body.component.html',
    styleUrls: ['./table-body.component.scss'],
    imports: [CommonModule]
})
export class TableBodyComponent {
    // Inputs
    config = input.required<TableBodyConfig>();
    selectedItems = input<any[]>([]);

    // Outputs
    rowClicked = output<any>();
    itemSelected = output<{ item: any; selected: boolean }>();

    /**
     * 檢查項目是否被選中
     */
    isSelected(item: any): boolean {
        const selected = this.selectedItems();
        const trackByFn = this.config().trackByFn;

        if (trackByFn) {
            const itemKey = trackByFn(0, item);
            return selected.some((selectedItem, index) =>
                trackByFn(index, selectedItem) === itemKey
            );
        }

        return selected.includes(item);
    }

    /**
     * 處理項目選擇
     */
    onItemSelect(item: any, event: Event): void {
        const target = event.target as HTMLInputElement;
        this.itemSelected.emit({ item, selected: target.checked });
    }

    /**
     * 處理行點擊
     */
    onRowClick(item: any): void {
        this.rowClicked.emit(item);
    }

    /**
     * 獲取對齊樣式
     */
    getAlignClass(column: TableBodyColumn): string {
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
    getColumnStyle(column: TableBodyColumn): Record<string, string> {
        const style: Record<string, string> = {};
        if (column.width) {
            style['width'] = column.width;
        }
        return style;
    }

    /**
     * 獲取行的 CSS 類別
     */
    getRowClass(item: any): string {
        const baseClass = this.isSelected(item) ? 'table-active' : '';
        const customClass = this.config().rowCssClass?.(item) || '';
        return [baseClass, customClass].filter(Boolean).join(' ');
    }

    /**
     * 獲取追蹤函式
     */
    getTrackByFn() {
        return this.config().trackByFn || ((index: number, item: any) => item);
    }
}
