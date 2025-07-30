import { Routes } from '@angular/router';

export const COMPETENCY_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/competency-list/competency-list.component').then(m => m.CompetencyListComponent)
    }
];
