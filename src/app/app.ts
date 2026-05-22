import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { Toast } from './components/toast/toast';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';

/** Main root application component managing overall layout, routing state, and error/auth overlays */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** The browser application title */
  protected readonly title = signal('join');
  /** Injectable Router for tracking page navigation and path names */
  private router = inject(Router);
  /** Injectable AuthService resolving active logins */
  readonly authService = inject(AuthService);
  /** Computed authentication readiness state */
  isAuthResolved = computed(() => this.authService.isAuthResolved());
  /** Signal determining if components like Sidebar/Header should be hidden */
  isFullBleed = signal(false);
  /** Signal indicating if the current screen is the login/signup route */
  isLoginPage = signal(false);

  /** Configures router subscriber to toggle full-bleed layouts based on active routes */
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isFullBleed.set(false);
      this.isLoginPage.set(event.urlAfterRedirects === '/login' || event.urlAfterRedirects === '/signup');
    });
  }
}
