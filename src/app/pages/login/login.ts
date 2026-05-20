import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  loginError = signal(false);
  splashDone = signal(false);

  ngOnInit(): void {
    setTimeout(() => this.splashDone.set(true), 1000);
  }

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

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loginError.set(false);

    const { email, password } = this.form.value;
    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/summary']);
    } catch {
      this.loginError.set(true);
      this.showPassword.set(true);
      ['email', 'password'].forEach(controlName => {
        const ctrl = this.form.get(controlName);
        ctrl?.setErrors({ loginError: true });
        ctrl?.markAsTouched();
      });
    }
  }

  clearLoginError(): void {
    this.loginError.set(false);
    ['email', 'password'].forEach(controlName => {
      const ctrl = this.form.get(controlName);
      if (ctrl?.hasError('loginError')) {
        ctrl.setErrors(null);
      }
    });
  }

  async guestLogin(): Promise<void> {
    try {
      await this.authService.login('guest@join.com', 'guest123');
      this.router.navigate(['/summary']);
    } catch {
      this.loginError.set(true);
    }
  }
}
