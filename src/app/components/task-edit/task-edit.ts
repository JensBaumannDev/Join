import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { AddTask } from '../../pages/add-task/add-task';

/** Component embedding the AddTask component in edit-mode for updating an existing task */
@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [AddTask],
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  /** The input task instance to edit */
  @Input() task!: Task;
  /** Subtasks of the input task */
  @Input() subtasks: any[] = [];

  /** Event emitted when editing changes are successfully saved */
  @Output() saved = new EventEmitter<{ task: Task; subtasks: any[] }>();
  /** Event emitted when editing mode is closed/canceled */
  @Output() closed = new EventEmitter<void>();

  /** Injectable TaskService to query and sync task changes */
  private taskService = inject(TaskService);

  /** Callback triggered when save completes to notify parent component with refreshed data */
  async onSaved() {
    const updated = this.taskService.tasks().find(t => String(t.id) === String(this.task.id));
    const refreshedTask = updated ?? this.task;
    const refreshedSubtasks = await this.taskService.getSubtasksForTask(String(this.task.id));
    this.saved.emit({ task: refreshedTask, subtasks: refreshedSubtasks });
  }
}
