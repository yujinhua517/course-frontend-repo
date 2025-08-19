---
applyTo: "**"
description: Complete Angular 19+ Coding, Structure, and Naming Guidelines (LLM/AI, Team Onboarding, Maintenance, Testing)
---

# Angular 19+ Team Project Copilot Instructions

## Project Overview
Enterprise-grade Angular 19+ application using feature-based architecture, standalone components, signals, and modern Angular APIs.  
Tech stack: Angular 19+, TypeScript, Bootstrap 5, RxJS, SCSS (@use), ESLint, Prettier.  
Build & development tools: Vite / Angular CLI, pnpm.

## Folder Structure
- `/src/app/core/`: Global services (HttpErrorHandlerService, DialogService, AuthService), guards, interceptors, utilities.
- `/src/app/features/`: Feature-specific components, services, store, models, pipes, pages, routes.
- `/src/app/shared/`: Stateless UI components, shared pipes, utils (no business logic allowed).
- `/src/assets/`: Static assets (images, icons, fonts, i18n).
- `/environments/`: Environment variables (dev/stage/prod).

## Build & Validation
- Node: 20.x, pnpm: 9.x, Angular CLI: 19/20.
- **Initial install**:  
  ```sh
  pnpm install
  ```
- **Development**:  
  ```sh
  pnpm start  # ng serve --configuration=development
  ```
- **Build**:  
  ```sh
  pnpm build  # ng build --configuration=production
  ```
- **Test**:  
  ```sh
  pnpm test   # ng test --watch=false
  ```
- **Lint/Format**:  
  ```sh
  pnpm lint
  pnpm format
  ```
- **Local CI validation sequence**:
  ```sh
  pnpm lint && pnpm test && pnpm build
  ```
- Common issues:
  - Type errors → Check strict settings and DTO alignment.
  - API 404 → Verify `apiUrl` in environments/*.ts.
  - Port in use → Update `angular.json` serve config.

## Coding Standards
- Naming: folders/files kebab-case, types/classes PascalCase, variables/functions camelCase, constants UPPER_SNAKE_CASE.
- Three-file separation (ts/html/scss), no inline templates/styles (except for demos).
- Always reuse shared resources; no duplicate creation.
- Business logic only in core/services or features/services, never in shared.
- All HTTP requests use `HttpErrorHandlerService`, `ApiResponse<T>` format:
  ```ts
  export interface ApiResponse<T> { code: number; message: string; data?: T; }
  ```
- Frontend camelCase ↔ backend snake_case conversion via `core/utils/object-case.util.ts`.
- Services must return Observables, no Promises/callbacks.
- **Prefer** `inject()`, only use constructor for advanced DI decorators.
- State management via signals; do not directly subscribe in components.
- All tests mirror source structure, named `.spec.ts`.

## Styling Guidelines
- Order of precedence: Bootstrap 5 → src/styles/ shared → shared → component-local styles.
- SCSS must use `@use`; `@import` is prohibited.
- No inline styles or direct HTML overrides.
- New shared SCSS must be announced to the team.

## UI & Accessibility
- Form fields must have `<label>` and placeholder; required fields use `<span class="text-danger">*</span>`.
- Error messages below the field, `role="alert"`.
- Follow WCAG 2.1 AA.
- Use Angular `NgOptimizedImage` (`[ngSrc]` directive) for images, no unoptimized native `<img>`.
  ```html
  <img [ngSrc]="'assets/images/example.png'" width="120" height="80" alt="description" />
  ```

## Routing & Data Flow
- Use `loadComponent()` in feature routing files; `loadChildren()` allowed for multi-page/group lazy loads.
- API data must use resource/httpResource with request()/loader().
- Single flag in service for mock/API toggle; disable mock before PR.
- Sorting must be three-state (asc/desc/null).

## Form Logic
- Use Reactive Form + FormBuilder; avoid template-driven forms (except legacy).
- `initializeData()` should only initialize state, not auto-fetch; fetching triggered by user.

## ✅ Do / ❌ Don’t
| ✅ Do | ❌ Don’t |
| ------ | ------ |
| signals, input()/output() | class properties, @Input(), @Output() |
| inject() | constructor (unnecessary) |
| loadComponent() | overuse loadChildren() |
| resource()/httpResource() | component subscribe() |
| @if/@for | *ngIf/*ngFor |
| NgOptimizedImage | plain `<img>` |
| Reactive Form | template-driven form |
| Small focused components | large monolithic components |
| Three-file separation | inline template/style |
| Manage assets in /assets | scatter static files |
| @use SCSS | @import SCSS |
| Shared error handling service | custom handleError in each |
| Observable with type safety | Promise/callback/any |

## Review Checklist
- Reuse shared resources first
- API response format correct, error handling unified
- Consistent naming conventions
- Correct style precedence
- Complete accessibility (label, placeholder, error, aria-*)
- Correct env vars and API paths
- Type safety, Observable usage
- State management with signals/resource/reactive flow
- Correct search/sort logic
- `.spec.ts` tests for new features
- No violations of prohibitions
- README/comments are clear

---
