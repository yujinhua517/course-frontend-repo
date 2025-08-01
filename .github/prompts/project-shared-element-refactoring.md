---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: 'Scan Angular Project for Reusable UI/Table Components and SCSS (Strict Shared Principles)'
---

# Scan for Reusable Stateless Table/UI Components and SCSS (Angular Project, Shared Principle Enforced)

## Step 1: Scan and Analyze

- **Scan the entire Angular project** for：
  - All UI components（table, badge, dialogs, buttons, etc.）
  - Table/Badge/List/Button 相關 HTML/SCSS、重複或相似的結構或 class name
  - 任意在不同 features/modules/components 有高重複度的 markup、SCSS、component 結構

## Step 2: Identify Valid Shared Candidates (Strict Stateless/Presentational Principle)

- **僅列出以下條件皆成立的元件/HTML/SCSS：**
  - 完全 stateless（無本地或全域 state/不依賴 service/store，僅用 input/output 呈現 UI）
  - 沒有任何業務邏輯、API 呼叫、資料變動、Side Effect
  - 功能單純（如 Table/List/Badge/View/Dialog/Button，只根據 input 顯示 UI）
  - SCSS 為純樣式、無特殊 domain class/override

- **明確排除以下狀況：**
  - 涉及業務邏輯、API 資料、全域或本地資料流、依賴 feature service/store
  - 與特定業務流程、頁面行為耦合
  - 只在單一 feature 使用、不具重用價值

- **請於 output 清楚註明：**
  - 若某 component/SCSS 原本看似共用但因有邏輯或依賴，不建議抽出，請加註警告：「此元件包含業務邏輯/狀態/資料，禁止搬至 shared！」

## Step 3: Output Refactoring Table

- 請用 Markdown Table 呈現：
  | Item Type | Original Path(s) | Proposed Shared Path | Suggested Name | Reason/Notes |
  |-----------|------------------|----------------------|----------------|--------------|

- 請於表格下方附上【refactoring checklist】，排序最值得搬遷/重構的項目（高重複、影響大者優先）

## Step 4: Confirm and Plan Refactoring (With User Decision)

- **每一個「建議搬遷」的元件/SCSS，請都再次詢問：「此 component/style 符合 shared stateless 原則，並在 X 個 feature 重複，是否要重構到 shared？(Y/N)」**
- 等待使用者回應再產生實際重構/搬遷步驟或 skeleton code。

---

## 注意事項（Prompt 檢查清單）

- 僅建議 Table、List、Badge、Button 等純 UI stateless component、SCSS、HTML
- 請自動過濾/排除業務邏輯/狀態/副作用/資料相關元件
- output 時明確說明過濾結果與搬遷理由
- 若元件部分純 stateless，可只抽共用 SCSS/HTML fragment

---

### 範例 Output

| Item Type  | Original Path(s)                                   | Proposed Shared Path                   | Suggested Name        | Reason/Notes                        |
|------------|----------------------------------------------------|----------------------------------------|-----------------------|-------------------------------------|
| Component  | features/employee/components/employee-table/       | shared/components/shared-table/         | SharedTableComponent  | Stateless Table，4 個 feature 重複  |
| SCSS       | features/department/styles/table.scss, ...         | shared/styles/table.scss                | table.scss            | Table 樣式重複，僅純 SCSS            |
| Component  | features/employee/components/status-badge/         | shared/components/status-badge/         | StatusBadgeComponent  | 無邏輯，只根據 input 呈現           |

**Checklist:**
- [ ] Extract SharedTableComponent to shared/components
- [ ] Extract table.scss to shared/styles
- [ ] Move StatusBadgeComponent to shared/components

---

### 注意補充

- 僅針對 stateless UI/樣式進行搬遷判斷，違反 shared 原則請自動加註警告並排除！
- 如發現邏輯/資料流/副作用，請直接 output：「禁止搬至 shared，請保留在 feature。」

---
