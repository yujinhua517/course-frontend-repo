---
mode: 'agent'
model: Claude Sonnet 4
tools: ['codebase', 'editFiles']
description: 'Scaffold a Dynamic Entity Management Feature (Angular 19+ Standard, CRUD Table View, Bootstrap Icons, Mock Data, Sidebar Menu, UX Spec)'
---

# Scaffold an Entity Management Feature (CRUD Table, Sidebar Menu, Mock Data, Bootstrap Icons, Full UX Spec)

## Step 1: Enter Main Entity or Feature Name

Please specify the main entity or feature you want to manage  
(e.g., course-assignment, employee, department, training-session).  
This name will be auto-converted to kebab-case for folder and file naming.

---

## Step 2: Define All Fields, Types, and Relationships

List **all fields and their type/relationship** in the following format:

- Field name (English, kebab-case recommended)
- Type (number, string, boolean, date, enum, array, object, reference, required/optional, nullable, etc.)
- Valid values (list all values for enums)
- Field description (purpose, meaning)
- *(Optional)* Relationship: If a foreign key, specify which entity and relation type (e.g., many-to-many, one-to-many, junction table, embedded)
- *(Optional)* If includes array or nested object, describe its structure

**If you need many-to-many or batch assignments (e.g., employee-course-assignment), clearly describe the main/sub-entity and all relationships.**

---

## Step 3: Preview and Confirm Structure

Preview all entities, fields, and relationships. Please check carefully, revise if needed, and confirm before generation.

---



## Step 4: Generate Feature Structure & CRUD (with Permission Control + Table UI)

**Create under `src/app/features/${entity}-management/`:**
- `components/` – Includes List, Form (create/edit), and View/Detail (dialog) components. All components must be standalone and use three-file separation. (`.component.ts` `.component.html` `.component.scss`)
    - The List page (`${entity}-list.component`)  
      - **must render a paginated, sortable, and searchable table UI**, showing all major fields and status, following `competency-management.component.scss` styles.
      - **All table actions (edit, delete, export, add new) must use Bootstrap button components, Bootstrap Icons, and provide accessible aria-labels for a11y/keyboard support.**
      - **All action buttons (create/edit/delete/export...) must be shown/hidden via strict per-action permission check**  
        - Use `@if (hasCreatePermission())`, `@if (hasUpdatePermission())`, etc. for UI rendering
        - Each permission is based on resource-action (e.g., `hasResourceActionPermission('competency', 'create')`)
      - Action permission computed properties are defined in TS, e.g.:
        ```typescript
        readonly hasCreatePermission = computed(() => this.hasResourceActionPermission('competency', 'create'));
        ```
      - For any status/enum field, display colored Bootstrap Icons (e.g., green/red/yellow dot or badge) according to the value.
      - Enable/Disable status (e.g., is_active) must be shown as a clickable badge in the table.
          When the user clicks the badge, a confirmation dialog (modal) must appear to confirm the action before actually toggling the state.
          The badge color and icon must clearly indicate the current state.
          After successful change, display a global notification (e.g., toast/snackbar) to inform the user of the update.
      - The **Action** column is always last, containing edit (齒輪)、delete (叉叉)、and other buttons, all using Bootstrap Icons, and shown only if user has that permission.
      - For empty data, show a friendly empty state with Bootstrap Icon and clear explanation.
      - Must display all data in a table with out-of-the-box pagination, sorting, and search/filter features.
      - Do **not** use any non-Bootstrap icon library.
      - Use Bootstrap table classes and responsive design.
      - Use SCSS variables from [_variables.scss](../../src/styles/_variables.scss) for all colors and visual tokens wherever possible.
    - The Form page (`${entity}-form.component`)  
      - **must use reactive forms** with validation, and display all fields with appropriate input types (text, number, date, select, checkbox).
      - **Form fields and Save/Submit button must be hidden if user lacks proper update/create permission.**
      - On `create`/`edit`, automatically fill system fields (e.g., `create_user`, `create_time`, `update_user`, `update_time`).
      - Must use Bootstrap form controls and layout.
      - Create/Edit forms must support required validation, types, enum dropdowns, and follow `competency-management` style.
      - HTML and SCSS class names must follow BEM or be fully consistent with `competency-management` patterns.
    - The View/Detail dialog (`${entity}-view.component`)
      - Must display all fields in a read-only format, with clear labels and values.
      - Must use Bootstrap modal/dialog components.
      - The View/Detail dialog must display all fields (including auto-filled fields such as `create_user`, `create_time`, `update_user`, `update_time`).
      - Main info and system fields should be visually grouped, using Bootstrap Icons for fields like user (bi-person), time (bi-clock), etc.
      - Enum/type fields must display user-friendly labels.
      - Show a placeholder if a value is empty (e.g., "Not updated yet").
      - Recommended layout: description list (<dl>) or two-column table.

