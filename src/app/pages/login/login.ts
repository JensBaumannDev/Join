import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/** Page component representing the User Login interface */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterLink, RouterLinkActive],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {
  /** FormBuilder helper instance */
  private fb = inject(FormBuilder);
  /** Service managing authentication state */
  private authService = inject(AuthService);
  /** Injected Router for redirecting post-authentication */
  private router = inject(Router);
  // Subscription for router navigation events (for splash animation)
  private routerSub?: Subscription;

  /** Signal to toggle visibility of input password text */
  showPassword = signal(false);
  /** Signal indicating authentication failure state */
  loginError = signal(false);
  /** Signal control state for the splash screen entry animation */
  splashDone = signal(false);
  /** Signal indicating if the animation is running */
  isAnimating = signal(false);
  /** Signal tracking active authentication request loading states */
  loading = signal(false);

  /** Sets a timeout to complete the logo splash screen entry, or skips animation if coming from signup */
  ngOnInit(): void {
    this.triggerAnimation();

    this.routerSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects === '/') {
        this.triggerAnimation();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private triggerAnimation(): void {
  this.resetScrollPosition();

  if (this.shouldSkipAnimation()) {
    this.skipToFinishedState();
    return;
  }

  this.runLogoAnimation();
}

private resetScrollPosition(): void {
  const content = document.querySelector('.content') as HTMLElement;
  if (content) {
    content.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}

private shouldSkipAnimation(): boolean {
  return !!sessionStorage.getItem('skipLogoAnimation');
}

private skipToFinishedState(): void {
  this.splashDone.set(true);
  sessionStorage.removeItem('skipLogoAnimation');
}

private runLogoAnimation(): void {
  this.isAnimating.set(false);
  this.splashDone.set(false);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    this.isAnimating.set(true);
    
    setTimeout(() => this.splashDone.set(true), 50);
    setTimeout(() => this.isAnimating.set(false), 1250);
  }));
}

  /** Reactive login validation form configuration */
  form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: ['', Validators.required],
  });

  /** Toggles the password field type between password and text */
  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  /** Submits login credentials and routes to dashboard summary on success */
  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.loginError.set(false);

    try {
      const { email, password } = this.form.value;
      await this.authService.login(email!, password!);
      this.router.navigate(['/summary']);
    } catch {
      this.setLoginErrors();
    } finally {
      this.loading.set(false);
    }
  }

  /** Sets error states on form controls after a failed login attempt */
  private setLoginErrors(): void {
    this.loginError.set(true);
    ['email', 'password'].forEach(controlName => {
      const ctrl = this.form.get(controlName);
      ctrl?.setErrors({ loginError: true });
      ctrl?.markAsTouched();
    });
  }

  /** Clears the validation error styles and active error flags on the controls */
  clearLoginError(): void {
    this.loginError.set(false);
    ['email', 'password'].forEach(controlName => {
      const ctrl = this.form.get(controlName);
      if (ctrl?.hasError('loginError')) {
        ctrl.setErrors(null);
      }
    });
  }

  /** Logins using default guest user credentials */
  async guestLogin(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      await this.authService.login('guest@join.com', 'guest123');
      this.router.navigate(['/summary']);
    } catch {
      this.loginError.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}