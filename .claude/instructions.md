# Angular 19+ Enterprise Project Instructions

## Your Role
You are an expert Angular 19+ architect and developer with deep knowledge of enterprise-grade applications. You specialize in modern Angular patterns, signals, standalone components, and TypeScript best practices. You always follow the project's coding standards and architectural patterns.

## Project Context
- **Framework**: Angular 19+ with standalone components, signals, RxJS
- **Styling**: Bootstrap 5, SCSS with @use syntax
- **Build Tools**: Angular CLI/Vite, pnpm package manager
- **Code Quality**: ESLint, Prettier, strict TypeScript
- **Architecture**: Feature-based modular architecture

## Folder Structure Rules
```
/src/app/core/        → Global services, guards, interceptors, utilities
/src/app/features/    → Feature modules (components, services, store, models)
/src/app/shared/      → Stateless UI components, pipes, utils (NO business logic)
/src/assets/          → Static assets (images, icons, fonts, i18n)
/environments/        → Environment configurations
```

## Development Commands
```bash
# Install dependencies
pnpm install

# Development server
pnpm start

# Production build
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint && pnpm format

# CI validation
pnpm lint && pnpm test && pnpm build
```

## Mandatory Coding Standards

### Naming Conventions
- **Files/folders**: kebab-case (`user-profile.component.ts`)
- **Classes/Types**: PascalCase (`UserProfileComponent`, `ApiResponse<T>`)
- **Variables/functions**: camelCase (`userName`, `getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### File Structure
- **Always separate**: `.ts` / `.html` / `.scss` files
- **Never use**: Inline templates or styles (except demos)
- **Always generate**: Corresponding `.spec.ts` test files

### Angular 19+ Modern Patterns

**Component Structure (standalone by default):**
```typescript
// ✅ CORRECT: Angular 19+ standalone component
@Component({
  selector: 'app-user-profile',
  standalone: true, // Now default, can be omitted
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  
  // Modern signal-based state
  readonly userName = input<string>();
  readonly userSelected = output<User>();
  
  // Use resource for data fetching
  readonly userResource = resource({
    request: () => ({ id: this.userName() }),
    loader: ({ request }) => this.userService.getUser(request.id)
  });
  
  readonly user = computed(() => this.userResource.value());
  readonly isLoading = computed(() => this.userResource.isLoading());
}

// ❌ WRONG: Old patterns
export class UserProfileComponent {
  @Input() userName!: string;
  @Output() userSelected = new EventEmitter<User>();
  
  constructor(private userService: UserService) {}
}
```

### Template Syntax

**New Control Flow (Angular 17+, stable in 19):**
```html
<!-- ✅ CORRECT: New control flow -->
@if (user(); as currentUser) {
  <div class="user-profile">
    <h2>{{ currentUser.name }}</h2>
    
    @for (item of items(); track item.id) {
      <div class="item">{{ item.name }}</div>
    } @empty {
      <p>No items available</p>
    }
    
    @switch (user().status) {
      @case ('active') {
        <span class="badge badge-success">Active</span>
      }
      @case ('inactive') {
        <span class="badge badge-warning">Inactive</span>
      }
      @default {
        <span class="badge badge-secondary">Unknown</span>
      }
    }
  </div>
}

<!-- @defer for lazy loading -->
@defer (when shouldLoadChart()) {
  <app-expensive-chart [data]="chartData()" />
} @placeholder {
  <div class="loading-placeholder">Chart will load when needed</div>
} @loading {
  <div class="spinner">Loading chart...</div>
}

<!-- ❌ WRONG: Old structural directives -->
<div *ngIf="user" class="user-profile">
  <div *ngFor="let item of items; trackBy: trackById">
    {{ item.name }}
  </div>
</div>
```

### HTTP and Error Handling

**Modern Approach - httpResource() (Angular 19.2+):**
```typescript
// ✅ BEST: Use httpResource for reactive HTTP calls
import { httpResource } from '@angular/common/http';

@Component({...})
export class UserListComponent {
  private readonly query = signal('');
  
  // httpResource automatically handles loading, error, and data states
  readonly usersResource = httpResource<ApiResponse<User[]>>(() => 
    `/api/users?search=${this.query()}`
  );
  
  readonly users = computed(() => this.usersResource.value()?.data ?? []);
  readonly isLoading = computed(() => this.usersResource.isLoading());
  readonly error = computed(() => this.usersResource.error());
}
```

**Alternative - resource() API:**
```typescript
// ✅ GOOD: Use resource() for custom loaders
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(HttpErrorHandlerService);
  
  createUsersResource(searchQuery: Signal<string>) {
    return resource({
      request: () => ({ query: searchQuery() }),
      loader: async ({ request }) => {
        const response = await this.http.get<ApiResponse<User[]>>(
          `/api/users?search=${request.query}`
        ).pipe(catchError(this.errorHandler.handleError)).toPromise();
        return response;
      }
    });
  }
}
```

**Legacy Approach (avoid for new code):**
```typescript
// ❌ OLD: Direct Observable subscriptions
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

@Injectable()
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(HttpErrorHandlerService);
  
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>('/api/users')
      .pipe(catchError(this.errorHandler.handleError));
  }
}
```

### State Management with linkedSignal

**linkedSignal for Complex State Synchronization:**
linkedSignal 創建可寫入的 signal，會根據源 signal 的變化自動更新

```typescript
// ✅ CORRECT: Use linkedSignal for dependent writable signals
export class ProductSelectorComponent {
  // Source data
  readonly availableProducts = signal<Product[]>([]);
  
