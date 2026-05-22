import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { DialogService } from '../../services/dialog.service';
import { AddTaskDialog } from '../add-task-dialog/add-task-dialog';

/** Component for filtering tasks and opening the add task interface */
@Component({
  selector: 'app-find-task',
  standalone: true,
  imports: [],
  templateUrl: './find-task.html',
  styleUrl: './find-task.scss',
})
export class FindTask {
  /** Injectable TaskService for managing task state and filters */
  private taskService = inject(TaskService);
  /** Injectable DialogService for managing dialog displays */
  private dialogService = inject(DialogService);
  /** Angular Router for navigation */
  private router = inject(Router);

  /**
   * Updates the search term inside taskService from the input element value.
   * 
   * @param event - The input change or keyup event.
   */
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.taskService.searchTerm.set(input.value.trim());
  }

  /** Opens the add task dialog or routes to add-task page depending on window width */
  openAddTaskDialog() {
    if (window.innerWidth <= 1200) {
      this.router.navigate(['/add-task']);
      return;
    }
    this.dialogService.open(AddTaskDialog, { initialStatus: 'To do' }, 'add-task-dialog-panel');
  }
}
