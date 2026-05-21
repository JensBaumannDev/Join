import { Routes } from '@angular/router';
import { Summary } from './pages/summary/summary';
import { Board } from './pages/board/board';
import { AddTask } from './pages/add-task/add-task';
import { Contacts } from './pages/contacts/contacts';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';
import { LegalNotice } from './pages/legal-notice/legal-notice';
import { Help } from './pages/help/help';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'summary', component: Summary, canActivate: [authGuard] },
  { path: 'board', component: Board, canActivate: [authGuard] },
  { path: 'add-task', component: AddTask, canActivate: [authGuard] },
  { path: 'contacts', component: Contacts, canActivate: [authGuard] },
  { path: 'privacy-policy', component: PrivacyPolicy },
  { path: 'legal-notice', component: LegalNotice },
  { path: 'help', component: Help },
];