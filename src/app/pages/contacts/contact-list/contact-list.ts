import { Component, inject, OnInit, computed } from '@angular/core';
import { Supabase } from '../contact.service';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { ContactDetail } from '../contact-detail/contact-detail';
import { MatDialog } from '@angular/material/dialog';
import { ContactDialogComponent } from '../contact-overlay/contact-overlay';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [AvatarComponent, ContactDetail],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  contactService = inject(Supabase);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  openContactDialog(mode: 'add' | 'edit', contact?: any) {
    const dialogRef = this.dialog.open(ContactDialogComponent, {
      data: { mode, contact },
      panelClass: 'contact-dialog-panel',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;

      if (result.action === 'save') {
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

  groupedContacts = computed(() => {
    const contacts = this.contactService.contacts();

    const map = new Map<string, any[]>();

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

  ngOnInit() {
    this.contactService.getContacts();
    this.contactService.subscribeToChanges();
  }

  selectContact(contact: any) {
    this.contactService.selectedContact.set(null);
    setTimeout(() => {
      this.contactService.selectedContact.set(contact);
    }, 50);
  }

  add(name: string, email: string, phone: string) {
    this.contactService.addContact(name, email, phone);
    this.contactService.getContacts();
  }
  
  async deleteContact(id: number) {
    await this.contactService.deleteContact(id);
    this.contactService.selectedContact.set(null);
    this.toastService.show('Contact successfully deleted');
  }
}