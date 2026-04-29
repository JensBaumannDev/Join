import { Component, inject, OnInit, computed } from '@angular/core';
import { Supabase } from '../contact.service';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { ContactDetail } from '../contact-detail/contact-detail';
import { MatDialog } from '@angular/material/dialog';
import { ContactDialogComponent } from '../contact-overlay/contact-overlay';

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

  openContactDialog(mode: 'add' | 'edit', contact?: any) {
    this.dialog.open(ContactDialogComponent, {
      data: { mode, contact },
      panelClass: 'contact-dialog-panel',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0'
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
}