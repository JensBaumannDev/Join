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

  @ViewChild('menuWrapper') menuWrapper!: ElementRef;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen && this.menuWrapper && !this.menuWrapper.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }
}