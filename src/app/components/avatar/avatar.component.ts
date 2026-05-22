import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';

/** Component representing a user avatar with initials and color background */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  /** The name of the user/contact to generate initials and color for */
  name = input.required<string>();

  /** The diameter of the avatar in pixels */
  size = input<number>(42);

  /** Whether to use the header-specific styling (white bg, colored text) */
  isHeader = input<boolean>(false);

  /** Whether to use the contact details specific styling (larger font size) */
  isContactDetail = input<boolean>(false);

  /** The persistent color for the avatar. If not provided, it falls back to a name-based generated color. */
  color = input<string>();

  /** Data computed from the name and optional color */
  avatarData = computed(() => {
    return this.avatarService.getAvatarData(this.name(), this.color());
  });

  /** Font size computed based on the avatar size */
  fontSize = computed(() => {
    if (this.isContactDetail()) return 47;
    return this.isHeader() ? 24 : 16;
  });

  /** Initializes the AvatarComponent with the AvatarService */
  constructor(private avatarService: AvatarService) { }
}
