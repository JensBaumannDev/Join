import { Component, inject, OnInit, computed } from '@angular/core';
import { Supabase } from '../contact.service';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  contactService = inject(Supabase);

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