- `services/` – **Mock service** providing observable/mock data for all CRUD (list, add, edit, delete) before API integration.
    - All CRUD flows use RxJS Observable/Signal mock data, and support **pagination, sorting, searching/filtering** in-memory.
    - Service includes a boolean config (e.g., `useMockData = true`) to easily toggle between mock data and real API. Document how to switch.
    - Provide several seed mock records for immediate local UI experience.
- `store/` – State management using Angular signals
- `models/` – Strictly defined TypeScript interfaces/types for the entity and API DTOs.
- `pipes/` – Custom pipes if needed (e.g., for status label)
- `${entity}-management.routes.ts` – Routing using `loadComponent()` and `withComponentInputBinding()`
- `README.md` – Document business logic, structure, mock/API switch, permission control, and style guide reference.

---

## Step 5: Permission Utility & Integration

- Under `/src/app/core/auth/`, generate:
    - `user.store.ts`: define types/interfaces for User, Role, Permission (strict, no any)
    - `permission.guard.ts`: guard to check role/permission per route (optional for page level)
    - In each feature/component, use injected userStore + `hasResourceActionPermission(resource, action)` method for per-action UI control.
    - Demo template:
      ```typescript
      @if (hasCreatePermission()) {
        // Show create button
      }
      ```
    - All permission types should use enum or strict union types, not string literal everywhere.

---

## Step 6: Update Routing & Sidebar Menu

**1. Update `app.routes.ts`:**
- Add a new child route for the feature under the main page parent route (`children` array).
- Use `loadComponent()` and kebab-case path, and PascalCase component.

**2. Update Sidebar Menu (`main-layout.component.html`):**
- Add a menu item for the new feature (e.g., `/employee`, `/department`) in the sidebar nav under 功能區塊.
- Each menu item uses an appropriate **Bootstrap Icon** (e.g., `bi-people`, `bi-person`, `bi-building`), icon always on the left, Chinese display name, kebab-case routerLink.
- When new features are added/removed, the sidebar menu should be auto-updated (auto-generated code or clear comments on how to maintain).
- The sidebar active state must always reflect the router.
- 新增可選 canActivate: [PermissionGuard]，每個 feature 支援 data: { roles: [...] }。

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

## Step 7: Table/UI/SCSS/Accessibility/Internationalization (i18n)
- All table HTML and SCSS must use BEM naming or strictly follow [main-page.component.scss](../../src/app/features/main/components/main-page.component.scss) style.
- All UI (dialog, form, table, search, action buttons) must reuse/extend variables, mixins, colors, spacing, radius, font, and shadow from  `main-page.component.scss. `
- If the main page has SCSS mixins, variables, or design tokens, always reference them for new components.
- Never use inline styles or style attributes; all presentation is via classnames managed in SCSS.
- If i18n is used, all labels/titles/buttons/status text in table and form must use i18n pipe or resource file (can be mock).
- All table and CRUD actions are a11y-friendly, with ARIA labels and keyboard navigation.

---

## Step 8: Ask for Validation/Business Rules
Before generating code, ask:
"Do you have any special validation, search, filter, or business logic requirements for this entity?"

---

## Step 9: Generate README.md
- README must include:
  - How to switch between mock and real API
  - How sidebar menu is maintained
  - Permission control usage & example
  - Style/SCSS guide and BEM/class usage
  - Example seed data
  - Design decisions
  - Reference to main-page.component.scss for all new UI

---

## Step 10: Testing
- Every list, form, dialog, and service must have `.spec.ts` tests
- Tests cover: mock service CRUD behavior, UI CRUD actions, button click, table display, validation, and search/sort/filter.
- List & Form component must have sample test cases (display, action, empty state).

---

## Validation Steps
- Folder, file, naming, and code style strictly follow [custom.angular19.instructions.md](../instructions/custom.angular19.instructions.md)
- Table UI strictly follows main-page.component.scss for style, includes Bootstrap Icons for all interactive elements.
- Sidebar menu is updated and uses Bootstrap Icons, routerActive is always correct.
- All CRUD is first implemented using mock data/services (pagination, sorting, search), observable or signal-based, with easy config switch.
- Route and sidebar link are fully functional and tested.
- All types/interfaces are strictly defined, strict mode enabled, no any.
- All UI and CRUD logic have .spec.ts tests (including permission).
- README documents all required details.

## Checklist
[] Table UI supports pagination, sorting, and filtering/search out of the box, with Bootstrap Icons for status and action columns.
[] All icon and button actions use Bootstrap Icons and Bootstrap button classes with ARIA labels.
[] All permission logic is strictly enforced and UI adapts accordingly (button/field disable/hide).
[] Empty state has friendly icon and message.
[] All new `.component.scss` strictly reuse main-page.component.scss variables, mixins, and class patterns; BEM or equivalent naming only.
[] Mock services for CRUD support pagination/filtering and can be replaced by real API with a config flag.
[] Sidebar nav is updated for all features and keeps routerActive accurate.
[] All types/interfaces are `TypeScript` strict mode compliant, no `any`.
[] All UI/CRUD actions have `.spec.ts` tests using mock data and permission block.
[] README documents mock switching, style guide, sidebar, permission logic, and design rationale.