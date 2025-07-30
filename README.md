# CourseAngularFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## 🎯 專案重構更新 (2025-07-22)

本專案已完成大規模重構，實作了共用UI組件並統一程式碼結構。詳細重構報告請參閱 [SHARED_COMPONENTS_REFACTORING.md](./docs/SHARED_COMPONENTS_REFACTORING.md)。

### 🆕 新增共用 UI 組件
- **SearchFilterComponent**: 統一的搜尋篩選器，支援關鍵字搜尋、多重篩選器、每頁筆數選擇
- **PaginationComponent**: 智慧分頁組件，支援橢圓分頁、鍵盤導航、響應式設計
- **StatusBadgeComponent**: 統一狀態徽章，支援可點擊切換狀態
- **ActionButtonGroupComponent**: 操作按鈕群組，支援檢視、編輯、刪除等動作
- **🆕 DataTableComponent**: 通用資料表格組件，支援排序、選擇、狀態切換、自訂格式化
- **EntityStatusPipe**: 通用狀態格式化管道
- **BaseFormComponent**: 共用表單基礎邏輯
- **FileUploadService**: 統一檔案上傳處理

### 📊 重構成果
- **程式碼減少**: 移除重複的搜尋和分頁 HTML/SCSS 代碼 ~500 行
- **一致性提升**: 三個主要模組 (Department, Employee, Competency) 使用相同的 UI 組件
- **維護性改善**: 統一組件邏輯，降低維護成本
- **類型安全**: 完整的 TypeScript 介面定義和類型檢查

### 📁 共用資源位置
```
src/app/shared/components/
├── search-filter/          # 搜尋篩選組件
├── pagination/             # 分頁組件  
├── status-badge/           # 狀態徽章組件
├── action-buttons/         # 操作按鈕群組
├── data-table/             # 🆕 通用資料表格組件
└── unauthorized/           # 未授權頁面
```

### 🔄 使用方式
```typescript
// 搜尋篩選組件
<app-search-filter 
    [config]="searchFilterConfig()"
    [searchKeyword]="searchKeyword()"
    [pageSize]="pageSize()"
    [totalCount]="total()"
    (searchChanged)="onSearchChange($event)"
    (filterChanged)="onFilterChange($event)"
    (pageSizeChanged)="onPageSizeChange($event)">
</app-search-filter>

// 分頁組件
<app-pagination 
    [config]="paginationConfig()"
    (pageChanged)="onPageChange($event)">
</app-pagination>

// 狀態徽章
<app-status-badge 
    [config]="getStatusConfig(item)"
    (statusChange)="onStatusChange(item, $event)">
</app-status-badge>

// 🆕 通用資料表格組件
<app-data-table 
    [config]="tableConfig()"
    [data]="items()"
    [selectedItems]="selectedItems()"
    [sortConfig]="sortConfig()"
    [loading]="loading()"
    (sorted)="onSort($event)"
    (selectionChanged)="onSelectionChange($event)"
    (itemViewed)="onView($event)"
    (itemEdited)="onEdit($event)"
    (itemDeleted)="onDelete($event)"
    (statusToggled)="onToggleStatus($event)">
</app-data-table>
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 🧪 測試

新增的共用組件包含單元測試：
```bash
# 執行所有測試
ng test

# 執行特定測試
ng test --include="**/shared/**/*.spec.ts"
```

## 🏗️ 專案結構

專案遵循 Angular 19+ 最佳實踐，採用：
- Feature-first 組織架構
- Standalone Components
- Signals 狀態管理
- 三檔案分離原則 (TS/HTML/SCSS)

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
