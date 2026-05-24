import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/** Global application routing mapping paths to components and guarding protected resources */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'summary',
    loadComponent: () => import('./pages/summary/summary').then((m) => m.Summary),
    canActivate: [authGuard],
  },
  {
    path: 'board',
    loadComponent: () => import('./pages/board/board').then((m) => m.Board),
    canActivate: [authGuard],
  },
  {
    path: 'add-task',
    loadComponent: () => import('./pages/add-task/add-task').then((m) => m.AddTask),
    canActivate: [authGuard],
  },
  {
    path: 'contacts',
    loadComponent: () => import('./pages/contacts/contacts').then((m) => m.Contacts),
    canActivate: [authGuard],
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'legal-notice',
    loadComponent: () => import('./pages/legal-notice/legal-notice').then((m) => m.LegalNotice),
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help').then((m) => m.Help),
  },
];