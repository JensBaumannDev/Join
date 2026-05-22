import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
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
                loading = false;
            private toastService = inject(ToastService);
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
        if (this.form.invalid || this.loading) return;
        const { name, email, password } = this.getFormValues();
        this.loading = true;
        try {
            this.errorMessage = null;
            await this.registerUser(email, password, name);
            this.handleSuccess();
        } catch (error: any) {
            this.handleError(error);
        } finally {
            this.loading = false;
        }
    }

    /** Extracts and normalizes form values for registration */
    private getFormValues() {
        return {
            name: this.form.value.name ?? '',
            email: this.form.value.email ?? '',
            password: this.form.value.password ?? ''
        };
    }

    /** Handles user registration via AuthService */
    private async registerUser(email: string, password: string, name: string) {
        await this.authService.signUp(String(email), String(password), String(name));
    }

    /** Handles successful registration: toast and navigation */
    private async handleSuccess() {
        this.toastService.show('You Signed Up successfully', false);
        await this.router.navigate(['/login']);
    }

    /** Handles registration errors and user feedback */
    private handleError(error: any) {
        let msg = error?.message ?? 'Registration failed. Please try again.';
        if (
            error?.status === 400 &&
            (msg.includes('already registered') || msg.includes('already in use') || msg.includes('User already registered'))
        ) {
            msg = 'A user with this email already exists.';
        }
        this.toastService.show(msg, false);
        this.errorMessage = msg;
        console.error('Signup failed:', error);
    }
}
