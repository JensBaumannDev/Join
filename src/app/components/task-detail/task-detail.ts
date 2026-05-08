import { Component, inject, ViewEncapsulation, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { CategoryBadge } from '../category-badge/category-badge';
import { AvatarComponent } from '../avatar/avatar.component';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
@Component({
  selector: 'app-task-detail',
  imports: [CategoryBadge, DatePipe, LowerCasePipe, AvatarComponent],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDetail implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<TaskDetail>);
  private dialogService = inject(DialogService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  task: Task = inject(MAT_DIALOG_DATA).task;

  isClosing = signal(false);
  subtasks: any[] = inject(MAT_DIALOG_DATA).subtasks ?? [];
  private sub = new Subscription();

  ngOnInit() {
    this.sub = this.dialogService.setupListeners(this.dialogRef, () => this.closeDialog());
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeDialog() {
    this.isClosing.set(true);
    this.dialogService.closeDialog(this.dialogRef);
  }

  async deleteTask() {
    await this.taskService.deleteTask(String(this.task.id));
    this.toastService.show('Task deleted');
    this.closeDialog();
  }

  async toggleSubtask(subtask: any) {
    subtask.completed = !subtask.completed;
    await this.taskService.updateSubtaskCompleted(subtask.id, subtask.completed, String(this.task.id));
  }

  get assignees(): any[] {
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
        } catch (e) {
          names = trimmed.slice(1, -1).split(',').map(n => n.trim().replace(/^["']|["']$/g, ''));
        }
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        names = trimmed.slice(1, -1).split(',').map(n => n.trim().replace(/^["']|["']$/g, ''));
      } else {
        names = trimmed.split(',').map(n => n.trim()).filter(n => n.length > 0);
      }
    }

    const allContacts = this.taskService.contacts();
    return names.map(name => {
      const contact = allContacts.find(c => c.name === name);
      return {
        name: name,
        color: contact?.color
      };
    });
  }
}
