import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

/** Component for displaying a time-of-day greeting to the current user */
@Component({
  selector: 'app-greetings',
  imports: [],
  templateUrl: './greetings.html',
  styleUrl: './greetings.scss',
})
export class Greetings implements OnInit {
  /** The greeting message text (e.g. Good Morning) */
  greetingText: string = '';
  /** Injectable AuthService for fetching user information */
  private authService = inject(AuthService);

  /** Retrieves the name of the logged-in user or guest */
  get userName(): string {
    const user = this.authService.currentUser();

    if (!user) return 'Guest';

    if (user.email === 'guest@join.com') {
      return 'Guest';
    }

    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || '';
  }

  /** Sets the greeting message on initialization */
  ngOnInit() {
    this.setGreeting();
  }

  /** Computes and assigns the greeting text based on the current hour of the day */
  setGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      this.greetingText = 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      this.greetingText = 'Good afternoon';
    } else {
      this.greetingText = 'Good evening';
    }
  }
}
