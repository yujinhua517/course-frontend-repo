import { Routes } from '@angular/router';

export const DEPARTMENT_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/department-list/department-list.component').then(m => m.DepartmentListComponent)
    }
];
