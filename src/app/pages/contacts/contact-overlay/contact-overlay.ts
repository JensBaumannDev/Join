import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Component, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
    selector: 'app-contact-overlay',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule
    ],
    templateUrl: './contact-overlay.html',
    styleUrl: './contact-overlay.scss',
    encapsulation: ViewEncapsulation.None,
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContactDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<ContactDialogComponent>);
    private data = inject(MAT_DIALOG_DATA);

    mode = signal<'add' | 'edit'>(this.data?.mode || 'add');

    title = computed(() => this.mode() === 'add' ? 'Add contact' : 'Edit contact');
    cancelBtnText = computed(() => this.mode() === 'add' ? 'Cancel' : 'Delete');
    saveBtnText = computed(() => this.mode() === 'add' ? 'Create contact' : 'Save');

    form = this.fb.group({
        name: [this.data?.contact?.name || '', Validators.required],
        email: [this.data?.contact?.email || '', [Validators.required, Validators.email]],
        phone: [this.data?.contact?.phone || '', Validators.required]
    });

    formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });
    avatarInitials = computed(() => {
        const name = this.formValue()?.name || '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        if (parts[0]) return parts[0][0].toUpperCase();
        return '';
    });

    cancel() {
        this.dialogRef.close();
    }

    delete() {
        this.dialogRef.close({ action: 'delete' });
    }

    save() {
        if (this.form.invalid) return;
        this.dialogRef.close({ action: 'save', data: this.form.getRawValue() });
    }
}
//     if (this.mode() === 'add') {
//       this.cancel();
//     } else {
//       this.dialogRef.close({ action: 'delete' });
//     }
//   }

//   save() {
//     if (this.form.valid) {
//       this.dialogRef.close({ action: 'save', data: this.form.value });
//     }
//   }
// }
