import { Component, inject } from '@angular/core';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-find-task',
  standalone: true,
  imports: [],
  templateUrl: './find-task.html',
  styleUrl: './find-task.scss',
})
export class FindTask {
  private taskService = inject(TaskService);

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.taskService.searchTerm.set(input.value.trim());
  }
}
