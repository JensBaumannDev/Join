
import { Component, Input } from '@angular/core';
import { AvatarComponent } from '../../../components/avatar/avatar.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  @Input({ required: true }) contact!: { id?: number; name: string; email: string; phone: string };

  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
