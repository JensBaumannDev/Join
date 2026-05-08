import { Component, inject } from '@angular/core';
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

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.taskService.searchTerm.set(input.value.trim());
  }

  openAddTaskDialog() {
    this.dialogService.open(AddTaskDialog, { initialStatus: 'To do' }, 'add-task-dialog-panel');
  }
}
