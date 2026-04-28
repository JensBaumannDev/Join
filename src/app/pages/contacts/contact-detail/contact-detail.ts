
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  @Input({ required: true }) contact!: { id?: number; name: string; email: string; phone: number };

  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
