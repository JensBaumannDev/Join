import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

/** Page component displaying the application privacy policy */
@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {

  /** Injected Location service for history navigation */
  private location = inject(Location);

  /** Navigates back to the previously visited screen */
  goBack(): void {
    this.location.back();
  }
}
