import { Component, input, computed } from '@angular/core';

/** Component representing the progress of subtasks on a task card */
@Component({
  selector: 'app-subtask-progress',
  standalone: true,
  templateUrl: './subtask-progress.html',
  styleUrl: './subtask-progress.scss',
})
export class SubtaskProgress {
  /** Input representing the subtasks for this task */
  subtasks = input<any[]>([]);

  /** Computed total count of subtasks */
  total = computed(() => this.subtasks()?.length || 0);

  /** Computed count of completed subtasks */
  done = computed(() => this.subtasks()?.filter((s) => s.completed).length || 0);

  /** Computed completion percentage of subtasks */
  percentage = computed(() =>
    this.total() > 0 ? Math.round((this.done() / this.total()) * 100) : 0
  );

  /** Computed tooltip description showing progress details */
  tooltip = computed(() => `${this.done()} von ${this.total()} Subtasks erledigt`);
}

