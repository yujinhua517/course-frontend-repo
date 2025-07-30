import { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  }
];
