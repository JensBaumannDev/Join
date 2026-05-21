import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { Toast } from './components/toast/toast';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');
  private router = inject(Router);
  readonly authService = inject(AuthService);
  isAuthResolved = computed(() => this.authService.isAuthResolved());
  isFullBleed = signal(false);
  isLoginPage = signal(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isFullBleed.set(false);
      this.isLoginPage.set(event.urlAfterRedirects === '/login' || event.urlAfterRedirects === '/signup');
    });
  }
}
