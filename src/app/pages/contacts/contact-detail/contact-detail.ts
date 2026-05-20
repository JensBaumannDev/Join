
import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { Contact } from '../../../interfaces/interface';
import { AuthService } from '../../../services/auth.service';

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

  /** Opens the mobile menu with a slide-in animation */
  openMobileMenu() {
    this.mobileMenuVisible.set(true);
    this.mobileMenuOpen.set(true);
  }

  /** Closes the mobile menu with a slide-out animation */
  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    setTimeout(() => {
      this.mobileMenuVisible.set(false);
    }, 250);
  }
  @Input({ required: true }) contact!: Contact;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private authService = inject(AuthService);

  get isCurrentUserContact(): boolean {
    return this.authService.currentUser()?.email === this.contact.email;
  }
 
  /** Formats a raw phone number into a standardized display format: +49 1234 123 12 1 */
  formatPhone(phone: any): string {
    if (phone === undefined || phone === null) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (!cleaned) return '';

    if (cleaned.startsWith('0')) cleaned = '49' + cleaned.substring(1);
    else if (!cleaned.startsWith('49')) cleaned = '49' + cleaned;

    const country = '+49';
    const area = cleaned.substring(2, 6);
    const g1 = cleaned.substring(6, 9);
    const g2 = cleaned.substring(9, 11);
    const g3 = cleaned.substring(11);

    let result = `${country} ${area}`;
    if (g1) result += ` ${g1}`;
    if (g2) result += ` ${g2}`;
    if (g3) result += ` ${g3}`;

    return result.trim();
  }

  /** Generates initials from a full name (e.g., "Anja Schulz" -> "AS") */
  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
