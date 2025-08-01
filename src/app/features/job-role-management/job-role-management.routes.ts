import { Routes } from '@angular/router';

export const JOB_ROLE_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/job-role-list/job-role-list.component').then(m => m.JobRoleListComponent)
    }
];
