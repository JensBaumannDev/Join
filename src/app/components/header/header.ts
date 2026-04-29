import { Component } from '@angular/core';
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

toggleMenu() {
  this.menuOpen = !this.menuOpen;
}

logout() {
  
}
}
