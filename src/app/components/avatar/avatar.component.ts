import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';

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

  /** Data computed from the name */
  avatarData = computed(() => {
    return this.avatarService.getAvatarData(this.name());
  });

  /** Font size computed based on the avatar size */
  fontSize = computed(() => {
    return Math.floor(this.size() * 0.4);
  });

  constructor(private avatarService: AvatarService) {}
}
