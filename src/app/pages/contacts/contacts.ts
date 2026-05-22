import { Component } from '@angular/core';
import { ContactList } from './contact-list/contact-list';

/** Wrapper page component containing the contact list and contact detail views */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ContactList],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}