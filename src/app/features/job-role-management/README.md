# 職務主檔管理系統

## 概述
職務主檔管理系統提供完整的 CRUD 功能，用於管理組織內的職務資料。系統採用 Angular 19+ Standalone 架構，使用 Bootstrap 5 進行 UI 設計，並支援響應式布局。

## 功能特色
- ✅ 完整的 CRUD 操作（新增、編輯、刪除、檢視）
- ✅ 分頁、排序、搜尋功能
- ✅ 狀態篩選與即時切換
- ✅ 響應式設計，支援手機與桌面裝置
- ✅ Mock 資料服務，可輕鬆切換至真實 API
- ✅ 完整的表單驗證
- ✅ 無障礙設計（a11y）
- ✅ Bootstrap Icons 圖示系統

## 資料結構

### JobRole 模型
```typescript
interface JobRole {
  job_role_code: string;     // 職務代碼（主鍵）
  job_role_name: string;     // 職務名稱
  description?: string;      // 職務描述（可選）
  is_active: boolean;        // 啟用狀態（true=啟用, false=停用）
  create_time: string;       // 建立時間
  create_user: string;       // 建立者
  update_time: string;       // 更新時間
  update_user: string;       // 更新者
}
```

## 檔案結構
```
job-role-management/
├── components/
│   ├── job-role-form/             # 新增/編輯表單組件
│   └── job-role-view/             # 檢視詳細資訊組件
├── pages/
│   └── job-role-list/             # 列表頁面組件
├── models/
│   └── job-role.model.ts          # 資料模型定義
├── services/
│   ├── job-role.service.ts        # 資料服務
│   └── job-role.service.spec.ts   # 服務測試
├── store/
│   └── job-role.store.ts          # 狀態管理
├── pipes/
│   └── job-role-status.pipe.ts    # 狀態顯示管道
├── job-role-management.routes.ts  # 路由設定
└── README.md                      # 說明文件
```

## 組件說明

### 1. JobRoleListComponent
主要的列表頁面組件，包含：
- 搜尋與篩選功能
- 資料表格顯示
- 分頁控制
- 批量操作（刪除）
- 權限控制

### 2. JobRoleFormComponent
表單組件，支援：
- 新增模式
- 編輯模式
- 表單驗證
- 錯誤處理

### 3. JobRoleViewComponent
檢視組件，用於：
- 顯示職務詳細資訊
- 系統資訊顯示

## 服務層

### JobRoleService
提供完整的 API 操作：
- `getJobRoles(params)` - 分頁查詢職務列表
- `getJobRoleByCode(code)` - 查詢單一職務
- `createJobRole(dto)` - 新增職務
- `updateJobRole(code, dto)` - 更新職務
- `deleteJobRole(code)` - 刪除職務
- `bulkDeleteJobRoles(codes)` - 批量刪除
- `batchUpdateJobRoleStatus(codes, status)` - 批量更新狀態

### Mock 資料切換
在 `JobRoleService` 中設定 `useMockData` 旗標：
```typescript
private useMockData = true; // true=使用 Mock 資料, false=使用真實 API
```

## 狀態管理

### JobRoleStore
使用 Angular Signals 進行狀態管理：
- 職務資料列表
- 載入狀態
- 錯誤訊息
- 分頁資訊
- 搜尋參數

## 路由設定
```typescript
export const JOB_ROLE_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/job-role-list/job-role-list.component').then(m => m.JobRoleListComponent)
    }
];
```

## 權限控制
系統支援基於動作的權限控制：
- `job-role:create` - 新增權限
- `job-role:read` - 讀取權限
- `job-role:update` - 更新權限
- `job-role:delete` - 刪除權限

## 使用方式

### 1. 在主路由中註冊
```typescript
// app.routes.ts
{
  path: 'job-roles',
  loadChildren: () => import('./features/job-role-management/job-role-management.routes').then(m => m.JOB_ROLE_MANAGEMENT_ROUTES)
}
```

### 2. 導航到頁面
```html
<a routerLink="/job-roles">職務管理</a>
```

## 開發指南

### 新增功能
1. 在對應的服務中新增 API 方法
2. 在 Store 中新增狀態管理邏輯
3. 在組件中呼叫服務方法
4. 更新模型定義（如需要）

### Mock 資料管理
在 `JobRoleService` 的 `mockJobRoles` 陣列中管理測試資料。

### 測試
執行測試指令：
```bash
ng test
```

## 技術規格
- Angular 19+
- RxJS
- Bootstrap 5
- TypeScript
- Angular Signals
- Standalone Components

## 注意事項
1. 所有 API 呼叫都有錯誤處理
2. 表單有完整的驗證機制
3. 支援響應式設計
4. 符合無障礙設計原則
5. 使用 Angular 19 的新功能（Signals, Standalone Components）
