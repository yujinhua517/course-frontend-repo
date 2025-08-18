# 職務角色管理系統

## 概述
職務角色管理系統提供完整的 CRUD 功能，用於管理組織內的職務角色資料。系統採用 Angular 19+ Standalone 架構，使用 Bootstrap 5 進行 UI 設計，並支援響應式布局。系統已升級使用統一的分頁架構和現代化的狀態管理。

## 功能特色
- ✅ 完整的 CRUD 操作（新增、編輯、刪除、檢視）
- ✅ 統一分頁架構（firstIndexInPage/lastIndexInPage）
- ✅ 高效搜尋、排序、篩選功能
- ✅ 狀態篩選與即時切換
- ✅ 響應式設計，支援手機與桌面裝置
- ✅ Mock 資料服務，可輕鬆切換至真實 API
- ✅ 完整的表單驗證與錯誤處理
- ✅ 無障礙設計（WCAG 2.1 AA）
- ✅ Bootstrap Icons 圖示系統
- ✅ 權限控制與安全機制

## 資料結構

### JobRole 模型
```typescript
interface JobRole {
  jobRoleId?: number;        // 職務角色 ID（主鍵）
  jobRoleCode: string;       // 職務代碼
  jobRoleName: string;       // 職務名稱
  description?: string;      // 職務描述（可選）
  isActive: boolean;         // 啟用狀態（true=啟用, false=停用）
  createTime?: string;       // 建立時間（ISO 格式）
  createUser?: string;       // 建立者
  updateTime?: string;       // 更新時間（ISO 格式）
  updateUser?: string;       // 更新者
}
```

### 查詢參數
```typescript
interface JobRoleSearchParams extends BaseSearchParams {
  // 統一分頁參數（由 BaseSearchParams 提供）
  firstIndexInPage?: number;    // 該頁第一筆的 index (由1開始)
  lastIndexInPage?: number;     // 該頁最後一筆的 index (由1開始)
  sortColumn?: string;          // 排序欄位名
  sortDirection?: 'asc' | 'desc';
  keyword?: string;             // 關鍵字搜尋
  isActive?: boolean;           // 狀態篩選
  
  // 職務角色特有的搜尋欄位
  jobRoleId?: number;
  jobRoleCode?: string;
  jobRoleName?: string;
  description?: string;
}
```

## 檔案結構
```
job-role-management/
├── components/
│   ├── job-role-form/             # 新增/編輯表單組件
│   │   ├── job-role-form.component.html
│   │   ├── job-role-form.component.scss
│   │   └── job-role-form.component.ts
│   └── job-role-view/             # 檢視詳細資訊組件
│       ├── job-role-view.component.html
│       ├── job-role-view.component.scss
│       └── job-role-view.component.ts
├── pages/
│   └── job-role-list/             # 列表頁面組件
│       ├── job-role-list.component.html
│       ├── job-role-list.component.scss
│       └── job-role-list.component.ts
├── models/
│   └── job-role.model.ts          # 資料模型定義
├── services/
│   └── job-role.service.ts        # 資料服務（繼承 BaseQueryService）
├── store/
│   └── job-role.store.ts          # 狀態管理（使用 Angular Signals）
├── pipes/
│   └── job-role-status.pipe.ts    # 狀態顯示管道
├── job-role-management.routes.ts  # 路由設定
└── README.md                      # 說明文件
```

## 架構設計

### 分層架構
```
UI 層 (Components) → Store 層 (狀態管理) → Service 層 (BaseQueryService) → API 層
```

### 分頁架構
系統使用統一的分頁架構：
- **前端 UI**：使用 page/pageSize 概念（用戶友好）
- **Store 層**：維護前端分頁狀態，負責轉換
- **Service/API 層**：使用 firstIndexInPage/lastIndexInPage（精確分頁）

### 資料轉換流程
```
用戶操作 → Store (page/pageSize) → PaginationUtil.toBackendPagination() → Service (firstIndexInPage/lastIndexInPage) → 後端 API
```

## 組件說明

### 1. JobRoleListComponent
主要的列表頁面組件，採用現代化設計：
- **搜尋與篩選**：智能關鍵字搜尋，支援職務代碼、名稱、描述
- **資料表格**：響應式表格，支援排序和選擇
- **分頁控制**：統一分頁組件，支援頁數切換和每頁筆數調整
- **批量操作**：支援批量刪除和狀態切換
- **權限控制**：基於用戶權限的功能顯示/隱藏
- **狀態管理**：使用 Angular Signals 進行響應式狀態管理

### 2. JobRoleFormComponent
模態表單組件，提供完整的表單功能：
- **雙模式支援**：新增模式 / 編輯模式
- **響應式表單**：使用 Angular Reactive Forms
- **即時驗證**：表單欄位即時驗證和錯誤顯示
- **無障礙設計**：完整的 a11y 支援
- **錯誤處理**：統一的錯誤處理和用戶提示

