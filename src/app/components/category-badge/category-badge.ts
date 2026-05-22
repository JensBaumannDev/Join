import { Component, inject, input } from '@angular/core';
import { AvatarService } from '../../services/avatar.service';

/** Component for rendering category badges with dynamically assigned background colors */
@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [],
  templateUrl: './category-badge.html',
  styleUrl: './category-badge.scss',
})
export class CategoryBadge {
  /** The text category to display and color */
  category = input.required<string>();
  /** Determines if badge is displayed inside a dialog */
  inDialog = input<boolean>(false);

  /** Injectable AvatarService to resolve category color */
  private avatarService = inject(AvatarService);

  /**
   * Retrieves the hex color based on the category name.
   * 
   * @returns The resolved hex color string.
   */
  getColor(): string {
    return this.avatarService.getColor(this.category() + ' category');
  }
}
