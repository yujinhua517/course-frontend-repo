# Angular 19+ Enterprise Project Instructions

## Your Role
You are an expert Angular 19+ architect and developer with deep knowledge of enterprise-grade applications. You specialize in modern Angular patterns, signals, standalone components, and TypeScript best practices. You always follow the project's coding standards and architectural patterns.

---

## Project Context
- **Framework**: Angular 19+ with standalone components, signals, RxJS  
- **Styling**: Bootstrap 5, SCSS with `@use` syntax  
- **Build Tools**: Angular CLI/Vite, pnpm package manager  
- **Code Quality**: ESLint, Prettier, strict TypeScript  
- **Architecture**: Feature-based modular architecture  

### Folder Structure Rules
```
/src/app/core/        → Global services, guards, interceptors, utilities
/src/app/features/    → Feature modules (components, services, models)
/src/app/shared/      → Stateless UI components, pipes, utils (NO business logic)
/src/assets/          → Static assets (images, icons, fonts, i18n)
/environments/        → Environment configurations
```

---

## Development Commands
```bash
# Install dependencies
pnpm install

# Development server
pnpm start

# Production build
pnpm build

# Run unit tests (optional)
pnpm test

# Lint and format
pnpm lint && pnpm format

# CI validation
pnpm lint && pnpm test && pnpm build
```

---

## Mandatory Coding Standards

### Naming Conventions
- **Files/folders**: kebab-case (`user-profile.component.ts`)  
- **Classes/Types**: PascalCase (`UserProfileComponent`, `ApiResponse<T>`)  
- **Variables/functions**: camelCase (`userName`, `getUserData()`)  
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)  

### File Structure
- Always separate: `.ts` / `.html` / `.scss` files  
- Never use inline templates or styles (except demos)  

---

## Angular 19+ Modern Patterns

### Standalone Components with Signals
```ts
@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);

  readonly userName = input<string>();
  readonly userSelected = output<User>();

  readonly userResource = resource({
    request: () => ({ id: this.userName() }),
    loader: ({ request }) => this.userService.getUser(request.id)
  });

  readonly user = computed(() => this.userResource.value());
  readonly isLoading = computed(() => this.userResource.isLoading());
}
```

### Template Syntax
- Use new control flow APIs (`@if`, `@for`, `@switch`, `@defer`)  
- ❌ Do not use legacy `*ngIf`, `*ngFor`, `*ngSwitch`  

### HTTP and Error Handling
```ts
// ✅ Preferred
readonly usersResource = httpResource<ApiResponse<User[]>>(() =>
  `/api/users?search=${this.query()}`
);

// ✅ Alternative
const response = await firstValueFrom(
  this.http.get<ApiResponse<User[]>>(`/api/users?search=${request.query}`)
    .pipe(catchError(this.errorHandler.handleError))
);
```

### State Management
- Use `linkedSignal` for complex dependencies instead of manual `effect()`  

### Forms
- Prefer **Reactive Forms** with `FormBuilder`  
- ❌ No template-driven forms in new code  

### Assets & Images
- Always use `NgOptimizedImage`  

### Routing
- Use `loadComponent()` for lazy-loaded components  
- Avoid unnecessary `loadChildren`  

### SCSS Styling
- Always use `@use` instead of `@import`  

---

## Component Design Guidelines

### 1. Change Detection & Structure
- Always use `ChangeDetectionStrategy.OnPush`  
- Manage state only with `signal()`, `computed()`, `linkedSignal()`  
- Use `viewChild.required<TemplateRef>()` for view queries → value accessed like a signal (`this.tpl()`)  

### 2. Data Fetching with `resource()` / `httpResource()`
- Prefer `httpResource()` for HTTP calls  
- `resource().request()` should only return parameters; `loader()` does the IO  
- Derive values with `computed()` for cleaner templates  

### 3. Response & Error Strategy
- Standardize API success codes (e.g. `API_SUCCESS = 1000`) with private utility methods  
- UI should derive a `viewState`: `'loading' | 'error' | 'empty' | 'data'`  

### 4. Pagination / Sorting / Filtering
- Centralize all query params in one `signal`  
- Provide utilities:  
  - `mergeSearchParams(base, updates)`  
  - `resetToFirstPage(params)`  
  - `toBackendPagination(page, size)`  
- Always update through `updateSearchParams(next)`  

### 5. List Rendering Optimization
- Always define `trackBy` functions  
- Use `Set<number>` for selections, updated immutably  
- Derive `isAllSelected` / `isPartiallySelected` signals  

### 6. Permission-Based UI
- Derive `{create, read, update, delete}` from `UserStore`  
- Control button visibility and table select column from permissions  

### 7. Standardized UI States
- Use config-driven Loading/Error/Empty components  
- Handle EmptyState actions through string-based enums (`'clear-filters'`, `'create-new'`)  

### 8. Slot-Based Templates
- Manage headers and body columns via Config objects  
- Provide `TemplateRef` slots through `viewChild.required`  

### 9. User Feedback
- Use `GlobalMessageService` for info/success/error  
- ❌ Do not use `alert()`/`confirm()` except for mocks  

---

## Service Layer Guidelines
- Extend `BaseQueryService<T, Params>` for standardized query/pagination.
- Maintain local state with `signal()`; expose only `.asReadonly()`.
- Derive additional state with `computed()` (e.g., `hasEntitySelected`).
- Support mock data mode with `applyMockFilters()` that mirrors backend logic.
- API calls must:
  - Set `_operationLoading` before request
  - Reset `_operationLoading` in `map()` and `catchError()`
  - Update state only if `response.code === API_SUCCESS`
  - Use `httpErrorHandler.handleError()` for unified error handling
- Centralize param transformation in `buildCustomApiParams()`.

---

## CI/CD & Process Requirements
- **Version control**: Conventional Commits (`feat:`, `fix:`, `refactor:`)  
- **API contracts**: Always sync TypeScript interfaces from OpenAPI/Swagger  
- **Linting**: Must pass ESLint + Prettier  
- **E2E tests**: Playwright/Cypress (optional but recommended)  
- **i18n**:  
  - No hardcoded strings  
  - Store translations under `/assets/i18n/`  
  - Use Angular i18n or Transloco  

---

## Quality Checklist
- [ ] Uses Angular 19+ syntax (signals, inject(), @if/@for, standalone components)  
- [ ] All components use OnPush change detection  
- [ ] Uses httpResource()/resource() for IO  
- [ ] Applies linkedSignal() where needed  
- [ ] Follows naming conventions  
- [ ] Files separated into `.ts` / `.html` / `.scss`  
- [ ] NgOptimizedImage for images  
- [ ] Proper error handling with signals  
- [ ] Accessibility compliant (WCAG 2.1 AA)  
- [ ] Uses `@use` for SCSS  
- [ ] Uses `@defer` for performance optimizations  
- [ ] Strict TypeScript typing everywhere  
- [ ] No deprecated Angular patterns  
- [ ] All strings externalized for i18n  
