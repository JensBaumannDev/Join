import { Component, inject, ViewEncapsulation, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { TaskEdit } from '../task-edit/task-edit';
import { TaskDetailView } from '../task-detail-view/task-detail-view';
@Component({
  selector: 'app-task-detail',
  imports: [TaskDetailView, TaskEdit],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDetail implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<TaskDetail>);
  private dialogService = inject(DialogService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private data = inject(MAT_DIALOG_DATA);
  task: Task = this.data.task;

  isClosing = signal(false);
  isEditing = signal(false);
  subtasks: any[] = this.data.subtasks ?? [];
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

  editTask() {
    this.isEditing.set(true);
  }

  onEditSaved(event: { task: Task; subtasks: any[] }) {
    this.task = event.task;
    this.subtasks = event.subtasks;
    this.isEditing.set(false);
  }

  async toggleSubtask(subtask: any) {
    subtask.completed = !subtask.completed;
    await this.taskService.updateSubtaskCompleted(subtask.id, subtask.completed, String(this.task.id));
  }
}
