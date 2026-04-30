import { Supabase } from '../contact.service';
import { AvatarService } from '../../../services/avatar.service';
import { Component, inject, signal, computed, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
export class ContactDialogComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<ContactDialogComponent>);
    private data = inject(MAT_DIALOG_DATA);
    private supabase = inject(Supabase);
    private avatarService = inject(AvatarService);

    isClosing = signal(false);
    private subscriptions = new Subscription();
    
    mode = signal<'add' | 'edit'>(this.data?.mode || 'add');

    title = computed(() => this.mode() === 'add' ? 'Add contact' : 'Edit contact');
    subtitle = computed(() => this.mode() === 'add' ? 'Tasks are better with a team!' : '');
    cancelBtnText = computed(() => this.mode() === 'add' ? 'Cancel' : 'Delete');
    saveBtnText = computed(() => this.mode() === 'add' ? 'Create contact' : 'Save');

    form = this.fb.group({
        name: [this.data?.contact?.name || '', [Validators.required, Validators.minLength(3)]],
        email: [
            this.data?.contact?.email || '',
            [
                Validators.required,
                Validators.email,
                Validators.pattern(/^\S+@\S+\.[a-zA-Z]{2,}$/)
            ]
        ],
        phone: [this.data?.contact?.phone || '', [Validators.required, Validators.pattern(/^\d+$/)]],
        color: [this.data?.contact?.color || (this.mode() === 'add' ? '#bdbdbd' : '')]
    });

    formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

    avatarColor = computed(() => {
        const name = this.formValue()?.name || '';
        if (this.mode() === 'edit') {
            return this.form.value.color || this.avatarService.getColor(name);
        }
        if (this.mode() === 'add') {
            if (!name) return '#D1D1D1';
            const color = this.avatarService.getColor(name);
            if (this.form.value.color !== color) {
                this.form.patchValue({ color }, { emitEvent: false });
            }
            return color;
        }
        return this.form.value.color || this.avatarService.getColor(name);
    });

    avatarInitials = computed(() => {
        const name = this.formValue()?.name || '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        if (parts[0]) return parts[0][0].toUpperCase();
        return '';
    });

    ngOnInit() {
        this.subscriptions.add(
            this.dialogRef.backdropClick().subscribe(() => {
                this.closeDialog();
            })
        );

        this.subscriptions.add(
            this.dialogRef.keydownEvents()
                .pipe(filter(event => event.key === 'Escape'))
                .subscribe(() => {
                    this.closeDialog();
                })
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private closeDialog(data?: any) {
        this.isClosing.set(true);
        setTimeout(() => {
            this.dialogRef.close(data);
        }, 420);
    }

    cancel() {
        if (this.mode() === 'edit') {
            this.delete();
        } else {
            this.closeDialog();
        }
    }

    async delete() {
        if (this.mode() === 'edit' && this.data.contact?.id) {
            await this.supabase.deleteContact(this.data.contact.id);
        }
        this.closeDialog({ action: 'delete' });
    }

    async save() {
        if (this.form.invalid) return;
        const value = this.form.getRawValue();

        if (this.mode() === 'add') {
            await this.supabase.addContact(value.name, value.email, value.phone);
        } else {
            const contactId = this.data.contact.id;
            if (contactId) {
                await this.supabase.updateContact(contactId, value.name, value.email, value.phone);
            }
        }
        this.closeDialog({ action: 'save', data: value });
    }
}