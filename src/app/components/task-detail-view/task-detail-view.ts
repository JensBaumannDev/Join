import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { CategoryBadge } from '../category-badge/category-badge';
import { AvatarComponent } from '../avatar/avatar.component';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-detail-view',
  standalone: true,
  imports: [CategoryBadge, DatePipe, LowerCasePipe, AvatarComponent],
  templateUrl: './task-detail-view.html',
})
export class TaskDetailView {
  @Input() task!: Task;
  @Input() subtasks: any[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<void>();
  @Output() subtaskToggled = new EventEmitter<any>();

  private taskService = inject(TaskService);

  get assignees(): { name: string; color?: string }[] {
    const val: any = this.task.assigned_to;
    if (!val) return [];

    let names: string[] = [];
    if (Array.isArray(val)) {
      names = val;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          names = JSON.parse(trimmed);
        } catch {
          names = trimmed.slice(1, -1).split(',').map(n => n.trim().replace(/^["']|["']$/g, ''));
        }
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        names = trimmed.slice(1, -1).split(',').map(n => n.trim().replace(/^["']|["']$/g, ''));
      } else {
        names = trimmed.split(',').map(n => n.trim()).filter(n => n.length > 0);
      }
    }

    const allContacts = this.taskService.contacts();
    return names.map(name => ({
      name,
      color: allContacts.find(c => c.name === name)?.color,
    }));
  }
}
