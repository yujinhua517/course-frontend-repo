---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: '自動產生 Angular 完整 CRUD 功能，檔案結構、UI/SCSS/HTML/權限完全 mirror 指定模板，邏輯須符合 Angular 19+ coding guidelines'
---

# Goal
自動產生一個結構完整、專用檔案分離的 Angular CRUD 功能（含權限控制、最佳實踐重構），每個步驟均 mirror 指定模板，並遵循 Angular 19+ coding guidelines。

---

## Development Workflow

## Step 1: 確認要製作的功能與參考模板
- 詢問用戶**要產生哪個功能/實體**（例如 course、employee、department...）。
- 詢問**要 mirror 哪個現有功能或模板**（如 employee-management、department-management...）。
- 若有，**請用戶提供後端 Controller/OpenAPI/Swagger/Java model** 作為 model 欄位定義依據。
- 規則詳見 [.github/prompts/copy.step1.prompt.md]。

---

## Step 2: 生成 models 與 欄位/權限定義
- 根據模板及/或用戶提供的後端資料，產生 TypeScript models。
- 請**用戶列出本功能所有欄位、型別、驗證條件**（required/min/max/pattern/unique…），並**明確列出各角色的 CRUD 權限**（如 admin: CRUD, supervisor: R）。
- 欄位/權限格式詳見 [.github/prompts/copy.step2.prompt.md]。
- 型別必須嚴格對應（TypeScript strict mode）。

---

## Step 3: 生成 store 和 service
- 根據模板 mirror store/service 結構，但**API、型別、資料流、狀態管理一律依 Angular 19+ coding guidelines 重構（signals, inject, resource/httpResource, 統一錯誤處理…）**。
- 禁止直接 subscribe、禁止 constructor 注入。

---

## Step 4: 生成 components
- 產生對應共用/專用 components，**UI/結構/互動 mirror 模板，邏輯部分如有不符 coding guidelines 則重構最佳化**。
- 包含 table、form、dialog、modal、badge、搜尋等。

---

## Step 5: 生成 pages
- 產生 list、新增、編輯、檢視等 pages，**全部 mirror 指定模板 UI/結構/SCSS，僅依 model/欄位差異調整表單與欄位顯示**。
- 權限顯示/功能依角色設定自動處理。

---

## Step 6: 生成路由與側邊欄
- mirror 模板路由配置（使用 loadComponent()），自動更新 app.routes.ts。
- 更新 Sidebar（main-layout.component.html），新增 menu，icon/結構 mirror 指定模板。

---

## Step 7: 產生 README 與單元測試
- 自動產生 README，註明來源模板，描述 mock/API 切換及樣式規範依據。
- 為所有 CRUD/UI/mocks 產生 .spec.ts 單元測試（mirror 原模板 + 依新 model/欄位自動調整）。

---

## Step 8: 檢查驗證與 Refactor.md 輸出
- 所有產生檔案結構、SCSS、UI/UX、測試 mirror 模板，型別對應新 model。
- 若 mirror 的模板本身有不符合 Angular 19+ coding guidelines 的寫法（如 component subscribe, constructor 注入, inline style/template），**自動產生 Refactor.md，說明違規處並提供最佳實踐建議，並於產生的新 code 自動修正成最佳寫法**。

---

## 權限管理與守衛
- 所有 CRUD 操作與欄位皆依步驟 2 角色權限自動產生權限守衛與 UI 控制（如 @if (permissions().create) { ... }）。
- 權限工具（hasResourceActionPermission 等）、userStore mirror 模板。
- 若模板有自定 PermissionGuard、per-route canActivate/data、UI 欄位守衛，皆 mirror 並最佳化。

---

**所有檔案、結構、命名、資料流、權限、UI/UX 必須 mirror 指定模板，但任何不符 Angular 19+ coding guidelines 的程式碼必須重構最佳化，違規部分自動產出 Refactor.md 說明及建議。**
