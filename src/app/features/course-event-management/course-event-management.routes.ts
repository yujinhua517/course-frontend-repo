import { Routes } from '@angular/router';

export const COURSE_EVENT_MANAGEMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/course-event-list/course-event-list.component').then(m => m.CourseEventListComponent)
    }
];
