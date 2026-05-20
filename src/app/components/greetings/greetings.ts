import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-greetings',
  imports: [],
  templateUrl: './greetings.html',
  styleUrl: './greetings.scss',
})
export class Greetings implements OnInit {
  greetingText: string = '';
  private authService = inject(AuthService);

  get userName(): string {
    const user = this.authService.currentUser();

    if (!user) return 'Guest';

    if (user.email === 'guest@join.com') {
      return 'Guest';
    }

    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || '';
  }

  ngOnInit() {
    this.setGreeting();
  }

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
