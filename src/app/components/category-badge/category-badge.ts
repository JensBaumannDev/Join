import { Component, inject, input } from '@angular/core';
import { AvatarService } from '../../services/avatar.service';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [],
  templateUrl: './category-badge.html',
  styleUrl: './category-badge.scss',
})
export class CategoryBadge {
  category = input.required<string>();

  private avatarService = inject(AvatarService);

  getColor(): string {
    return this.avatarService.getColor(this.category() + ' category');
  }
}