### 3. JobRoleViewComponent
詳細資訊檢視組件：
- **資訊展示**：格式化顯示職務角色完整資訊
- **系統資訊**：顯示建立/更新時間和操作者
- **響應式布局**：適應不同螢幕尺寸

## 服務層

### JobRoleService (繼承 BaseQueryService)
提供完整的 API 操作，繼承統一的查詢服務：

#### 統一查詢方法
- `getPagedData(params)` - 統一分頁查詢方法（繼承自 BaseQueryService）

#### 專有方法
- `getJobRoleById(id)` - 根據 ID 查詢單一職務角色
- `getJobRoleByCode(code)` - 根據代碼查詢單一職務角色
- `createJobRole(dto)` - 新增職務角色
- `updateJobRole(id, dto)` - 更新職務角色
- `deleteJobRole(id)` - 刪除職務角色
- `bulkDeleteJobRoles(ids)` - 批量刪除
- `toggleActiveStatus(id)` - 切換啟用狀態

#### 查詢特性
- **智能搜尋**：自動識別關鍵字類型（ID、代碼、名稱）
- **欄位映射**：自動轉換前端 camelCase 到後端 snake_case
- **Mock 資料**：完整的 Mock 資料支援，便於開發測試

### Mock 資料切換
在 `JobRoleService` 中設定 `useMockData` 旗標：
```typescript
protected override readonly useMockData = false; // true=使用 Mock 資料, false=使用真實 API
```

## 狀態管理

### JobRoleStore
使用 Angular 19 Signals 進行現代化狀態管理：

#### 狀態結構
```typescript
interface JobRoleState {
  jobRoles: JobRole[];           // 職務角色列表
  loading: boolean;              // 載入狀態
  error: string | null;          // 錯誤訊息
  total: number;                 // 總筆數
  currentPage: number;           // 當前頁數
  pageSize: number;              // 每頁筆數
  searchParams: JobRoleSearchParams; // 搜尋參數
  sortColumn: string;            // 排序欄位
  sortDirection: 'asc' | 'desc'; // 排序方向
}
```

#### 計算屬性（Computed Signals）
- `totalPages` - 總頁數
- `hasNextPage` - 是否有下一頁
- `hasPreviousPage` - 是否有上一頁

#### 主要方法
- `loadJobRoles(params?)` - 載入職務角色列表（支援分頁轉換）
- `searchJobRoles(keyword)` - 關鍵字搜尋
- `filterByStatus(isActive)` - 狀態篩選
- `goToPage(page)` - 分頁導航
- `setPageSize(pageSize)` - 設定每頁筆數
- `sortJobRoles(column, direction)` - 排序

#### 分頁轉換
Store 內部使用 `PaginationUtil.toBackendPagination()` 將前端的 page/pageSize 轉換為後端的 firstIndexInPage/lastIndexInPage。

## 路由設定
```typescript
export const JOB_ROLE_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/job-role-list/job-role-list.component')
            .then(m => m.JobRoleListComponent)
    }
];
```

## 權限控制
系統支援基於動作的權限控制：
- `job-role:create` - 新增權限
- `job-role:read` - 讀取權限
- `job-role:update` - 更新權限
- `job-role:delete` - 刪除權限

權限檢查在組件中通過 `UserStore` 進行：
```typescript
// 在組件中檢查權限
readonly permissions = computed(() => {
    const user = this.userStore.user();
    return {
        create: user?.hasPermission('job-role:create') ?? false,
        update: user?.hasPermission('job-role:update') ?? false,
        delete: user?.hasPermission('job-role:delete') ?? false
    };
});
```

## 使用方式

### 1. 在主路由中註冊
```typescript
// app.routes.ts
{
  path: 'job-roles',
  loadChildren: () => import('./features/job-role-management/job-role-management.routes')
    .then(m => m.JOB_ROLE_MANAGEMENT_ROUTES)
}
```

### 2. 導航到頁面
```html
<a routerLink="/job-roles" class="nav-link">職務角色管理</a>
```

### 3. 在其他組件中使用 JobRoleStore
```typescript
export class MyComponent {
  private jobRoleStore = inject(JobRoleStore);
  
  ngOnInit() {
    // 載入職務角色資料
    this.jobRoleStore.loadJobRoles();
    
    // 訂閱狀態變化
    effect(() => {
      const jobRoles = this.jobRoleStore.jobRoles();
      console.log('職務角色資料更新:', jobRoles);
    });
  }
}
```

## 開發指南

### 新增功能
1. **在 Service 中新增 API 方法**
   ```typescript
   // job-role.service.ts
   newMethod(): Observable<any> {
     return this.http.post<ApiResponse<any>>(`${this.apiUrl}/new-endpoint`, {});
   }
   ```

