import { Component, inject, ViewEncapsulation, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CategoryBadge } from '../category-badge/category-badge';
import { AvatarComponent } from '../avatar/avatar.component';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
@Component({
  selector: 'app-task-detail',
  imports: [CategoryBadge, DatePipe, LowerCasePipe, AvatarComponent],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDetail implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<TaskDetail>);
  private taskService = inject(TaskService);
  task: Task = inject(MAT_DIALOG_DATA).task;
  private subscriptions = new Subscription();

  isClosing = signal(false);
  subtasks: any[] = inject(MAT_DIALOG_DATA).subtasks ?? [];

  ngOnInit() {
    this.subscriptions.add(
      this.dialogRef.backdropClick().subscribe(() => {
        this.closeDialog();
      })
    );

    this.subscriptions.add(
      this.dialogRef.keydownEvents()
        .pipe(filter(event => event.key === 'Escape'))
        .subscribe(() => {
          this.closeDialog();
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  closeDialog() {
    this.isClosing.set(true);
    this.dialogRef.addPanelClass('slide-out');
    setTimeout(() => {
      this.dialogRef.close();
    }, 500);
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
