import { Component } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
