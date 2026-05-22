import { Component, input, OnInit, signal, inject, computed, effect } from '@angular/core';
import { TaskService } from '../../services/task.service';

/** Component representing the progress of subtasks on a task card */
@Component({
  selector: 'app-subtask-progress',
  standalone: true,
  templateUrl: './subtask-progress.html',
  styleUrl: './subtask-progress.scss',
})
export class SubtaskProgress implements OnInit {
  /** Required input for the ID of the task */
  taskId = input.required<string>();

  private taskService = inject(TaskService);

  /** Signal holding the list of subtasks for this task */
  subtaskData = signal<{ id: string; title: string; completed: boolean }[]>([]);

  /** Signal indicating if subtasks are currently loading */
  isLoading = signal(true);

  /** Computed total count of subtasks */
  total = computed(() => this.subtaskData().length);

  /** Computed count of completed subtasks */
  done = computed(() => this.subtaskData().filter(s => s.completed).length);

  /** Computed completion percentage of subtasks */
  percentage = computed(() =>
    this.total() > 0 ? Math.round((this.done() / this.total()) * 100) : 0
  );

  /** Computed tooltip description showing progress details */
  tooltip = computed(() => `${this.done()} von ${this.total()} Subtasks erledigt`);

  constructor() {
    effect(async () => {
      const trigger = this.taskService.subtaskUpdateTrigger();
      if (trigger && this.taskId() && String(trigger.taskId) === String(this.taskId())) {
        await this.loadSubtasks();
      }
    });
  }

  async ngOnInit() {
    await this.loadSubtasks();
  }

  /** Fetches subtask items from the database and sets the local state */
  async loadSubtasks() {
    const result = await this.taskService.getSubtasksForTask(this.taskId());
    this.subtaskData.set(result);
    this.isLoading.set(false);
  }
}
