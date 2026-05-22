import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

/** Page component displaying legal notices and site ownership information */
@Component({
  selector: 'app-legal-notice',
  imports: [],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})

export class LegalNotice {

  /** Injected Location service for routing history navigation */
  private location = inject(Location);

  /** Navigates back to the previously visited screen */
  goBack(): void {
    this.location.back();
  }
}
