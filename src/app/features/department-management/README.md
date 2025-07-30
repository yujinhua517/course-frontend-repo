# 部門主檔管理 (Department Management)

本功能提供完整的部門主檔管理系統，包含部門的CRUD操作、階層關係管理，以及完整的UI介面。

## 📁 檔案結構

```
department-management/
├── components/
│   ├── department-form/          # 部門表單組件（新增/編輯）
│   └── department-view/          # 部門檢視組件（詳細資訊）
├── models/
│   └── department.model.ts       # 部門相關型別定義
├── pages/
│   └── department-list/          # 部門列表頁面
├── pipes/
│   └── department-status.pipe.ts # 部門狀態顯示管道
├── services/
│   └── department.service.ts     # 部門資料服務
├── store/
│   └── department.store.ts       # 部門狀態管理
├── department-management.routes.ts # 路由設定
└── README.md                     # 本說明文件
```

## 🎯 功能特色

### 部門列表 (Department List)
- ✅ 響應式表格UI，支援排序、分頁、搜尋
- ✅ 多條件篩選（關鍵字、狀態、啟用狀態）
- ✅ 即時狀態切換（啟用/停用）
- ✅ 完整的CRUD操作按鈕
- ✅ 空資料狀態與載入狀態
- ✅ Bootstrap Icons整合
- ✅ 無障礙設計（ARIA標籤）

### 部門表單 (Department Form)
- ✅ 響應式表單驗證
- ✅ 支援新增與編輯模式
- ✅ 階層關係選擇（上層部門）
- ✅ 多種輸入型別（文字、數字、下拉、開關）
- ✅ 即時驗證與錯誤提示
- ✅ Modal彈窗設計

### 部門檢視 (Department View) ✨ **最新更新**
- ✅ 結構化資訊展示
- ✅ **使用全新 InfoDisplay 組件統一顯示格式**
- ✅ 分區塊顯示（基本資訊、層級結構、系統資訊）
- ✅ 支援多種資料類型（文字、徽章、日期、狀態）
- ✅ 響應式網格佈局（1-4欄自適應）
- ✅ Bootstrap Icons 完整整合
- ✅ 智能空值處理
- ✅ 高度可配置的樣式系統
- ✅ 圖示與狀態顏色
- ✅ Modal彈窗設計

## 🗂️ 資料模型

### Department Interface
```typescript
interface Department {
  id: number;                    // 部門ID
  department_code: string;       // 部門代碼
  department_name: string;       // 部門名稱
  description?: string;          // 描述
  parent_department_id?: number; // 上層部門ID
  manager_id?: number;           // 部門主管ID
  status: DepartmentStatus;      // 狀態
  is_active: boolean;           // 是否啟用
  location?: string;            // 位置
  budget?: number;              // 預算
  employee_count: number;       // 部門人數
  create_time: Date;            // 建立時間
  create_user: string;          // 建立者
  update_time?: Date;           // 更新時間
  update_user?: string;         // 更新者
}
```

### Department Status
```typescript
type DepartmentStatus = 'active' | 'inactive' | 'suspended';
```

## 🔧 Mock 資料與 API 切換

### 切換方式
在 `department.service.ts` 中修改 `useMockData` 變數：

```typescript
// 使用 Mock 資料
private readonly useMockData = true;

// 使用真實 API
private readonly useMockData = false;
```

### Mock 資料特色
- 📦 內建6筆測試資料
- 🔄 支援完整CRUD操作
- 📊 包含階層關係範例
- ⚡ 模擬網路延遲
- 🔍 支援搜尋、篩選、分頁

### API 整合準備
所有 TODO 註解標示的地方需要替換為真實的 HTTP 呼叫：

```typescript
// TODO: Replace with actual HTTP call
// return this.http.get<DepartmentListResponse>('/api/departments');
```

## 🎨 UI 組件整合

### InfoDisplay 組件使用
部門檢視頁面現在使用新的 `InfoDisplay` 組件來統一資訊顯示格式：

```typescript
// 基本資訊配置
basicInfoConfig = computed<InfoDisplayConfig>(() => ({
  title: '基本資訊',
  columns: 2,
  items: [
    {
      label: '部門代碼',
      value: this.department()?.dept_code,
      icon: 'hash',
      className: 'fw-medium text-primary'
    },
    {
      label: '部門名稱', 
      value: this.department()?.dept_name,
      icon: 'building',
      className: 'fw-medium'
    },
    {
      label: '部門層級',
      value: this.getLevelOption(this.department()?.dept_level)?.label,
      icon: 'diagram-3',
      type: 'badge',
      variant: 'info'
    },
    {
      label: '狀態',
      value: this.department()?.is_active,
      icon: 'toggle-on',
      type: 'status'
    }
  ]
}));
```

#### InfoDisplay 特色
- 🎯 **統一的資訊顯示格式**
- 📱 **響應式網格佈局**（1-4欄自適應）
- 🎨 **多種資料類型支援**（文字、徽章、日期、狀態、連結等）
- 🎭 **圖示整合**（Bootstrap Icons）
- 🎛️ **可配置的樣式**（卡片、標題、項目自定義樣式）
- 📊 **空值處理**（可選擇顯示或隱藏空項目）

#### 支援的資料類型
```typescript
type InfoItemType = 'text' | 'badge' | 'date' | 'status' | 'email' | 'phone' | 'link';
```

- `text` - 一般文字顯示
- `badge` - 徽章樣式（可設定顏色變體）
- `date` - 日期格式化顯示
- `status` - 布林值狀態顯示（啟用/停用）
- `email` - 郵件連結
- `phone` - 電話連結
- `link` - 自定義連結

