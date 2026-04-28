import { Component } from '@angular/core';
import { ContactList } from './contact-list/contact-list';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ContactList],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}