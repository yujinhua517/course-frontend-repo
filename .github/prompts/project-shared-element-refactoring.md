---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: 'Scan Angular Project for Reusable Page/Component/HTML/SCSS and Output Refactoring Checklist'
---

# Scan for Reusable Table Components, HTML, and SCSS (Angular Project)

## Step 1: Scan and Analyze

- Scan the entire Angular project for the following:
  - **All components** (UI, dialogs, tables, forms)
  - **Table-related HTML/SCSS** code (repeated table markup, table classNames, table component structure)
  - **Any duplicated or similar HTML or SCSS blocks** in different components/features

## Step 2: Identify Reusable Table/Component/HTML/SCSS

- List any table or UI component (and their HTML/SCSS) that:
  - Is implemented in more than one feature/module/component
  - Has very similar markup, style, or logic (table, status badge, action column, modal, etc.)
  - Can be generalized into a reusable/shared component (for example: Table, TableRow, TableHeader, StatusBadge, etc.)
- For each item, specify:
  - The original file(s)/path(s)
  - The proposed shared path (`src/app/shared/components/`, `src/app/shared/styles/`, etc.)
  - A suggested name (e.g., `SharedTableComponent`, `StatusBadgeComponent`)
  - A short reason for extraction (e.g., "Identical table structure in 3 features", "same HTML/SCSS repeated")

## Step 3: Output Refactoring Table

- Present your findings in a Markdown table with columns:
  | Item Type | Original Path(s) | Proposed Shared Path | Suggested Name | Reason/Notes |
  |-----------|------------------|----------------------|----------------|--------------|

- Follow up with a **step-by-step checklist** for refactoring, sorted by highest DRY/reuse benefit.

## Step 4: Prioritize & Confirm Refactoring

- List all potential shared components/styles sorted by DRY/reusability value (most repeated/impactful first).
- For each, ask the user:
    - "This component/style is used in X features. Do you want to refactor and extract it into a shared module? (Y/N)"
- Wait for your answer before generating actual migration/refactor steps or code.


---

### Notes

- Please **focus only on reusable or duplicate UI/Table components, HTML, and SCSS**.  
- **Skip services, pipes, model, and backend type sync** (not required for this task).
- Do not suggest code changes for non-UI logic or business layer.
- You can suggest auto-generated skeleton code for shared table or badge component if pattern is clear.

---

### Example Output

| Item Type  | Original Path(s)                                   | Proposed Shared Path                   | Suggested Name        | Reason/Notes                        |
|------------|----------------------------------------------------|----------------------------------------|-----------------------|-------------------------------------|
| Component  | features/employee/components/employee-table/       | shared/components/shared-table/         | SharedTableComponent  | Table HTML/SCSS repeated in 4 lists |
| SCSS       | features/department/styles/table.scss, ...         | shared/styles/table.scss                | table.scss            | Identical style blocks              |
| Component  | features/employee/components/status-badge/         | shared/components/status-badge/         | StatusBadgeComponent  | Used in several feature tables      |

**Checklist:**
- [ ] Extract SharedTableComponent to shared/components
- [ ] Extract common table.scss to shared/styles
- [ ] Move StatusBadgeComponent to shared/components

---

**中文版說明**

- 此 prompt 只針對「共用 Table、共用元件、共用 HTML、SCSS」進行分析和抽取建議，**不處理 Service/Model/TypeScript 型別/後端同步**。
- 請產生 refactoring checklist，並列出所有建議共用的元件路徑與原因。
- 可自動產生 skeleton code 或搬遷建議。

---
