import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ContactDialogComponent } from '../contact-overlay/contact-overlay';
// import { JsonPipe } from '@angular/common';
import { Supabase } from '../contact.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  // imports: [JsonPipe],
  templateUrl: './contact-list.html',
  styleUrl:'./contact-list.scss',
})
export class ContactList {
  contactService = inject(Supabase);
  private dialog = inject(MatDialog);

  openContactDialog(mode: 'add' | 'edit', contact?: any) {
  const dialogRef = this.dialog.open(ContactDialogComponent, {
    data: { mode, contact },
    panelClass: 'contact-dialog-panel',
    maxWidth: '100vw',
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

  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  add(name: string, email: string, phone: number) {
    this.contactService.addContact(name, email, phone);
  }
}
