import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { AddTask } from '../../pages/add-task/add-task';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [AddTask],
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  @Input() task!: Task;
  @Input() subtasks: any[] = [];

  @Output() saved = new EventEmitter<{ task: Task; subtasks: any[] }>();
  @Output() closed = new EventEmitter<void>();

  private taskService = inject(TaskService);

  async onSaved() {
    const updated = this.taskService.tasks().find(t => String(t.id) === String(this.task.id));
    const refreshedTask = updated ?? this.task;
    const refreshedSubtasks = await this.taskService.getSubtasksForTask(String(this.task.id));
    this.saved.emit({ task: refreshedTask, subtasks: refreshedSubtasks });
  }
}
