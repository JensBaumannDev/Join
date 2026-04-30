
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { AvatarComponent } from '../../../components/avatar/avatar.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  mobileMenuOpen = signal(false);
  mobileMenuVisible = signal(false);

  openMobileMenu() {
    this.mobileMenuVisible.set(true);
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    setTimeout(() => {
      this.mobileMenuVisible.set(false);
    }, 250);
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