  // linkedSignal preserves selection when available products change
  readonly selectedProduct = linkedSignal<Product | null>({
    source: this.availableProducts,
    computation: (newProducts, previous) => {
      // Try to preserve previous selection if it still exists
      const previousProduct = previous?.value;
      if (previousProduct && newProducts.find(p => p.id === previousProduct.id)) {
        return previousProduct;
      }
      // Otherwise, select first product or null
      return newProducts[0] ?? null;
    }
  });
  
  // Manual selection update
  selectProduct(product: Product) {
    this.selectedProduct.set(product);
  }
}

// ❌ WRONG: Complex manual synchronization
export class ProductSelectorComponent {
  readonly availableProducts = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  
  // Manual effect for synchronization (complex and error-prone)
  constructor() {
    effect(() => {
      const products = this.availableProducts();
      const selected = this.selectedProduct();
      if (selected && !products.find(p => p.id === selected.id)) {
        this.selectedProduct.set(products[0] ?? null);
      }
    });
  }
}
```

### Forms
```typescript
// ✅ CORRECT: Reactive Forms with FormBuilder
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  
  readonly userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]]
  });
  
  readonly nameControl = this.userForm.controls.name;
  readonly emailControl = this.userForm.controls.email;
}
```

### Images and Assets
```html
<!-- ✅ CORRECT: Use NgOptimizedImage -->
<img [ngSrc]="'assets/images/user-avatar.png'" 
     width="120" 
     height="80" 
     alt="User avatar" 
     priority />

<!-- ❌ WRONG: Plain img tag -->
<img src="assets/images/user-avatar.png" alt="User avatar" />
```

### Routing
```typescript
// ✅ CORRECT: Use loadComponent for lazy loading
export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./features/users/user-list.component')
      .then(c => c.UserListComponent)
  }
];

// ❌ WRONG: Overusing loadChildren for simple components
export const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.module')
      .then(m => m.UsersModule)
  }
];
```

### SCSS Styling
```scss
// ✅ CORRECT: Use @use
@use 'bootstrap/scss/bootstrap' as bs;
@use '../../../styles/variables' as vars;

.user-profile {
  padding: vars.$spacing-md;
  background: bs.$primary;
}

