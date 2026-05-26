import { Component, inject, OnInit, computed } from '@angular/core';
import { ContactService } from '../../../services/contact.service';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { ContactDetail } from '../contact-detail/contact-detail';
import { MatDialog } from '@angular/material/dialog';
import { ContactDialogComponent } from '../contact-overlay/contact-overlay';
import { ToastService } from '../../../services/toast.service';
import { AvatarService } from '../../../services/avatar.service';
import { AuthService } from '../../../services/auth.service';
import { Contact } from '../../../interfaces/interface';

/** Component managing the list of contacts, search filtering, and details view selection */
@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [AvatarComponent, ContactDetail],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  /** Injected ContactService for managing contacts list state */
  contactService = inject(ContactService);
  /** Injected AuthService for accessing the current user account info */
  protected authService = inject(AuthService);
  /** Injected MatDialog service to trigger overlay dialog overlays */
  private dialog = inject(MatDialog);
  /** Injected ToastService for system alerts display feedback */
  private toastService = inject(ToastService);
  /** Injected AvatarService for formatting contact visual initials and colors */
  private avatarService = inject(AvatarService);

  /**
   * Checks if the given contact matches the currently logged-in user's email.
   * 
   * @param contact - The contact record to check.
   * @returns True if it matches the current user, false otherwise.
   */
  isCurrentUserContact(contact: Contact): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return user.email === contact.email;
  }


  /**
   * Returns the display label for a contact, appending (You) if it's the current user.
   * 
   * @param contact - The contact record.
   * @returns The generated display name label.
   */
  getContactLabel(contact: Contact): string {
    const isCurrentUser = this.isCurrentUserContact(contact);
    const maxLength = isCurrentUser ? 18 : 22;

    const name = contact.name.length > maxLength
      ? contact.name.slice(0, maxLength) + '...'
      : contact.name;

    return isCurrentUser ? `${name} (You)` : name;
  }


  /**
   * Opens the dialog for adding or editing a contact and processes the result.
   * 
   * @param mode - The dialog mode, either 'add' or 'edit'.
   * @param contact - The optional contact record to edit.
   */
  openContactDialog(mode: 'add' | 'edit', contact?: Contact) {
    const dialogRef = this.dialog.open(ContactDialogComponent, {
      data: { mode, contact },
      panelClass: 'contact-dialog-panel',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => this.handleDialogResult(result, mode, contact));
  }


  /**
   * Processes the dialog output result and routes to save or delete handlers.
   * 
   * @param result - The output action and payload from the dialog.
   * @param mode - Active dialog configuration mode.
   * @param contact - Selected contact record.
   */
  private handleDialogResult(
    result: { action: string, data?: Contact } | undefined,
    mode: 'add' | 'edit',
    contact?: Contact
  ): void {
    if (!result) return;

    if (result.action === 'save' && result.data) {
      this.handleSaveAction(result.data, mode, contact);
    } else if (result.action === 'delete') {
      this.toastService.show('Contact successfully deleted');
      this.contactService.selectedContact.set(null);
    }
  }


  /**
   * Updates state variables and signals after a contact save action.
   * 
   * @param data - The contact detail payload.
   * @param mode - Active dialog configuration mode.
   * @param contact - Original contact record.
   */
  private handleSaveAction(data: Contact, mode: 'add' | 'edit', contact?: Contact): void {
    this.toastService.show(mode === 'add' ? 'Contact successfully created' : 'Contact successfully updated');
    if (mode === 'edit' && contact?.id) {
      this.contactService.selectedContact.set({
        ...contact,
        ...data
      });
    }
  }


  /** Computed property grouping contacts alphabetically by their initials. */
  groupedContacts = computed(() => {
    const contacts = this.contactService.contacts();

    const map = new Map<string, Contact[]>();

    contacts.forEach((c) => {
      const letter = c.name.charAt(0).toUpperCase();

      if (!map.has(letter)) {
        map.set(letter, []);
      }

      map.get(letter)!.push(c);
    });

    return Array.from(map.entries())
      .map(([letter, contacts]) => ({ letter, contacts }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  });


  /**
   * Initialization hook fetching contacts and subscribing to real-time updates.
   */
  ngOnInit() {
    this.contactService.getContacts();
    this.contactService.subscribeToChanges();
  }


  /**
   * Selects a contact to display in the detail view.
   * 
   * @param contact - The contact record to select.
   */
  selectContact(contact: Contact) {
    this.contactService.selectedContact.set(contact);
  }


  /**
   * Creates a new contact with a balanced avatar color and re-fetches the list.
   * 
   * @param name - Full name of the contact.
   * @param email - Email address of the contact.
   * @param phone - Phone number of the contact.
   */
  add(name: string, email: string, phone: string) {
    const usedColors = this.contactService.contacts().map(c => c.color).filter(c => c) as string[];
    this.contactService.addContact(name, email, phone, this.avatarService.getBalancedColor(usedColors));
    this.contactService.getContacts();
  }


  /**
   * Deletes a contact from the database and updates selected contact state.
   * 
   * @param id - The ID of the contact to delete.
   */
  async deleteContact(id: number) {
    await this.contactService.deleteContact(id);
    this.contactService.selectedContact.set(null);
    this.toastService.show('Contact successfully deleted');
  }
}