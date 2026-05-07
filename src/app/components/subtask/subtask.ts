import { Component, input, OnInit, signal, inject, computed, effect } from '@angular/core';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-subtask',
  standalone: true,
  templateUrl: './subtask.html',
  styleUrl: './subtask.scss',
})
export class Subtask implements OnInit {
  taskId = input.required<string>();

  private taskService = inject(TaskService);

  subtasks = signal<{ id: string; title: string; completed: boolean }[]>([]);
  isLoading = signal(true);

  total = computed(() => this.subtasks().length);
  done = computed(() => this.subtasks().filter(s => s.completed).length);
  percentage = computed(() =>
    this.total() > 0 ? Math.round((this.done() / this.total()) * 100) : 0
  );
  tooltip = computed(() => `${this.done()} von ${this.total()} Subtasks erledigt`);

  constructor() {
    effect(async () => {
      const trigger = this.taskService.subtaskUpdateTrigger();
      if (trigger && String(trigger.taskId) === String(this.taskId())) {
        await this.loadSubtasks();
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    await this.loadSubtasks();
  }

  async loadSubtasks() {
    const result = await this.taskService.getSubtasksForTask(this.taskId());
    this.subtasks.set(result);
    this.isLoading.set(false);
  }
}