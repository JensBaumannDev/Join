import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

/** Page component representing the User Signup / registration interface */
@Component({
    selector: 'app-signup',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterLink, RouterLinkActive, MatCheckboxModule],
    standalone: true,
    templateUrl: './signup.html',
    styleUrls: ['./signup.scss']
})
export class Signup {
        /** Toggle acceptTerms checkbox manually for custom checkbox UI */
        toggleAcceptTerms() {
            const ctrl = this.form.get('acceptTerms');
            if (ctrl) ctrl.setValue(!ctrl.value);
        }
    /** FormBuilder helper instance */
    private fb = inject(FormBuilder);
    /** Service managing authentication state */
    private authService = inject(AuthService);
    /** Injected Router for navigation after successful signup */
    private router = inject(Router);

    /** Signal to toggle visibility of input password text */
    showPassword = signal(false);
    /** Signal to toggle visibility of input confirmation password text */
    showConfirmPassword = signal(false);

    /** Reactive form config containing registration controls and cross-field validators */
    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[^0-9\s]+\s+[^0-9]+$/)]],
        email: [
            '',
            [
                Validators.required,
                Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
            ],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        acceptTerms: [false, Validators.requiredTrue],
    }, { validators: Signup.passwordMatchValidator });

    /**
     * Static validator asserting that password matches confirmPassword control value.
     * 
     * @param form - The abstract form control representing the form group.
     * @returns A validation error object if passwords mismatch, or null if they match.
     */
    static passwordMatchValidator(form: AbstractControl) {
        const password = form.get('password')?.value;
        const confirmPasswordControl = form.get('confirmPassword');

        if (!confirmPasswordControl) return null;
        if (!confirmPasswordControl.value) return null;

        if (password !== confirmPasswordControl.value) {
            confirmPasswordControl.setErrors({ ...confirmPasswordControl.errors, passwordMismatch: true });
            return { passwordMismatch: true };
        } else {
            if (confirmPasswordControl.hasError('passwordMismatch')) {
                const errors = { ...confirmPasswordControl.errors };
                delete errors['passwordMismatch'];
                confirmPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
            }
            return null;
        }
    }

    /** Toggles the password field display type */
    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    /** Toggles the confirmation password field display type */
    toggleConfirmPassword(): void {
        this.showConfirmPassword.update((v) => !v);
    }

    errorMessage: string | null = null;

    async signUp() {
        if (this.form.invalid) return;
        const name = this.form.value.name ?? '';
        const email = this.form.value.email ?? '';
        const password = this.form.value.password ?? '';
        try {
            this.errorMessage = null;
            await this.authService.signUp(String(email), String(password), String(name));
            await this.router.navigate(['/login']);
        } catch (error: any) {
            this.errorMessage = error?.message ?? 'Registration failed. Please try again.';
            console.error('Signup failed:', error);
        }
    }
}
