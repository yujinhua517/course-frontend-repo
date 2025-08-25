import { Routes } from '@angular/router';

export const COURSE_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/course-list.component').then(m => m.CourseListComponent)
    }
];
