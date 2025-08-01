---
applyTo: "**"
description: Complete Angular 19+ Coding, Structure, and Naming Guidelines (LLM/AI, Team Onboarding, Maintenance, Testing)
---

# 🟢 Angular 19+ Coding, Structure & Naming Unified Guide

**Adapted from [angular.dev/llms-full.txt](https://angular.dev/llms), engineering best practices, and detailed team structure/naming guidelines for scalable, modern Angular projects.**

---

## 1. Top-Level Project Structure

- `src/app/core/`
  - Global infrastructure and non-business utilities (e.g., layouts, authentication, global interceptors, guards, shared services, utilities)
- `src/app/features/`
  - Each business feature/domain has its own folder, containing its pages, components, services, types, routes, and state management (signals/store)
- `src/app/shared/`
  - **Only** stateless UI components (dumb components), shared pipes, and utilities; **no business logic**
- `src/environments/`
  - Environment configuration files, e.g., `environment.ts`, `environment.prod.ts`
- `src/assets/`
  - Static resources (images, icons, fonts, SVGs, i18n files, media, etc.)

**Example:**

```plaintext
src/
 ├── app/
 │    ├── core/
 │    │    ├── layout/
 │    │    ├── guards/
 │    │    ├── auth/
 │    │    ├── interceptors/
 │    │    ├── services/
 │    │    ├── utils/
 │    │    └── system-parameter.ts
 │    ├── features/
 │    │    ├── products/
 │    │    │    ├── components/
 │    │    │    ├── services/
 │    │    │    ├── store/
 │    │    │    ├── pages/
 │    │    │    ├── models/
 │    │    │    ├── pipes/
 │    │    │    └── products.routes.ts
 │    │    ├── orders/
 │    │    └── cart/
 │    └── shared/
 │         ├── components/
 │         ├── pipes/
 │         └── utils/
 ├── assets/
 │    ├── images/
 │    ├── icons/
 │    ├── fonts/
 │    └── i18n/
 └── environments/
      ├── environment.ts
      └── environment.prod.ts
```

---

## 2. Component File Separation Principle

- Each component **must** be split into three files:
  - `xxx.component.ts` — Logic
  - `xxx.component.html` — Template
  - `xxx.component.scss` — Styles
- Inline templates and styles are **prohibited** (except for trivial micro-components or demo code)
- Do not use HTML style attributes or inline CSS within templates, except for special cases (e.g., dynamic styles with clear business need)
- Avoid using class or id directly in HTML templates to override or “fight” SCSS styles
- All visual styles and overrides must be managed in the `.scss` file
- Keep HTML clean; only use class bindings for semantic/component structure, not to override styles
- **Goal:** Strict separation of structure (HTML), presentation (SCSS), and logic (TS) for maintainability, reusability, and collaboration

---

## 3. Layouts Directory

- Place all layouts under `core/layout/`
- Used for global or multi-page shared layouts (e.g., `main-layout`, `admin-layout`, `auth-layout`)
- Each layout component also follows the three-file separation (ts/html/scss)
- For complex layouts, group related files in subfolders

```plaintext
core/
  └── layout/
        ├── main-layout/
        ├── admin-layout/
        └── auth-layout/
```

---

## 4. Assets & Environments Directory Details

### Assets
- **Required:** Single source for all static resources
- Recommended subfolders: `images/`, `icons/`, `fonts/`, `i18n/`, etc. for maintainability
- CLI/Vite will automatically process and bundle assets

```plaintext
assets/
  ├── images/
  ├── icons/
  ├── fonts/
  └── i18n/
```

### Environments
- **Required:** Manages settings for multiple deployment environments
- Default: `environment.ts`, `environment.prod.ts`
- **All environment variables must be retrieved via these files – never hardcode in code**

```plaintext
environments/
  ├── environment.ts
  └── environment.prod.ts
```

---

## 5. Naming Conventions

- Component, Service, Directive: Filename **must** use `.component.ts`, `.service.ts`, `.directive.ts`
- Pipe, Guard, Interceptor, Module: Must have a suffix joined by a hyphen, e.g., `auth-guard.ts`
- **All folder and file names use kebab-case**
- **PascalCase** for types, classes, components (`UserProfileComponent`)
- **camelCase** for variables and functions
- **UPPER_SNAKE_CASE** for constants
- Suffix for Angular artifacts: `.component.ts`, `.service.ts`, `.pipe.ts`, `.directive.ts`, `.guard.ts`, `.interceptor.ts`, etc.
- Test files named `.spec.ts` and placed next to source files

---

## 6. Feature-First & Standalone Principles

- Each feature/domain folder must be fully self-contained (pages, components, services, models, routes, signals/store, etc.)
- **Favor Standalone Components to reduce NgModule usage**
- Avoid excessive use of NgModules; prefer standalone architecture

---

## 7. State Management & Signals

- Use `signal()`, `computed()`, `effect()` for local state
- Prefer `input()`, `input.required()` over `@Input()`
- Prefer `output()` over `@Output()`
- Use `linkedSignal()` for two-way input binding
- Use signals for all local component state; **do not use class properties for state**
- Always use signals/store in feature folders

---

## 8. Dependency Injection

- Always use the `inject()` function – **do not use constructor injection**
- Use `inject()` for Angular services (`ActivatedRoute`, `ChangeDetectorRef`, etc.)

---

## 9. Routing

- Use `loadComponent()` for lazy routes (**no NgModule-based routing**)
- Use `withComponentInputBinding()` in `provideRouter()`
- Use `input()` signals to receive route parameters
- Access query params via `inject(ActivatedRoute)`
- Structure route files within feature folders

---

## 10. HttpClient & Resource API

- Prefer `resource()` / `httpResource()` for data fetching
- Always define `request()` and `loader()` in `resource()`
- Use signals to provide input for resources
- **Do not subscribe() in components**; always use reactive data flows

---

## 10.1. Mock Data and API Switching

- **All feature services must support a one-click switch between mock data and real API.**
- Each service should define:
    ```typescript
    private useMockData = true; // Set to false to use real API
    ```
- **All public CRUD methods** (list, get, add, update, delete, etc.) **must use `if (this.useMockData)` to select mock or API branch**.
    - Example:
      ```typescript
      getList(params: QueryParams): Observable<Entity[]> {
        if (this.useMockData) {
          // Return mock Observable data here
          return of(this.mockList).pipe(delay(300));
        }
        // Call real API here
        return this.http.get<Entity[]>('/api/entity', { params });
      }
      ```
- Switching the flag in one place (`useMockData = false`) immediately switches all CRUD operations for that service to the real API, and vice versa.
- The flag can be refactored to use an `environment` variable or global config for large projects.

---

## 11. SCSS @use Instead of @import

- **All SCSS must use the modern `@use` syntax instead of `@import`.**
    - Example:
      ```scss
      // Instead of:
      // @import 'variables';
      // Use:
      @use 'variables' as *;
      ```
- **Never use `@import` in new code**; update all legacy files to `@use` progressively.
- Shared SCSS resources (e.g., `_variables.scss`, `_mixins.scss`) should be placed under `src/styles/` and imported using `@use`.

---

## 12. Testing & Test Files

- Test files should be placed in the same directory as the source file, with the suffix `.spec.ts`
- Tests should cover components, services, pipes, etc.
- File structure should mirror the source structure for easy navigation
- Use `TestBed` to configure testing modules
- Use `ComponentFixture` to access/query DOM
- Use `fakeAsync()` and `tick()` for async test logic
- Use `HttpClientTestingModule` and `HttpTestingController` for HTTP mocking
- Prefer `toHaveBeenCalledWith()` assertions

---

## 13. Coding Style & Control Flow

- Use modern Angular control flow: `@if`, `@for`, `@defer`
- **Do not use** `*ngIf`, `*ngFor`
- Always set `ChangeDetectionStrategy.OnPush` on all components
- Avoid `ngClass`/`ngStyle`; use `[class]`/`[style]` binding
- Use `FormBuilder` and reactive forms; avoid template-driven forms
- Keep folder structure flat and clear—avoid deep nesting

---

## 14. Images & Optimization

- Always use `NgOptimizedImage` for static images; **do not use plain `<img>`**
- Manage all static resources via `assets/`

---


## 15. Shared Components Usage

- **If a shared component, pipe, or utility already exists in `src/app/shared/` or a global library, you must use it directly instead of creating a new duplicate.**
    - **Always check `shared/components/`, `shared/pipes/`, and `shared/utils/` before building any new UI component or helper.**
    - **Do not re-invent or duplicate components like Table, Modal, Badge, Button, etc.**
    - **If the existing shared component does not meet your requirements, propose an extension or improvement, rather than making a separate copy.**
    - The team should always prefer using and improving shared resources to keep code DRY and maintainable.

---

## 16. Practices to Avoid

- **Do not** create technology-layer folders (e.g., `components/`, `services/`) at the root—always organize by feature/domain
- **Do not** place any business logic in `shared/`; only UI, pipes, or utilities are allowed
- Avoid excessive NgModule usage; prefer Standalone Components
- **Do not** hardcode environment variables in code
- **Avoid** using class/id selectors in HTML to override styles
- **Do not** use inline styles unless absolutely necessary

---

## 17. Additional Recommendations

- **Always** use Angular CLI/Vite generators (schematics) to create components, services, etc.
- Regularly refactor and clean up unused files or components
- Optionally, add a brief `README.md` in each feature/core area to explain responsibilities

---

## 18. Do's and Don'ts Summary Table

| ✅ Do                                   | ❌ Don't                               |
| --------------------------------------- | --------------------------------------- |
| signals, input()/output()               | class properties, @Input(), @Output()   |
| inject()                                | constructor injection                   |
| loadComponent()                         | loadChildren()                          |
| resource()/httpResource()               | subscribe() in components               |
| @if/@for                                | *ngIf/*ngFor                            |
| NgOptimizedImage                        | plain <img> (no optimization)           |
| FormBuilder/Reactive Form               | template-driven form                    |
| Small, focused components               | Large, monolithic components            |
| Clear naming conventions                | Inconsistent naming                     |
| Three-file component separation         | Inline templates/styles (unless trivial)|
| Use assets/ for all static resources    | Spread static files in app/             |
| Feature-first folder organization       | Technology-first root folders           |
| Use CLI/Vite generators                 | Manual file creation with inconsistent style |
| `@use` SCSS syntax                      | `@import` SCSS syntax                   |
| One-click mock/API switch in services   | Hardcoded/mock scattered                |

---

## 19. Official References

- [Angular LLM Guidelines](https://angular.dev/llms)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Routing](https://angular.dev/guide/router)
- [HttpClient Resource API](https://angular.dev/api/common/http/httpResource)

---

## 20. Notes

- Applies to all Angular 19+ projects, team onboarding, and LLM generation scenarios
- Can be extended with feature-specific instructions
- For special project rules, add supplemental instructions in the respective feature folder

---
```