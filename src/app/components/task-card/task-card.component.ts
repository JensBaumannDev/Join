import { Component, Input, inject, signal, HostListener, computed } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { AvatarService } from '../../services/avatar.service';
import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';
import { CategoryBadge } from '../category-badge/category-badge';
import { SubtaskProgress } from '../subtask-progress/subtask-progress';
import { parseAssignedTo } from '../../utils/task.utils';

/**
 * Component representing a single task card on the Kanban board.
 * Manages card-specific rendering, priority icon paths, assignee list previews, and the assignee details popup.
 */
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CategoryBadge, SubtaskProgress],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  /** Input property containing the task details to render */
  @Input() task!: Task;

  /** Injectable AvatarService for formatting initials and resolving avatar configurations */
  private avatarService = inject(AvatarService);
  /** Injectable AuthService to resolve current user details for display annotations */
  private authService = inject(AuthService);
  /** Injectable ContactService to map assignments back to contact records */
  private contactService = inject(ContactService);

  /** State of the assignee avatar overlay popup */
  avatarPopup = signal<{
    visible: boolean;
    x: number;
    bottom?: number | null;
    top?: number | null;
    maxHeight: number;
    assignments: any[];
  }>({
    visible: false,
    x: 0,
    maxHeight: 260,
    assignments: [],
  });

  /**
   * Toggles the visibility of the assignees list details overlay.
   * 
   * @param event - The mouse click event.
   */
  toggleAvatarPopup(event: MouseEvent): void {
    event.stopPropagation();
    const popup = this.avatarPopup();

    if (popup.visible) {
      this.closeAvatarPopup();
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const assignments = this.getTaskAssignments();
    const headerHeight = 95;
    const margin = 12;

    const spaceAbove = rect.top - headerHeight - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const openDirection = (spaceAbove > 150 || spaceAbove > spaceBelow) ? 'up' : 'down';

    const bottom = openDirection === 'up' ? window.innerHeight - rect.top + 8 : null;
    const top = openDirection === 'down' ? rect.bottom + 8 : null;

    this.avatarPopup.set({
      visible: true,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 262)),
      bottom,
      top,
      maxHeight: 260,
      assignments,
    });
  }

  /** Closes the assignee popup list. */
  @HostListener('document:click')
  closeAvatarPopup(): void {
    if (this.avatarPopup().visible) {
      this.avatarPopup.update(p => ({ ...p, visible: false }));
    }
  }

  /**
   * Resolves display initials and background color for an assignment.
   * 
   * @param assignment - The assignment object to resolve.
   * @returns An object containing styling information.
   */
  getContactInfo(assignment: any) {
    const name = assignment.contact?.name || assignment.name || 'Unknown';
    const color = assignment.contact?.color || assignment.color;
    return this.avatarService.getAvatarData(name, color);
  }

  /**
   * Resolves the static SVG file path for a task's priority level.
   * 
   * @param priority - The priority string (e.g. 'urgent', 'medium', 'low').
   * @returns The relative file path to the SVG asset.
   */
  getPriorityIcon(priority: string): string {
    const p = priority?.toLowerCase();
    return `./icons/board/prio-${p === 'urgent' || p === 'medium' || p === 'low' ? p : 'low'}.svg`;
  }

  /**
   * Resolves the name string for an assignment, appending '(You)' if matching the current user.
   * 
   * @param assign - The assignment object.
   * @returns The formatted name label.
   */
  getAssignmentLabel(assign: any): string {
    const name = assign.contact?.name || assign.name || 'Unknown';
    return this.isCurrentUserAssignment(assign) ? `${name} (You)` : name;
  }

  /**
   * Helper check asserting if an assignment matches the logged-in user.
   * 
   * @param assign - The assignment object.
   * @returns True if the assignment is the current user, false otherwise.
   */
  private isCurrentUserAssignment(assign: any): boolean {
    const name = assign.contact?.name || assign.name;
    return !!name && name === this.currentUserContactName();
  }

  /** Computed getter returning the formatted contact name of the logged-in user */
  private currentUserContactName = computed((): string | null => {
    const user = this.authService.currentUser();
    if (!user?.email) return null;
    const contact = this.contactService.contacts().find((c) => c.email === user.email);
    return contact?.name || this.authService.getDisplayName(user);
  });

  /**
   * Resolves the assignments list from the input task.
   * 
   * @returns An array of enriched task assignment objects.
   */
  getTaskAssignments(): any[] {
    if (this.task.task_assignments && this.task.task_assignments.length > 0) {
      return this.task.task_assignments;
    }

    const val: any = this.task.assigned_to;
    if (!val) return [];

    const names = parseAssignedTo(val);
    const allContacts = this.contactService.contacts();
    return names.map(name => {
      const contact = allContacts.find(c => c.name === name);
      const assignment = {
        name: name,
        color: contact?.color,
        contact: contact,
      };
      return {
        ...assignment,
        isYou: this.isCurrentUserAssignment(assignment),
      };
    });
  }
}
