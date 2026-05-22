import { Component, inject, ViewEncapsulation, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { TaskEdit } from '../task-edit/task-edit';
import { TaskDetailView } from '../task-detail-view/task-detail-view';
/** Modal dialog wrapper displaying task detail view or edit view */
@Component({
  selector: 'app-task-detail',
  imports: [TaskDetailView, TaskEdit],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDetail implements OnInit, OnDestroy {
  /** Reference to the dialog instance */
  private dialogRef = inject(MatDialogRef<TaskDetail>);
  /** Service to manage dialog lifecycle and keyboard/backdrop events */
  private dialogService = inject(DialogService);
  /** Service containing task-related data operations */
  private taskService = inject(TaskService);
  /** Service to show temporary user notifications */
  private toastService = inject(ToastService);
  /** Injected dialog initialization data */
  private data = inject(MAT_DIALOG_DATA);

  /** The task object to display or edit */
  task: Task = this.data.task;
  /** Signal determining if the dialog is in the process of closing */
  isClosing = signal(false);
  /** Signal representing whether edit mode is active */
  isEditing = signal(false);
  /** List of subtasks associated with the current task */
  subtasks: any[] = this.data.subtasks ?? [];
  /** Subscription instance for tracking listener bindings */
  private sub = new Subscription();

  /** Binds listeners to dialogRef on init */
  ngOnInit() {
    this.sub = this.dialogService.setupListeners(this.dialogRef, () => this.closeDialog());
  }

  /** Unsubscribes from dialog listener on destroy */
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /** Initiates the dialog close process */
  closeDialog() {
    this.isClosing.set(true);
    this.dialogService.closeDialog(this.dialogRef);
  }

  /** Deletes the current task from the DB and shows feedback */
  async deleteTask() {
    await this.taskService.deleteTask(String(this.task.id));
    this.toastService.show('Task deleted');
    this.closeDialog();
  }

  /** Switches the dialog state to edit mode */
  editTask() {
    this.isEditing.set(true);
  }

  /**
   * Updates the local task data and disables editing mode once edit changes are saved.
   * 
   * @param event - The saved task details and subtask array.
   */
  onEditSaved(event: { task: Task; subtasks: any[] }) {
    this.task = event.task;
    this.subtasks = event.subtasks;
    this.isEditing.set(false);
  }

  /**
   * Toggles the completion status of a subtask and persists it in the database.
   * 
   * @param subtask - The subtask item to toggle.
   */
  async toggleSubtask(subtask: any) {
    subtask.completed = !subtask.completed;
    await this.taskService.updateSubtaskCompleted(subtask.id, subtask.completed, String(this.task.id));
  }
}
