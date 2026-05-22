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

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [AvatarComponent, ContactDetail],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
/** Component managing the list of contacts, search filtering, and details view selection */
export class ContactList implements OnInit {
  contactService = inject(ContactService);
  protected authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  private avatarService = inject(AvatarService);

  /** Checks if the given contact matches the currently logged-in user's email */
  isCurrentUserContact(contact: Contact): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return user.email === contact.email;
  }

  /** Returns the display label for a contact, appending (You) if it's the current user */
  getContactLabel(contact: Contact): string {
    return this.isCurrentUserContact(contact) ? `${contact.name} (You)` : contact.name;
  }

  /** Opens the dialog for adding or editing a contact and processes the result */
  openContactDialog(mode: 'add' | 'edit', contact?: Contact) {
    const dialogRef = this.dialog.open(ContactDialogComponent, {
      data: { mode, contact },
      panelClass: 'contact-dialog-panel',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: { action: string, data?: Contact } | undefined) => {
      if (!result) return;

      if (result.action === 'save' && result.data) {
        this.toastService.show(mode === 'add' ? 'Contact successfully created' : 'Contact successfully updated');
        if (mode === 'edit' && contact?.id) {
          this.contactService.selectedContact.set({
            ...contact,
            ...result.data
          });
        }
      } else if (result.action === 'delete') {
        this.toastService.show('Contact successfully deleted');
        this.contactService.selectedContact.set(null);
      }
    });
  }

  /** Computed property grouping contacts alphabetically by their initials */
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

  /** Initialization hook fetching contacts and subscribing to real-time updates */
  ngOnInit() {
    this.contactService.getContacts();
    this.contactService.subscribeToChanges();
  }

  /** Selects a contact to display in the detail view with a brief reset delay */
  selectContact(contact: Contact) {
    this.contactService.selectedContact.set(null);
    setTimeout(() => {
      this.contactService.selectedContact.set(contact);
    }, 50);
  }

  /** Creates a new contact with a balanced avatar color and re-fetches the list */
  add(name: string, email: string, phone: string) {
    const usedColors = this.contactService.contacts().map(c => c.color).filter(c => c) as string[];
    this.contactService.addContact(name, email, phone, this.avatarService.getBalancedColor(usedColors));
    this.contactService.getContacts();
  }

  /** Deletes a contact from the database and updates selected contact state */
  async deleteContact(id: number) {
    await this.contactService.deleteContact(id);
    this.contactService.selectedContact.set(null);
    this.toastService.show('Contact successfully deleted');
  }
}