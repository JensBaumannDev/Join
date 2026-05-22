import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Sidebar component providing navigation links throughout the application */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  /** Injectable AuthService to manage session checks or conditionally show menu items */
  protected authService = inject(AuthService);
}
