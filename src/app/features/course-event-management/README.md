# Course Event Management Feature

## 概述

這是一個課程活動管理功能模組，基於 `employee-management` 作為模板創建，提供完整的課程活動 CRUD 操作。

## 功能特點

- 🎯 課程活動資料管理（新增、編輯、查看、刪除）
- 🔍 智能搜索與篩選功能
- 📄 分頁顯示與排序
- 🔐 權限控制整合
- 📱 響應式設計支持
- ⚡ Angular 19+ 現代化架構

## 技術架構

### 技術棧
- **Angular**: v19+ 
- **TypeScript**: 嚴格類型檢查
- **SCSS**: 樣式管理
- **Bootstrap**: v5 UI 框架
- **Angular Signals**: 響應式狀態管理

### 架構模式
- **Feature-based**: 功能模組化架構
- **Standalone Components**: 獨立組件設計
- **Signal Store**: 信號式狀態管理
- **Resource Pattern**: 資源式數據請求

## 檔案結構

```
src/app/features/course-event-management/
├── models/
│   └── course-event.model.ts          # 數據模型定義
├── services/
│   ├── course-event.service.ts        # 數據服務層
│   └── mock-course-events.data.ts     # 模擬數據
├── store/
│   └── course-event.store.ts          # 狀態管理
├── components/
│   ├── course-event-form/             # 表單組件
│   │   ├── course-event-form.component.ts
│   │   ├── course-event-form.component.html
│   │   └── course-event-form.component.scss
│   └── course-event-view/             # 詳情組件
│       ├── course-event-view.component.ts
│       ├── course-event-view.component.html
│       └── course-event-view.component.scss
├── pages/
│   └── course-event-list/             # 列表頁面
│       ├── course-event-list.component.ts
│       ├── course-event-list.component.html
│       └── course-event-list.component.scss
├── pipes/
│   └── course-event-semester.pipe.ts  # 學期顯示管道
├── course-event.routes.ts             # 路由配置
└── index.ts                           # 模組匯出
```

## 主要組件

### 1. 數據模型 (course-event.model.ts)
- `CourseEvent`: 主要實體接口
- `CourseEventCreateDto`: 創建數據傳輸對象
- `CourseEventUpdateDto`: 更新數據傳輸對象
- `CourseEventSearchParams`: 搜索參數

### 2. 服務層 (course-event.service.ts)
- 繼承 `BaseQueryService` 提供標準 CRUD 操作
- 支持模擬數據與真實 API 切換
- 完整的錯誤處理機制

### 3. 狀態管理 (course-event.store.ts)
- 使用 Angular Signals 進行響應式狀態管理
- 分離讀寫權限的信號設計
- 計算屬性支持衍生狀態

### 4. 表單組件 (course-event-form)
- 響應式表單驗證
- 模態窗口設計
- 支持新增與編輯模式

### 5. 詳情組件 (course-event-view)
- 結構化信息展示
- 使用共享的 `InfoDisplayComponent`
- 響應式布局設計

### 6. 列表頁面 (course-event-list)
- 數據表格展示
- 搜索與篩選功能
- 分頁與排序支持
- 批量操作功能

## 權限控制

功能整合了權限管理系統：
- `COURSE_EVENT_READ`: 查看權限
- `COURSE_EVENT_CREATE`: 創建權限  
- `COURSE_EVENT_UPDATE`: 編輯權限
- `COURSE_EVENT_DELETE`: 刪除權限

## 路由配置

```typescript
{
  path: 'course-event',
  canActivate: [PermissionGuard],
  data: { permissions: [PermissionName.COURSE_EVENT_READ] },
  loadComponent: () => import('./features/course-event-management/pages/course-event-list/course-event-list.component')
    .then(m => m.CourseEventListComponent)
}
```

## 使用方式

### 基本操作
1. **查看列表**: 訪問 `/course-event` 路由
2. **新增課程**: 點擊「新增課程活動」按鈕
3. **編輯課程**: 點擊列表中的編輯按鈕
4. **查看詳情**: 點擊列表中的查看按鈕
5. **刪除課程**: 點擊列表中的刪除按鈕

### 搜索功能
- 支持按年度篩選
- 支持按學期篩選  
- 支持活動標題關鍵字搜索
- 複合條件搜索

## 開發配置

### 模擬數據
當前使用模擬數據進行開發，可在 `course-event.service.ts` 中設置：
```typescript
private readonly useMockData = true; // 設為 false 使用真實 API
```

### API 整合
真實 API 端點配置：
- GET `/api/course-events` - 取得列表
- POST `/api/course-events` - 創建新項目
- PUT `/api/course-events/{id}` - 更新項目
- DELETE `/api/course-events/{id}` - 刪除項目

## 測試

### 單元測試
每個組件和服務都應包含對應的 `.spec.ts` 測試文件：
- `course-event.service.spec.ts`
- `course-event.store.spec.ts`
- `course-event-form.component.spec.ts`
- `course-event-view.component.spec.ts`
- `course-event-list.component.spec.ts`

### E2E 測試
建議添加端到端測試覆蓋主要用戶流程。

## 參考來源

本功能模組完全基於 `employee-management` 功能作為模板創建，保持了一致的：
- 代碼結構和組織方式
- 設計模式和最佳實踐
- UI/UX 交互模式
- 錯誤處理機制

## 未來擴展

可考慮的功能擴展：
- 課程活動分類管理
- 報名管理功能
- 課程評價系統
- 數據分析與報表
- 批量導入/導出功能

---

**創建日期**: 2024年12月
**模板來源**: employee-management
**技術版本**: Angular 19+
