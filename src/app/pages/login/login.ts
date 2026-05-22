import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

/** Page component representing the User Login interface */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterLink, RouterLinkActive],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  /** FormBuilder helper instance */
  private fb = inject(FormBuilder);
  /** Service managing authentication state */
  private authService = inject(AuthService);
  /** Injected Router for redirecting post-authentication */
  private router = inject(Router);

  /** Signal to toggle visibility of input password text */
  showPassword = signal(false);
  /** Signal indicating authentication failure state */
  loginError = signal(false);
  /** Signal control state for the splash screen entry animation */
  splashDone = signal(false);

  /** Sets a timeout to complete the logo splash screen entry */
  ngOnInit(): void {
    setTimeout(() => this.splashDone.set(true), 1000);
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
    if (this.form.invalid) return;
    this.loginError.set(false);

    const { email, password } = this.form.value;
    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/summary']);
    } catch {
      this.loginError.set(true);
      ['email', 'password'].forEach(controlName => {
        const ctrl = this.form.get(controlName);
        ctrl?.setErrors({ loginError: true });
        ctrl?.markAsTouched();
      });
    }
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
    try {
      await this.authService.login('guest@join.com', 'guest123');
      this.router.navigate(['/summary']);
    } catch {
      this.loginError.set(true);
    }
  }
}