2. **在 Store 中新增狀態管理邏輯**
   ```typescript
   // job-role.store.ts
   newAction(): void {
     this.jobRoleService.newMethod().subscribe({
       next: (response) => { /* 處理回應 */ },
       error: (error) => { /* 處理錯誤 */ }
     });
   }
   ```

3. **在組件中呼叫 Store 方法**
   ```typescript
   // component.ts
   onNewAction(): void {
     this.jobRoleStore.newAction();
   }
   ```

### Mock 資料管理
在 `JobRoleService` 的 `mockData` 陣列中管理測試資料：
```typescript
protected override readonly mockData: JobRole[] = [
  {
    jobRoleId: 1,
    jobRoleCode: 'DEV001',
    jobRoleName: '前端開發工程師',
    // ... 其他欄位
  }
];
```

### 自定義搜尋邏輯
覆寫 `buildCustomApiParams` 方法來自定義 API 參數：
```typescript
protected override buildCustomApiParams(params?: JobRoleSearchParams): Record<string, any> {
  const customParams: Record<string, any> = {};
  
  // 自定義搜尋邏輯
  if (params?.keyword) {
    // 根據關鍵字類型決定搜尋策略
    if (/^[A-Z]{2,}\d+$/i.test(params.keyword)) {
      customParams['jobRoleCode'] = params.keyword;
    } else {
      customParams['jobRoleName'] = params.keyword;
    }
  }
  
  return customParams;
}
```

### 測試
執行測試指令：
```bash
# 單元測試
ng test

# E2E 測試
ng e2e

# 測試覆蓋率
ng test --code-coverage
```

## 技術規格

### 核心技術
- **Angular 19+** - 最新版本 Angular 框架
- **Standalone Components** - 模組化組件架構
- **Angular Signals** - 響應式狀態管理
- **TypeScript 5.0+** - 強型別語言支援
- **RxJS** - 響應式程式設計
- **Bootstrap 5** - UI 框架和響應式設計

### 架構模式
- **Layered Architecture** - 分層架構設計
- **Service-Store Pattern** - 服務和狀態分離
- **Inheritance Pattern** - BaseQueryService 繼承模式
- **Signal-based State Management** - 基於 Signal 的狀態管理
- **Unified Pagination** - 統一分頁架構

### 設計原則
- **DRY (Don't Repeat Yourself)** - 程式碼重用
- **SOLID Principles** - 物件導向設計原則
- **Separation of Concerns** - 關注點分離
- **Responsive Design** - 響應式設計
- **Accessibility First** - 無障礙優先

## API 整合

### HTTP 攔截器
系統使用統一的 HTTP 攔截器處理：
- **案例轉換**：自動處理 camelCase ↔ snake_case 轉換
- **錯誤處理**：統一的錯誤處理和用戶提示
- **請求/回應記錄**：開發環境的請求記錄

### API 回應格式
```typescript
interface ApiResponse<T> {
  code: number;     // 1000 = success
  message: string;  // 回應訊息
  data?: T;        // 資料內容
}

interface PagerDto<T> {
  dataList: T[];              // 資料列表
  totalRecords: number;       // 總筆數
  firstIndexInPage?: number;  // 該頁第一筆 index
  lastIndexInPage?: number;   // 該頁最後一筆 index
  pageable?: boolean;         // 是否分頁
  sortColumn?: string;        // 排序欄位
  sortDirection?: string;     // 排序方向
}
```

## 效能優化

### 變更檢測策略
- 使用 `ChangeDetectionStrategy.OnPush` 優化效能
- 所有組件都使用 Signal-based 響應式更新

### 延遲載入
- 路由層級的延遲載入
- 組件層級的懶載入

### 快取策略
- HTTP 快取標頭支援
- 前端狀態快取

## 注意事項

### 開發注意事項
1. **所有 API 呼叫都有統一錯誤處理**
2. **表單有完整的驗證機制和無障礙支援**
3. **支援響應式設計，需測試各種螢幕尺寸**
4. **符合 WCAG 2.1 AA 無障礙設計原則**
5. **使用 Angular 19 的新功能（Signals, Standalone Components）**
6. **遵循統一的程式碼風格和命名規範**

### 部署注意事項
1. **確保環境變數正確設定**
2. **API 端點配置檢查**
3. **權限設定驗證**
4. **瀏覽器相容性測試**

### 維護指南
1. **定期更新依賴套件**
2. **監控效能指標**
3. **檢查安全漏洞**
4. **維護測試覆蓋率**

## 相關文件
- [Angular 19 官方文件](https://angular.io/docs)
- [Bootstrap 5 文件](https://getbootstrap.com/docs/5.3/)
- [WCAG 2.1 無障礙指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [專案架構指南](../../../docs/architecture.md)
- [API 標準化指南](../../../API_UNIFICATION_GUIDE.md)
