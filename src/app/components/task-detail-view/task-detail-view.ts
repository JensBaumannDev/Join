import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { CategoryBadge } from '../category-badge/category-badge';
import { AvatarComponent } from '../avatar/avatar.component';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { ContactService } from '../../services/contact.service';
import { AuthService } from '../../services/auth.service';
import { parseAssignedTo } from '../../utils/task.utils';

/** Component rendering the details of a single task in a overlay panel */
@Component({
  selector: 'app-task-detail-view',
  standalone: true,
  imports: [CategoryBadge, DatePipe, LowerCasePipe, AvatarComponent],
  templateUrl: './task-detail-view.html',
})
export class TaskDetailView {
  /** Input property representing the current task details */
  @Input() task!: Task;

  /** Input property representing the subtasks for this task */
  @Input() subtasks: any[] = [];

  /** Event emitted when the detail panel is closed */
  @Output() closed = new EventEmitter<void>();

  /** Event emitted when the task is deleted */
  @Output() deleted = new EventEmitter<void>();

  /** Event emitted when the edit mode is activated */
  @Output() editClicked = new EventEmitter<void>();

  /** Event emitted when a subtask's completion status is toggled */
  @Output() subtaskToggled = new EventEmitter<any>();

  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);

  /** Resolves the display name of the current authenticated user */
  private get currentUserContactName(): string | null {
    const user = this.authService.currentUser();
    if (!user?.email) return null;
    const contact = this.contactService.contacts().find((c) => c.email === user.email);
    return contact?.name || this.authService.getDisplayName(user);
  }

  /** Resolves and builds contact preview objects for all task assignees */
  get assignees(): { name: string; color?: string; isYou?: boolean }[] {
    const val: any = this.task.assigned_to;
    if (!val) return [];

    const names = parseAssignedTo(val);
    const allContacts = this.contactService.contacts();
    return names.map(name => {
      const color = allContacts.find(c => c.name === name)?.color;
      return {
        name,
        color,
        isYou: name === this.currentUserContactName,
      };
    });
  }
}
