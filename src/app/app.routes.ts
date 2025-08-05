import { Routes } from '@angular/router';
import { PermissionGuard } from './core/auth/permission.guard';
import { LOGIN_ROUTES } from './features/login/login.routes';
import { RoleName, PermissionName } from './models/user.model';

export const routes: Routes = [
  {
    path: 'login',
    children: LOGIN_ROUTES
  },
  {
    path: '',
    canActivate: [PermissionGuard],
    data: { requireAuth: true }, // 需要認證但不需要特定權限
    loadComponent: () => import('./features/main/components/main-page.component').then(m => m.MainPageComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/main/components/home-page/home-page.component').then(m => m.HomePageComponent)
      },
      {
        path: 'home',
        loadComponent: () => import('./features/main/components/home-page/home-page.component').then(m => m.HomePageComponent)
      },
      {
        path: 'demo',
        loadComponent: () => import('./features/demo/demo-page.component').then(m => m.DemoPageComponent)
      },
      {
        path: 'competency',
        canActivate: [PermissionGuard],
        data: { permissions: [PermissionName.COMPETENCY_READ] },
        loadComponent: () => import('./features/competency-management/pages/competency-list/competency-list.component').then(m => m.CompetencyListComponent)
      },
      {
        path: 'job-role',
        canActivate: [PermissionGuard],
        data: {
          //roles: [RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPERVISOR, RoleName.USER],
          permissions: [PermissionName.JOBROLE_READ]
        },
        loadComponent: () => import('./features/job-role-management/pages/job-role-list/job-role-list.component').then(m => m.JobRoleListComponent)
      },
      {
        path: 'employee',
        canActivate: [PermissionGuard],
        data: { permissions: [PermissionName.EMPLOYEE_READ] },
        loadComponent: () => import('./features/employee-management/pages/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'department',
        canActivate: [PermissionGuard],
        data: {
          // roles: [RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPERVISOR, RoleName.USER],
          permissions: [PermissionName.DEPARTMENT_READ]
        },
        loadComponent: () => import('./features/department-management/pages/department-list/department-list.component').then(m => m.DepartmentListComponent)
        //loadComponent: () => import('./features/department-management/pages/department-list/department-list-refactored.component').then(m => m.DepartmentListRefactoredComponent)
      },
      // 你也可以在這裡加更多 child page
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: '/' // 未匹配路由重定向到首頁，讓 PermissionGuard 處理認證邏輯
  }
];
