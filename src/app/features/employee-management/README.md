# 員工主檔管理功能 (Employee Management)

本功能完全複製自 `competency-management` 模板，僅替換欄位與模型定義。

## 功能特色

- ✅ 完整的 CRUD 操作（新增、檢視、編輯、刪除）
- ✅ 進階搜尋與篩選功能
- ✅ 分頁與排序支援
- ✅ 響應式設計，支援行動裝置
- ✅ 表單驗證與錯誤處理
- ✅ 模擬資料與 API 切換
- ✅ 狀態管理 (Angular Signals)
- ✅ 無障礙設計 (Accessibility)

## 架構說明

### 檔案結構
```
employee-management/
├── components/
│   ├── employee-form/          # 新增/編輯表單組件
│   └── employee-view/          # 詳細檢視組件
├── models/
│   └── employee.model.ts       # 員工資料模型
├── pages/
│   └── employee-list/          # 員工列表頁面
├── pipes/
│   └── employee-status.pipe.ts # 員工狀態管道
├── services/
│   ├── employee.service.ts     # 員工資料服務
│   └── employee.service.spec.ts # 服務單元測試
├── store/
│   └── employee.store.ts       # 狀態管理 Store
├── employee-management.routes.ts # 路由配置
└── README.md                   # 本文件
```

### 資料模型

```typescript
interface Employee {
    emp_id: number;        // 主鍵，自動遞增
    emp_code: string;      // 員工工號，UK
    emp_name: string;      // 員工姓名
    emp_email?: string;    // 電子郵件
    emp_phone?: string;    // 聯絡電話
    dept_id: number;       // 所屬部門代碼，FK
    job_title?: string;    // 職稱
    hire_date?: Date;      // 到職日
    resign_date?: Date | null; // 離職日
    is_active: 0 | 1;      // 是否在職
    create_time: Date;     // 建檔時間
    create_user: string;   // 建檔人員
    update_time?: Date;    // 最後更新時間
    update_user?: string;  // 最後更新人員
}
```

## UI/UX 設計

本功能的所有 UI 組件、樣式、互動模式、響應式設計皆完全複製自 `competency-management` 模板：

- **列表頁面**: 搜尋篩選區、資料表格、分頁控制
- **表單組件**: 模態視窗、欄位驗證、系統資訊顯示
- **檢視組件**: 詳細資訊展示、狀態標籤
- **樣式系統**: Bootstrap Icons、BEM CSS 命名、變數系統

### 主要差異
- 欄位內容：職能 → 員工資訊
- 圖示：`bi-person-workspace` → `bi-people`
- 中文標籤：職能主檔管理 → 員工主檔管理

## 開發指引

### Mock 資料切換
在 `employee.service.ts` 中設定：
```typescript
private useMockData = true; // 設為 false 切換至真實 API
```

### 新增部門選項
在表單組件中的部門下拉選單，根據實際需求修改選項：
```html
<option value="1">資訊部</option>
<option value="2">企劃部</option>
<!-- 新增其他部門 -->
```

### 狀態管理
使用 Angular Signals 進行狀態管理：
```typescript
// 在組件中注入 Store
private employeeStore = inject(EmployeeStore);

// 讀取狀態
employees = this.employeeStore.employees;
loading = this.employeeStore.loading;
```

## 測試

執行單元測試：
```bash
ng test --include="**/employee-management/**"
```

## API 整合

當切換至真實 API 時，請實作以下端點：
- `GET /api/employees` - 取得員工列表
- `GET /api/employees/:id` - 取得單一員工
- `POST /api/employees` - 建立員工
- `PUT /api/employees/:id` - 更新員工
- `DELETE /api/employees/:id` - 刪除員工
- `PATCH /api/employees/:id/toggle-status` - 切換狀態

## 維護注意事項

1. **樣式更新**: 若需修改樣式，請同步更新 `competency-management` 模板
2. **欄位異動**: 修改欄位時需同步更新模型、表單、檢視、測試
3. **國際化**: 目前為繁體中文，若需支援多語言請使用 Angular i18n
4. **效能**: 大量資料時建議實作虛擬滾動或伺服器端分頁

---
**注意**: 本功能 UI 完全複製自 competency-management template，只替換表格欄位與表單欄位內容。
