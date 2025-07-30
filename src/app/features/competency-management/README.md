# 職能主檔管理系統

## 概述
職能主檔管理系統提供完整的 CRUD 功能，用於管理組織內的職能資料。系統採用 Angular 19+ Standalone 架構，使用 Bootstrap 5 進行 UI 設計，並支援響應式布局。

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

### Competency 模型
```typescript
interface Competency {
  job_role_code: string;     // 職能代碼（主鍵）
  job_role_name: string;     // 職能名稱
  description?: string;      // 職能描述（可選）
  is_active: number;         // 啟用狀態（1=啟用, 0=停用）
  create_time: Date;         // 建立時間
  create_user: string;       // 建立者
  update_time: Date;         // 更新時間
  update_user: string;       // 更新者
}
```

## 檔案結構
```
competency-management/
├── components/
│   ├── competency-form/           # 新增/編輯表單組件
│   └── competency-view/           # 檢視詳細資訊組件
├── pages/
│   └── competency-list/           # 列表頁面組件
├── models/
│   └── competency.model.ts        # 資料模型定義
├── services/
│   ├── competency.service.ts      # 資料服務
│   └── competency.service.spec.ts # 服務測試
├── store/
│   └── competency.store.ts        # 狀態管理
├── pipes/
│   └── competency-status.pipe.ts  # 狀態顯示管道
├── competency-management.routes.ts # 路由設定
└── README.md                      # 說明文件
```

## Mock 資料與 API 切換

### 切換方式
在 `competency.service.ts` 中修改：
```typescript
private useMockData = true; // 設為 false 切換至真實 API
```

### Mock 資料特色
- 提供 5 筆範例資料
- 支援分頁、搜尋、排序功能
- 模擬 300ms 網路延遲
- 完整的 CRUD 操作

### API 整合準備
真實 API 端點已預留：
- `GET /api/competencies` - 取得職能列表
- `POST /api/competencies` - 新增職能
- `PUT /api/competencies/{code}` - 更新職能
- `DELETE /api/competencies/{code}` - 刪除職能
- `PATCH /api/competencies/{code}/toggle-status` - 切換狀態

## 樣式設計系統

### SCSS 變數使用
所有樣式嚴格遵循 `_variables.scss` 的設計令牌：
- 顏色：使用 `$brand-primary`、`$brand-success` 等
- 字體：使用 `$brand-font`、`$text-*` 尺寸
- 陰影：使用 `$brand-shadow-*` 系列
- 按鈕：使用 `$btn-gradient-*` 系列

### BEM 命名慣例
```scss
.competency-list-container
├── .page-header
├── .search-section
├── .table-container
├── .empty-state
└── .pagination
```

### Bootstrap 整合
- 使用 Bootstrap 5 核心組件
- Bootstrap Icons 圖示系統
- 響應式網格系統
- 表單控制項與驗證樣式

## 側邊選單整合

### 新增選單項目
在 `main-page.component.html` 中新增：
```html
<li class="nav-item mb-1">
  <a class="nav-link" routerLink="/competency" routerLinkActive="active"
     (click)="debugSidebarClick('職能主檔'); sidebarOpen.set(false)">
    <i class="bi bi-person-workspace icon-accent me-2"></i>職能主檔
  </a>
</li>
```

### 路由更新
在 `app.routes.ts` 中新增：
```typescript
{
  path: 'competency',
  loadComponent: () => import('./features/competency-management/pages/competency-list/competency-list.component').then(m => m.CompetencyListComponent)
}
```

## 測試覆蓋
- ✅ 服務層測試：CRUD 操作、搜尋、篩選
- ✅ 組件測試：列表顯示、表單操作、事件處理
- ✅ 狀態管理測試：Store 行為驗證
- ✅ 管道測試：狀態轉換邏輯

## 無障礙設計（A11y）
- ARIA 標籤完整標記
- 鍵盤導航支援
- 色彩對比度符合 WCAG 2.1 AA 標準
- 螢幕閱讀器友好的語義化標記

## 使用說明

### 基本操作
1. **瀏覽職能列表**：進入系統後可查看所有職能
2. **搜尋職能**：使用關鍵字搜尋職能代碼或名稱
3. **篩選狀態**：可依啟用/停用狀態篩選
4. **排序資料**：點擊表頭進行排序
5. **切換狀態**：點擊狀態徽章快速啟用/停用

### 新增職能
1. 點擊「新增職能」按鈕
2. 填寫職能代碼、名稱、描述
3. 選擇啟用狀態
4. 點擊「建立」完成新增

### 編輯職能
1. 點擊操作欄的編輯按鈕
2. 修改職能資訊（代碼不可修改）
3. 點擊「更新」儲存變更

### 檢視詳細資訊
1. 點擊操作欄的檢視按鈕
2. 查看完整的職能資訊
3. 包含系統建立與更新記錄

## 開發備註

### 效能考量
- 使用 OnPush 變更檢測策略
- 分頁載入減少資料量
- 防抖搜尋避免頻繁請求

### 擴展性
- 模組化設計便於功能擴充
- 標準化的服務介面
- 可重用的組件架構

### 維護性
- 完整的 TypeScript 型別定義
- 清楚的錯誤處理機制
- 統一的程式碼風格

## 技術決策說明

1. **為什麼使用 Signals**：
   - 更好的效能表現
   - 簡化狀態管理
   - Angular 未來發展方向

2. **為什麼選擇三檔案分離**：
   - 職責分離原則
   - 便於團隊協作
   - 提升程式碼可讀性

3. **為什麼使用 Mock 服務**：
   - 前端開發不依賴後端
   - 便於測試與展示
   - 快速原型驗證

4. **為什麼遵循 main-page 樣式**：
   - 保持設計一致性
   - 降低學習成本
   - 易於維護與更新
