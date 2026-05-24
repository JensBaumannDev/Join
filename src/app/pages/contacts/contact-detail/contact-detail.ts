
import { Component, Input, Output, EventEmitter, signal, inject, DestroyRef } from '@angular/core';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { Contact } from '../../../interfaces/interface';
import { AuthService } from '../../../services/auth.service';

/** Component for displaying contact details, including communication fields and action triggers */
@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  /** Signal reflecting if the mobile action menu is open */
  mobileMenuOpen = signal(false);
  /** Signal reflecting if the mobile action menu container is visible */
  mobileMenuVisible = signal(false);
  
  private destroyRef = inject(DestroyRef);
  private mobileMenuTimeoutId: any = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.mobileMenuTimeoutId) {
        clearTimeout(this.mobileMenuTimeoutId);
      }
    });
  }

  /** Opens the mobile menu with a slide-in animation */
  openMobileMenu() {
    this.mobileMenuVisible.set(true);
    this.mobileMenuOpen.set(true);
  }

  /** Closes the mobile menu with a slide-out animation */
  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    if (this.mobileMenuTimeoutId) {
      clearTimeout(this.mobileMenuTimeoutId);
    }
    this.mobileMenuTimeoutId = setTimeout(() => {
      this.mobileMenuVisible.set(false);
      this.mobileMenuTimeoutId = null;
    }, 250);
  }
  /** Input contact record to display */
  @Input({ required: true }) contact!: Contact;
  /** Output event emitted when user triggers edit contact */
  @Output() edit = new EventEmitter<void>();
  /** Output event emitted when user triggers delete contact */
  @Output() delete = new EventEmitter<void>();
  /** Output event emitted when back navigation is triggered on mobile */
  @Output() back = new EventEmitter<void>();

  /** Injectable AuthService to check if current logged in user matches contact */
  private authService = inject(AuthService);

  /** Getter check if this contact matches current logged in user */
  get isCurrentUserContact(): boolean {
    return this.authService.currentUser()?.email === this.contact.email;
  }
 
  /**
   * Formats a raw phone number into a standardized display format: +49 1234 123 12 1.
   * 
   * @param phone - The raw phone number input (string or number).
   * @returns The formatted phone number string.
   */
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

  /**
   * Generates initials from a full name (e.g., "Anja Schulz" -> "AS").
   * 
   * @param name - The full name string.
   * @returns The initials of the name in uppercase.
   */
  getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
