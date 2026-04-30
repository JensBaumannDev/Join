
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AvatarComponent } from '../../../components/avatar/avatar.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  mobileMenuOpen = false;
  mobileMenuVisible = false;

  openMobileMenu() {
    this.mobileMenuVisible = true;
    this.mobileMenuOpen = true;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    setTimeout(() => {
      this.mobileMenuVisible = false;
    }, 400); // Dauer der Animation
  }
  @Input({ required: true }) contact!: { id?: number; name: string; email: string; phone: string };
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
