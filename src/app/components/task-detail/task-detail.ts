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
    await this.taskService.updateSubtaskCompleted(subtask.id, subtask.completed);
  }

  get assignees(): string[] {
    const val = this.task.assigned_to;
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return (val as unknown as string).split(',').map(n => n.trim()).filter(n => n.length > 0);
  }
}
