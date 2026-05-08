import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { DialogService } from '../../services/dialog.service';
import { AddTaskDialog } from '../add-task-dialog/add-task-dialog';

@Component({
  selector: 'app-find-task',
  standalone: true,
  imports: [],
  templateUrl: './find-task.html',
  styleUrl: './find-task.scss',
})
export class FindTask {
  private taskService = inject(TaskService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.taskService.searchTerm.set(input.value.trim());
  }

  openAddTaskDialog() {
    if (window.innerWidth <= 1200) {
      this.router.navigate(['/add-task']);
      return;
    }
    this.dialogService.open(AddTaskDialog, { initialStatus: 'To do' }, 'add-task-dialog-panel');
  }
}
