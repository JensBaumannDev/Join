import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { RouterModule } from '@angular/router';

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

  @ViewChild('menuWrapper') menuWrapper!: ElementRef;

  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.menuOpen = true;
    }
  }

  closeMenu() {
    this.isClosing = true;
    setTimeout(() => {
      this.menuOpen = false;
      this.isClosing = false;
    }, 250);
  }

  logout() {
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen && !this.isClosing && this.menuWrapper && !this.menuWrapper.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
}