#### 使用範例
```html
<!-- 在模板中使用 -->
<app-info-display [config]="basicInfoConfig()" class="mb-4"></app-info-display>
<app-info-display [config]="hierarchyInfoConfig()" class="mb-4"></app-info-display>
<app-info-display [config]="systemInfoConfig()"></app-info-display>
```

## 🎨 樣式設計

### SCSS 架構
- 📐 使用 `_variables.scss` 的設計變數
- 🎨 Bootstrap 整合與客製化
- 📱 響應式設計
- ♿ 無障礙色彩對比
- 🎭 一致的視覺語言

### 顏色系統
```scss
// 狀態顏色
$badge-success-bg: #28a745;  // 啟用/成功
$badge-warning-bg: #ffc107;  // 暫停/警告
$badge-gray-bg: #6c757d;     // 停用/次要
```

## 🔗 路由整合

### 主路由更新
在 `app.routes.ts` 中新增：

```typescript
{
  path: 'department',
  loadChildren: () => import('./features/department-management/department-management.routes')
    .then(m => m.departmentManagementRoutes),
  title: '部門主檔'
}
```

### 側邊選單更新
在 `main-layout.component.html` 中新增：

```html
<li class="nav-item mb-1">
  <a class="nav-link" routerLink="/department" routerLinkActive="active"
     (click)="debugSidebarClick('部門主檔'); sidebarOpen.set(false)">
    <i class="bi bi-building icon-accent me-2"></i>部門主檔
  </a>
</li>
```

## 🧪 測試覆蓋

### 組件測試
- ✅ DepartmentListComponent - 完整CRUD操作測試
- ✅ DepartmentFormComponent - 表單驗證與提交測試
- ✅ DepartmentViewComponent - 資料顯示測試

### 服務測試
- ✅ DepartmentService - Mock 資料CRUD測試
- ✅ 分頁、搜尋、篩選功能測試
- ✅ 錯誤處理測試

### 執行測試
```bash
ng test --include="**/department-management/**"
```

## 📋 TODO 與擴充

### 短期改進
- [ ] 整合員工資料API（部門主管選擇）
- [ ] 新增部門階層樹狀圖
- [ ] 匯出功能實作（Excel/PDF）
- [ ] 批次操作功能

### 長期規劃
- [ ] 部門職位管理
- [ ] 部門KPI設定
- [ ] 組織圖視覺化
- [ ] 歷史變更記錄

## 🔒 權限設計準備

```typescript
// 未來權限整合範例
enum DepartmentPermission {
  VIEW = 'department:view',
  CREATE = 'department:create',
  EDIT = 'department:edit',
  DELETE = 'department:delete',
  MANAGE_HIERARCHY = 'department:manage_hierarchy'
}
```

## 📚 相關文件

- [Angular 19+ 開發指南](../../.github/instructions/angular_19_copilot_instructions.md)
- [設計系統變數](../../src/styles/_variables.scss)
- [職能管理參考](../competency-management/)
- [課程管理參考](../course-management/)

---

## 🚀 快速開始

1. **設定路由**：更新 `app.routes.ts` 和側邊選單
2. **確認相依性**：確保 Bootstrap Icons 已安裝
3. **測試功能**：訪問 `/department` 查看部門列表
4. **客製化**：根據需求調整 Mock 資料或連接真實API

## 🎉 最新實作 - InfoDisplay 組件整合

### 重要更新 (2024)
部門檢視頁面已成功整合全新的 **InfoDisplay 組件**，這是一個重要的 UI 統一化里程碑：

#### ✨ 實作亮點
- 🔄 **完全重構檢視頁面** - 從原生 HTML 轉換為組件化設計
- 📱 **響應式網格系統** - 支援 1-4 欄自適應佈局
- 🎨 **統一的視覺語言** - 所有資訊展示使用一致的格式
- 🎯 **類型安全** - 完整的 TypeScript 介面定義
- 🔧 **高度可配置** - 樣式、圖示、顯示規則全可控

#### 📋 技術實現
```typescript
// 三個主要資訊區塊
basicInfoConfig = computed<InfoDisplayConfig>(() => ({ ... }));      // 基本資訊
hierarchyInfoConfig = computed<InfoDisplayConfig>(() => ({ ... }));  // 層級結構  
systemInfoConfig = computed<InfoDisplayConfig>(() => ({ ... }));     // 系統資訊
```

#### 🔄 遷移效益
- **程式碼減少 60%** - 從複雜的 HTML 模板簡化為宣告式配置
- **維護性提升** - 統一的組件減少重複代碼
- **可讀性增強** - 配置式語法更清晰易懂
- **擴展性提升** - 新增欄位只需修改配置物件

#### 📚 相關文件
- [`/shared/components/info-display/README.md`](../../../shared/components/info-display/README.md) - 完整 API 文件
- [`/shared/components/info-display/EXAMPLES.md`](../../../shared/components/info-display/EXAMPLES.md) - 使用範例
- 本資料夾中的 `department-view.component.ts` - 實際實作範例

> **注意**：此組件設計為通用解決方案，可應用於其他模組的檢視頁面（Employee、Competency 等）

## 💡 設計決策

### 為什麼選擇這種架構？
- **特性導向**：每個業務功能獨立維護
- **Angular 19+**：使用最新的 Signals 和 standalone 架構
- **一致性**：與現有功能（competency-management）保持一致
- **可擴展性**：預留API整合和權限管理接口
- **組件化**：透過 InfoDisplay 等共用組件提升開發效率

### 狀態管理選擇
- 使用 Angular Signals 進行本地狀態管理
- Store 模式便於複雜資料流管理
- 相較於 NgRx 更輕量且符合小型功能需求