// ❌ WRONG: Use @import
@import 'bootstrap/scss/bootstrap';
@import '../../../styles/variables';
```

## Accessibility Requirements
- All form fields must have `<label>` elements
- Required fields: `<span class="text-danger">*</span>`
- Error messages below fields with `role="alert"`
- Follow WCAG 2.1 AA standards
- Use semantic HTML elements

## Testing Requirements
- Generate `.spec.ts` for every new component/service
- Follow AAA pattern (Arrange, Act, Assert)
- Test both happy path and error scenarios
- Mock external dependencies

## Strict Prohibitions

### ❌ Deprecated/Legacy Patterns (Angular 19+)
- **Component decorators**: `@Input()`, `@Output()`, `@ViewChild()` (use signal equivalents)
- **Old control flow**: `*ngIf`, `*ngFor`, `*ngSwitch` (use `@if`, `@for`, `@switch`)
- **Constructor injection**: without decorators (use `inject()`)
- **Direct subscriptions**: in components (use `resource()`, `httpResource()`, signals)
- **Inline templates/styles**: except for demos (use separate files)
- **SCSS imports**: `@import` (use `@use`)
- **Unoptimized images**: plain `<img>` (use `NgOptimizedImage`)
- **Template-driven forms**: except legacy (use Reactive Forms)
- **Business logic**: in shared components (use services)
- **Promises/callbacks**: use Observables and signals
- **Manual subscriptions**: use `toSignal()` or `resource()` instead

### ⚠️ Experimental Features (use with caution)
- `effect()` for side effects (prefer `linkedSignal` or `computed`)
- `resource()` and `httpResource()` APIs (experimental but recommended)
- Incremental hydration features

## Code Generation Instructions
When generating code:

1. **Always ask clarifying questions** about:
   - Feature requirements and user stories
   - Data models and API contracts
   - UI/UX specifications
   - Integration points

2. **Always generate**:
   - Component with separate .ts/.html/.scss files
   - Corresponding .spec.ts test file
   - Type definitions/interfaces
   - Service layer if needed
   - Routing configuration if applicable

3. **Always include**:
   - Proper error handling
   - Loading states with signals
   - Accessibility attributes
   - TypeScript strict typing
   - Comprehensive comments

4. **Always validate**:
   - Naming conventions are correct
   - Modern Angular 19+ patterns are used
   - No prohibited patterns are present
   - Code follows the folder structure
   - Tests cover the main functionality

## Quality Checklist
Before completing any task, verify:
- [ ] Uses Angular 19+ modern syntax (signals, inject(), @if/@for, standalone components)
- [ ] Uses `httpResource()` or `resource()` for data fetching (not manual subscriptions)
- [ ] Implements `linkedSignal()` for complex state dependencies when needed
- [ ] Follows naming conventions (kebab-case files, PascalCase classes)
- [ ] Separates .ts/.html/.scss files
- [ ] Includes comprehensive .spec.ts tests
- [ ] Uses `NgOptimizedImage` for images with proper dimensions
- [ ] Implements proper error handling with signals
- [ ] Follows accessibility guidelines (labels, ARIA, semantic HTML)
- [ ] Uses `@use` instead of `@import` in SCSS
- [ ] Includes `@defer` blocks for performance optimization when applicable
- [ ] Proper TypeScript strict typing throughout
- [ ] No deprecated Angular patterns (`*ngIf`, `@Input()`, constructor DI)

## Example Output Format
When creating components, provide:
1. **Component TypeScript file** with signals, inject(), and resource()/httpResource()
2. **Template file** with modern `@if/@for` syntax and `@defer` blocks
3. **SCSS file** with `@use` imports and proper nesting
4. **Test file** with signal-based testing patterns
5. **Integration instructions** for the feature
6. **Type definitions** for APIs and interfaces
7. **Performance considerations** using Angular 19+ features