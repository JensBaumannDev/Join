import { Routes } from '@angular/router';
import { Summary } from './pages/summary/summary';
import { Board } from './pages/board/board';
import { AddTask } from './pages/add-task/add-task';
import { Contacts } from './pages/contacts/contacts';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';
import { LegalNotice } from './pages/legal-notice/legal-notice';
import { Help } from './pages/help/help';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'summary', component: Summary },
  { path: 'board', component: Board },
  { path: 'add-task', component: AddTask },
  { path: 'contacts', component: Contacts },
  { path: 'privacy-policy', component: PrivacyPolicy },
  { path: 'legal-notice', component: LegalNotice },
  { path: 'help', component: Help },
];
