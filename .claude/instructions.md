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
```typescript
// ✅ CORRECT: Use signals and inject()
@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  readonly user = signal<User | null>(null);
  readonly isLoading = signal(false);
  
  readonly userName = input<string>();
  readonly userSelected = output<User>();
}

// ❌ WRONG: Old patterns
export class UserProfileComponent {
  @Input() userName!: string;
  @Output() userSelected = new EventEmitter<User>();
  
  constructor(private userService: UserService) {}
}
```

### Template Syntax
```html
<!-- ✅ CORRECT: New control flow -->
@if (user()) {
  <div class="user-profile">
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  </div>
}

<!-- ❌ WRONG: Old structural directives -->
<div *ngIf="user" class="user-profile">
  <div *ngFor="let item of items; trackBy: trackById">
    {{ item.name }}
  </div>
</div>
```

### HTTP and Error Handling
```typescript
// ✅ CORRECT: Use HttpErrorHandlerService and ApiResponse<T>
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

### State Management
```typescript
// ✅ CORRECT: Use resource() for data fetching
export class UserListComponent {
  private readonly userService = inject(UserService);
  
  readonly usersResource = resource({
    request: () => ({}),
    loader: () => this.userService.getUsers()
  });
  
  readonly users = computed(() => this.usersResource.value()?.data ?? []);
}

// ❌ WRONG: Direct subscription in component
export class UserListComponent implements OnInit {
  users: User[] = [];
  
  ngOnInit() {
    this.userService.getUsers().subscribe(response => {
      this.users = response.data || [];
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
- ❌ `@Input()`, `@Output()`, `@ViewChild()` (use modern equivalents)
- ❌ `*ngIf`, `*ngFor` (use `@if`, `@for`)
- ❌ Constructor injection without decorators (use `inject()`)
- ❌ Direct component subscriptions (use `resource()`, signals)
- ❌ Inline templates/styles (except demos)
- ❌ `@import` in SCSS (use `@use`)
- ❌ Plain `<img>` tags (use `NgOptimizedImage`)
- ❌ Template-driven forms (use Reactive Forms)
- ❌ Business logic in shared components
- ❌ Promises or callbacks (use Observables)

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
- [ ] Uses Angular 19+ modern syntax (signals, inject(), @if/@for)
- [ ] Follows naming conventions (kebab-case files, PascalCase classes)
- [ ] Separates .ts/.html/.scss files
- [ ] Includes comprehensive .spec.ts tests
- [ ] Uses NgOptimizedImage for images
- [ ] Implements proper error handling
- [ ] Follows accessibility guidelines
- [ ] Uses @use instead of @import in SCSS
- [ ] No direct subscriptions in components
- [ ] Proper TypeScript typing throughout

## Example Output Format
When creating components, provide:
1. **Component TypeScript file** with signals and inject()
2. **Template file** with modern Angular syntax
3. **SCSS file** with @use imports
4. **Test file** with proper test coverage
5. **Integration instructions** for the feature
6. **Type definitions** if custom interfaces needed