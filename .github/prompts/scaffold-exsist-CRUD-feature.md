---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: 'Scaffold an Angular CRUD Feature (Strictly Copy UI/SCSS/HTML from Template, Replace Only Table/Form Fields)'
---

## Step 0: (Optional) Backend API/Model Reference

- Before scaffolding, **ask the user whether they have a backend controller, OpenAPI/Swagger spec, or Java model file to reference**.
- If provided, **extract field definitions/types from the backend source as the primary source of truth for model/interface generation**.
- If not, proceed to manual field entry in Step 2.

---
## Step 1: Specify Entity Name
1. Entity/Feature Name
    - Please enter the entity/feature name you want to create (e.g., "course", "employee", "department")
        → This will be used for folder/file naming (kebab-case).
2. Select Template
    - Please specify which existing feature/template you want to reference
    (e.g., competency-management, user-management, department-management, etc.)
        → All file/folder structure, UI/UX, layout, and SCSS will copy this template.

## Step 2: List All Fields/Enums/Validation
Please provide all fields for this entity in the following format:
- field name (English, kebab-case)
- type (number, string, boolean, date, enum, reference, optional/required, etc.)
- enum options (if applicable)
- field description (optional)
- validation requirements (required, min/max, pattern, unique, etc.)
- Only the table columns, form fields, and view fields are replaced based on this list.


Example:
```
course_id: number, required, primary key
course_name: string, required
is_active: boolean, required, default true
level: 'beginner' | 'advanced' | 'expert', enum
remark: string, optional
create_time: Date, system, auto-filled
create_user: string, system, auto-filled
```

## Step 3: Scaffold CRUD with Permission Control (Strict UI Copy)  

- All `components/` (list, form, view) must use **the exact same HTML, classnames, button/aria labels, Bootstrap Icons, and permission UI logic as the template**.  
  Only **table columns, form fields, and view dialog fields are replaced** (per model).  
- **All per-action permission controls (`hasCreatePermission`, `hasUpdatePermission`, etc.) are preserved:**  
    - Buttons/fields are rendered/hidden/disabled using template’s permission logic.
    - Use methods like `hasResourceActionPermission(resource, action)` for UI guards in TS and templates.
- SCSS must 100% reuse the template’s BEM classes, variables, and structure, without any layout or style changes.
- All interactions (sorting, pagination, status badge, a11y, modal, permission) follow the template.

## Step 4: Generate CRUD Feature Structure (Copy Exist, Only Replace Model/Fields)
- Generate all `.ts`, `.html`, `.scss`, `models`, `mock service`, `store`, `routes`, and `README.md`, identical to the template except for field/model definition.
- README must document which template is used and that all UI is cloned from it.

## Step 5: Update Routing & Sidebar Menu

**1. Update `app.routes.ts`:**
- Add a new child route for the feature under the main page parent route (`children` array).
- Use `loadComponent()` and kebab-case path, and PascalCase component.

**2. Update Sidebar Menu (`main-layout.component.html`):**
- Add a menu item for the new feature (e.g., `/employee`, `/department`) in the sidebar nav under 功能區塊.
- Each menu item uses an appropriate **Bootstrap Icon** (e.g., `bi-people`, `bi-person`, `bi-building`), icon always on the left, Chinese display name, kebab-case routerLink.
- When new features are added/removed, the sidebar menu should be auto-updated (auto-generated code or clear comments on how to maintain).
- The sidebar active state must always reflect the router.

**Example Sidebar Item:**
```html
<li class="nav-item mb-1">
  <a class="nav-link" routerLink="/employee" routerLinkActive="active"
     (click)="debugSidebarClick('員工主檔'); sidebarOpen.set(false)">
    <i class="bi bi-people icon-accent me-2"></i>員工主檔
  </a>
</li>
```
---

## Step 6: Generate README & Unit Tests
- README documents the structure, mock/API switch, and style guide reference.
- `.spec.ts` files for all core CRUD/UI logic and mock service, adapted to the new model/fields.

## Step 7: Checklist/Validation
- All structure, SCSS, UI, UX, and test files mirror the template.
- Types strictly match new model (TypeScript strict mode).
- Sidebar/routing/README are correctly updated for the new feature.

## Permission Management Notes
- All CRUD actions and fields are permission-guarded exactly as in the template (e.g., `@if (hasCreatePermission()) { ... }`).
- Permission utility functions (hasResourceActionPermission, etc.) and userStore logic are preserved.
- If template has custom PermissionGuard, per-route canActivate/data, or UI field guards, copy all logic directly.



### 中文版（可供需求溝通）

1. 指定「要產生的新實體名稱」與「參考哪個現有 template」。
2. 只輸入新欄位與型別，**UI 部分（HTML/SCSS/按鈕/表格/操作/互動/樣式）全部複製 template，不做任何排版或視覺修改**。
3. CRUD、dialog、form 只換欄位，其餘照舊。
4. README 註明「本功能 UI 完全複製自 XXX template」。
5. 適合多 CRUD/一致 UI/快速交付。