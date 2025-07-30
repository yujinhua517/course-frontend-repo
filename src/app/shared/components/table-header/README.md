# TableHeader Component

通用的表格標題組件，提供排序、全選等功能。

## 功能特性

- ✅ 可排序欄位支持
- ✅ 全選/取消全選功能
- ✅ 響應式設計
- ✅ 無障礙功能支持
- ✅ 自定義對齊方式
- ✅ 靈活的欄位配置

## 使用方式

### 基本用法

```typescript
import { TableHeaderComponent, TableHeaderConfig } from '@shared/components/table-header/table-header.component';

@Component({
  // ...
  imports: [TableHeaderComponent]
})
export class MyListComponent {
  readonly tableHeaderConfig = computed<TableHeaderConfig>(() => ({
    showSelectAll: true,
    isAllSelected: this.isAllSelected(),
    isPartiallySelected: this.isPartiallySelected(),
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
    columns: [
      {
        key: 'code',
        label: '代碼',
        sortable: true,
        width: '120px'
      },
      {
        key: 'name',
        label: '名稱',
        sortable: true
      },
      {
        key: 'status',
        label: '狀態',
        sortable: false,
        align: 'center'
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        align: 'center',
        width: '100px'
      }
    ]
  }));

  onTableSort(event: { column: string; direction: 'asc' | 'desc' }): void {
    // 處理排序邏輯
  }

  onTableSelectAll(checked: boolean): void {
    // 處理全選邏輯
  }
}
```

### 模板用法

```html
<table class="table table-hover">
  <app-table-header 
    [config]="tableHeaderConfig()"
    (sortChanged)="onTableSort($event)"
    (selectAllChanged)="onTableSelectAll($event)">
  </app-table-header>
  <tbody>
    <!-- 表格內容 -->
  </tbody>
</table>
```

## API 文檔

### TableHeaderConfig 介面

```typescript
interface TableHeaderConfig {
  columns: TableColumn[];           // 欄位配置
  showSelectAll?: boolean;          // 是否顯示全選
  sortBy?: string;                  // 當前排序欄位
  sortDirection?: 'asc' | 'desc';   // 排序方向
  isAllSelected?: boolean;          // 是否全選
  isPartiallySelected?: boolean;    // 是否部分選取
}
```

### TableColumn 介面

```typescript
interface TableColumn {
  key: string;                      // 欄位鍵值
  label: string;                    // 顯示標籤
  sortable?: boolean;               // 是否可排序
  width?: string;                   // 欄位寬度
  align?: 'left' | 'center' | 'right'; // 對齊方式
  cssClass?: string;                // 自定義 CSS 類別
}
```

### 事件

- `sortChanged`: 排序變更事件
  ```typescript
  { column: string; direction: 'asc' | 'desc' }
  ```

- `selectAllChanged`: 全選狀態變更事件
  ```typescript
  boolean
  ```

## 樣式自定義

組件已包含基本樣式，但可以透過以下方式自定義：

```scss
// 在您的組件樣式中
::ng-deep app-table-header {
  .sortable-header {
    // 自定義可排序標題樣式
  }
  
  .form-check-input {
    // 自定義複選框樣式
  }
}
```

## 無障礙功能

- 支援鍵盤導航
- 提供適當的 ARIA 標籤
- 排序狀態的語義化標記
- 螢幕閱讀器友好的標籤

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 重構說明

此組件是從 competency-list、department-list 和 employee-list 組件中提取出來的共用功能，旨在：

1. 減少重複代碼
2. 統一表格標題的行為和外觀
3. 提高維護性
4. 確保一致的用戶體驗
