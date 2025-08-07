---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: '腳手架自動生成 Angular CRUD 功能（UI/SCSS/HTML 必須嚴格複製指定模板，只更換表單/表格欄位）'
---

## 步驟 0：（可選）後端 API/資料模型參考

- 在開始腳手架生成前，**請先詢問用戶是否有後端 Controller、OpenAPI/Swagger 規格或 Java model 檔案可供參考**。
- 若有提供，**優先根據後端 source 提取欄位定義/型別，作為前端 model/interface 產生的唯一依據**。
- 若沒有，則進入步驟 2 手動輸入欄位。

---

## 步驟 1：指定實體名稱
1. 實體/功能名稱  
    - 請輸入要建立的新實體/功能名稱（例如 "course"、"employee"、"department"）
        → 這將用於資料夾/檔案命名（kebab-case）。
2. 選擇模板  
    - 請指定你要參考的現有功能或模板
      （例如 employee-management、user-management、department-management 等）
        → 檔案結構、UI/UX、排版與 SCSS 皆將直接複製該模板。

---

## 步驟 2：列出所有欄位/列舉/驗證條件
請以如下格式提供本實體所有欄位：
- 欄位名稱（英文、kebab-case）
- 型別（number, string, boolean, date, enum, reference, optional/required 等）
- enum 選項（如適用）
- 欄位描述（可選）
- 驗證需求（required, min/max, pattern, unique 等）
- 只會根據這份欄位清單，替換 table 欄、form 欄位與檢視欄位。

範例：
```
courseId: number, required, primary key
courseName: string, required
isActive: boolean, required, default true
level: 'beginner' | 'advanced' | 'expert', enum
remark: string, optional
createTime: Date, system, auto-filled
createUser: string, system, auto-filled
```

---

## 步驟 3：自動產生 CRUD 與權限控制（嚴格複製 UI）

- 所有 `components/`（清單、表單、檢視）必須**完全使用指定模板的 HTML、class 名、按鈕/ARIA 標籤、Bootstrap Icons 及權限控制邏輯**。
- **只根據新 model 替換表格欄位、表單欄位、dialog 欄位**，其他皆照模板。
- **所有操作權限控制（hasCreatePermission、hasUpdatePermission 等）邏輯必須保留：**
    - 按鈕/欄位根據模板權限邏輯隱藏/顯示/禁用。
    - 在 TS 及模板中用 `hasResourceActionPermission(resource, action)` 這類方法做 UI 權限判斷。
- SCSS/HTML 必須 100% 復用模板的 BEM class、變數與結構，不得更改版型或樣式。
- 所有互動（排序、分頁、狀態 badge、a11y、modal、權限）皆要 mirror 模板。

---

## 步驟 4：產生 CRUD 檔案結構（複製現有，只換 model/欄位）

- 產生所有 `.ts`、`.html`、`.scss`、`models`、`service`、`store`、`routes`、`README.md`，僅有欄位/model 定義不同，其他都和模板一致。
- README 必須註明本功能完全複製自哪個模板。

---

## 步驟 5：更新路由與側邊欄選單

1. **更新 `app.routes.ts`：**
    - 在主頁父路由下 `children` 陣列中新增此功能的新子路由。
    - 路由使用 `loadComponent()`，kebab-case 為路徑，PascalCase 為 component 名。

2. **更新 Sidebar（`main-layout.component.html`）：**
    - 在 sidebar nav 的「功能區塊」下新增該功能的 menu 項（如 `/employee`, `/department`）。
    - 每個 menu 項必須用合適的 Bootstrap Icon（如 `bi-people`, `bi-person`, `bi-building`），icon 在左、中文名稱、kebab-case routerLink。
    - 新功能增刪時，sidebar menu 項須自動更新（自動產生或附註維護說明）。
    - sidebar active 狀態必須和 router 同步。

**Sidebar 項目範例：**
```html
<li class="nav-item mb-1">
  <a class="nav-link" routerLink="/employee" routerLinkActive="active"
     (click)="debugSidebarClick('員工主檔'); sidebarOpen.set(false)">
    <i class="bi bi-people icon-accent me-2"></i>員工主檔
  </a>
</li>
```

---

## 步驟 6：產生 README 與單元測試

- README 說明產生結構、mock/API 切換及樣式規範依據。
- 所有 CRUD/UI/mocks 關鍵邏輯必須有 `.spec.ts` 測試檔，並依新 model/欄位調整。

---

## 步驟 7：檢查表/驗證

- 所有結構、SCSS、UI、UX 與測試檔都要 mirror 模板。
- 型別需完全對應新 model（TypeScript strict mode）。
- Sidebar、路由、README 均需正確更新。

---

## 權限管理說明

- 所有 CRUD 操作與欄位皆要有權限守衛，**邏輯與模板一致**（如 `@if (hasCreatePermission()) { ... }`）。
- 權限工具（hasResourceActionPermission 等）及 userStore 實作要全部複製。
- 若模板有自定 PermissionGuard、per-route canActivate/data、UI 欄位守衛，這些邏輯都要直接照抄。

---