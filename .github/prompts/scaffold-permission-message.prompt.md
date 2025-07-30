---
mode: 'agent'
model: Claude Sonnet 4
tools: ['codebase', 'editFiles']
description: 'Scaffold Global Permission Guard and Global Notification/Message System for Angular 19+'
---

# Scaffold Global Permission Control & Global Message Notification (Angular 19+ Standard)

## Step 1: Create Permission Guard (Role/Access Control)

- Under `/src/app/core/auth/`, create:
  - `permission.guard.ts`
    - Implements Angular Route Guard, supports canActivate/canLoad
    - Allows checking for user roles (roles), permissions, or API-returned claims to intercept navigation
    - Reads user info from `/src/app/core/auth/user.store.ts` or JWT by default
    - All permissions and route metadata must use strict types (enum/type)
    - If insufficient permission, auto-redirect to login or a no-access page, and trigger a global message

- `user.store.ts`
  - Define types/interfaces for User, Role, Permission (strictly typed)
  - Use Angular signal/store to provide current user info, roles, permission list (can start as mock, later support API)

- All main feature routes must be able to declare required permissions (e.g., data: { roles: ['ADMIN', 'MANAGER'] })
- Example: add canActivate: [PermissionGuard] to app.routes.ts

---

## Step 2: Global Message / Notification System

- Under `/src/app/shared/` or `/src/app/core/message/`, create:
  - `global-message.service.ts`
    - Provides global message push API (`success`, `info`, `error`, `warning`)
    - Uses RxJS Subject/BehaviorSubject or signal for message stream
    - Supports message timeout, auto-dismiss, and queue/stack

  - `global-message.component.ts/.html/.scss`
    - Standalone component, three-file separation
    - Acts as a Snackbar/Toast or global bar, styled with Bootstrap, uses icons
    - Supports close button, ARIA labels, tab focus
    - All message types (info, success, error, warning) should use matching Bootstrap icons and colors (from variables)
    - Supports multiple queued messages

- Insert `<app-global-message />` directly into `app.component.html` to ensure global visibility

---

## Step 3: Type Definitions & Testing

- All types (User, Role, Permission, Message) must be defined as interface/enum in `/src/app/models/` and use strict mode
- All guards, services, and components should have basic `.spec.ts` tests for core logic (e.g., permission checks, message pushes, UI display/interactivity)

---

## Step 4: README & Usage Documentation

- Generate a `README.md` describing:
  - How to add permission checks to routes
  - How to use the message service to push notifications
  - How to access user info and permissions in features/pages

---

## Step 5: Reusability & Maintenance Tips

- Permission guard and message service should be singleton services, shared globally
- All message UI supports i18n (pipe/resource)
- Designed to be easily shared across all feature prompts (place under `core/` or `shared/` for import everywhere)
- Message component can be dynamic/portal for easy embedding anywhere

---

## Checklist

[] Permission guard can intercept routes by role/permission
[] Global notification can be triggered from any component/page
[] Strict types, no any, easy to extend
[] SCSS/HTML uses BEM or project convention
[] Unit tests and usage examples included
[] README documents integration and best practices

---

## Example Usage

- In route definition:

  ```typescript
  {
    path: 'admin',
    canActivate: [PermissionGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('...')
  }
```