import { Component, HostListener, ViewChild, ElementRef, inject } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { RouterModule, Router  } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Header component containing user profile, navigation options, and logout menu */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AvatarComponent, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  /** Flag representing menu openness */
  menuOpen = false;
  /** Flag representing closing state of menu (for animations) */
  isClosing = false;
  /** Injectable Router for page navigation */
  private router = inject(Router);

  /** Checks if the current route is the help page */
  get isHelpPage(): boolean {
    return this.router.url === '/help';
  }

  /** Injects the AuthService to handle authentication related tasks */
  protected authService = inject(AuthService);

  /** Gets the current user's name or Guest status */
  get userName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Guest';
    if (user.email === 'guest@join.com') return 'Guest';
    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || '';
  }

  /** Reference to the menu wrapper element in the template */
  @ViewChild('menuWrapper') menuWrapper!: ElementRef;

  /** Toggles the dropdown menu visibility */
  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.menuOpen = true;
    }
  }

  /** Closes the dropdown menu with a fade-out animation */
  closeMenu() {
    this.isClosing = true;
    setTimeout(() => {
      this.menuOpen = false;
      this.isClosing = false;
    }, 250);
  }

  /** Logs out the user and redirects to login */
   async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Closes the dropdown menu if a click occurs outside of it.
   * 
   * @param event - The mouse click event.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen && !this.isClosing && this.menuWrapper && !this.menuWrapper.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
}