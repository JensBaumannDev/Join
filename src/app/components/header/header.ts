import { Component, HostListener, ViewChild, ElementRef, inject } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { RouterModule, Router  } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AvatarComponent, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  menuOpen = false;
  isClosing = false;
  private router = inject(Router);

  /** Injects the AuthService to handle authentication related tasks. */
  protected authService = inject(AuthService);

  /** GETS THE USER NAME*/
  get userName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Guest';
    if (user.email === 'guest@join.com') return 'Guest';
    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || '';
  }

  
  /** Reference to the menu wrapper element in the template. */
  @ViewChild('menuWrapper') menuWrapper!: ElementRef;

  /** TOGGLES THE MENU VISIBILITY*/
  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.menuOpen = true;
    }
  }

  /** CLOSES THE MENU*/
  closeMenu() {
    this.isClosing = true;
    setTimeout(() => {
      this.menuOpen = false;
      this.isClosing = false;
    }, 250);
  }

  /** LOGS OUT THE USER*/
   async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  /** HANDLES OUTSIDE CLICK*/
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen && !this.isClosing && this.menuWrapper && !this.menuWrapper.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
}