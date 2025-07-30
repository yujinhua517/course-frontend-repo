import { Routes } from '@angular/router';

export const MAIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/main-page.component').then(m => m.MainPageComponent)
  }
];
