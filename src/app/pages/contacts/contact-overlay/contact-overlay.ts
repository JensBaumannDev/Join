import { ContactService } from '../../../services/contact.service';
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

/** Modal dialog component for creating or editing contacts */
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
    /** Injected FormBuilder helper class to build validation forms */
    private fb = inject(FormBuilder);
    /** Injected MatDialogRef wrapper to manage closing this dialog overlay */
    private dialogRef = inject(MatDialogRef<ContactDialogComponent>);
    /** Injected MAT_DIALOG_DATA containing initial overlay parameters */
    private data = inject(MAT_DIALOG_DATA);
    /** Injected ContactService for updating data in database */
    private supabase = inject(ContactService);
    /** Injected AvatarService to generate visual character initials */
    private avatarService = inject(AvatarService);


    /** Signal indicating if the dialog is in its closing animation */
    isClosing = signal(false);

    /** Signal representing the loading state of background operations */
    isLoading = signal(false);
    /** Subscription collection for cleaning up observables */
    private subscriptions = new Subscription();

    /** Signal determining if the dialog is in 'add' or 'edit' mode */
    mode = signal<'add' | 'edit'>(this.data?.mode || 'add');

    /** Holds the color assigned to the contact during this editing session */
    sessionColor = '';

    /** Computed title based on current dialog mode */
    title = computed(() => this.mode() === 'add' ? 'Add contact' : 'Edit contact');

    /** Computed subtitle for additional dialog context */
    subtitle = computed(() => this.mode() === 'add' ? 'Tasks are better with a team!' : '');

    /** Computed label text for the cancel button */
    cancelBtnText = computed(() => this.mode() === 'add' ? 'Cancel' : 'Delete');

    /** Computed label text for the save button */
    saveBtnText = computed(() => this.mode() === 'add' ? 'Create contact' : 'Save');

    /** Reactive form group for contact details validation and state */
    form = this.fb.group({
        name: [this.data?.contact?.name || '', [Validators.required, Validators.minLength(3), Validators.pattern(/^[^0-9\s]+\s+[^0-9]+$/)]],
        email: [
            this.data?.contact?.email || '',
            [
                Validators.required,
                Validators.email,
                Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            ]
        ],
        phone: [this.data?.contact?.phone || '', [Validators.required, Validators.pattern(/^\+?[0-9]+$/)]]
    });

    /** Signal wrapper around form value changes stream */
    formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

    /** Computed avatar color preview based on form input */
    avatarColor = computed(() => {
        if (this.mode() === 'add') {
            const name = this.formValue()?.name || '';
            if (!name) return '#D1D1D1';
            return this.sessionColor;
        }
        return this.sessionColor;
    });

    /** Computed initials preview based on input name */
    avatarInitials = computed(() => {
        const name = this.formValue()?.name || '';
        return this.avatarService.getInitials(name);
    });

    /** Component initialization hook setup for event listeners and colors */
    ngOnInit() {
        const initialName = this.data?.contact?.name || '';
        const initialColor = this.data?.contact?.color;
        
        if (this.mode() === 'edit') {
            this.sessionColor = initialColor || this.avatarService.getColor(initialName);
        } else {
            const usedColors = this.supabase.contacts().map(c => c.color).filter(c => c) as string[];
            this.sessionColor = this.avatarService.getBalancedColor(usedColors);
        }

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

    /** Cleanup hook that unsubscribes active event streams */
    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    /**
     * Triggers the slide-out exit animation and closes the dialog.
     * 
     * @param data - The optional result data to pass back on close.
     */
    private closeDialog(data?: any) {
        this.isClosing.set(true);
        this.dialogRef.addPanelClass('slide-out');
        setTimeout(() => {
            this.dialogRef.close(data);
        }, 500);
    }

    /** Closes the dialog without saving any changes. */
    cancel() {
        this.closeDialog();
    }

    /** Deletes the contact from the database and closes the dialog. */
    async delete() {
        this.isLoading.set(true);
        try {
            if (this.mode() === 'edit' && this.data.contact?.id) {
                await this.supabase.deleteContact(this.data.contact.id);
            }
            this.closeDialog({ action: 'delete' });
        } finally {
            this.isLoading.set(false);
        }
    }

    /** Persists the new or edited contact details to the database. */
    async save() {
        if (this.form.invalid) return;
        this.isLoading.set(true);
        try {
            const value = this.form.getRawValue();

            if (this.mode() === 'add') {
                await this.supabase.addContact(value.name, value.email, value.phone, this.sessionColor);
            } else {
                const contactId = this.data.contact.id;
                if (contactId) {
                    await this.supabase.updateContact(contactId, value.name, value.email, value.phone, this.sessionColor);
                }
            }
            this.closeDialog({ action: 'save', data: { ...value, color: this.sessionColor } });
        } finally {
            this.isLoading.set(false);
        }
    }
}