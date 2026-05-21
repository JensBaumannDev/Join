import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-signup',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterLink, RouterLinkActive, MatCheckboxModule],
    standalone: true,
    templateUrl: './signup.html',
    styleUrls: ['./signup.scss']
})
export class Signup {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    showPassword = signal(false);
    showConfirmPassword = signal(false);

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

    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword.update((v) => !v);
    }
}
