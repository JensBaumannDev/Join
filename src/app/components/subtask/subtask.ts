import { Component, input, OnInit, signal, inject, computed, effect, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';

export interface SubtaskItem {
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-subtask',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subtask.html',
  styleUrl: './subtask.scss',
})
export class Subtask implements OnInit {
  taskId = input<string>();

  @Input() subtasks: SubtaskItem[] = [];
  @Output() subtasksChange = new EventEmitter<SubtaskItem[]>();

  private taskService = inject(TaskService);

  subtaskData = signal<{ id: string; title: string; completed: boolean }[]>([]);
  isLoading = signal(true);

  total = computed(() => this.subtaskData().length);
  done = computed(() => this.subtaskData().filter(s => s.completed).length);
  percentage = computed(() =>
    this.total() > 0 ? Math.round((this.done() / this.total()) * 100) : 0
  );
  tooltip = computed(() => `${this.done()} von ${this.total()} Subtasks erledigt`);

  inputValue = '';
  inputFocus = false;
  editingIndex: number | null = null;
  editingValue = '';

  get isFormMode(): boolean {
    return !this.taskId();
  }

  constructor() {
    effect(async () => {
      const trigger = this.taskService.subtaskUpdateTrigger();
      if (trigger && this.taskId() && String(trigger.taskId) === String(this.taskId())) {
        await this.loadSubtasks();
      }
    });
  }

  async ngOnInit() {
    if (this.taskId()) {
      await this.loadSubtasks();
    }
  }

  async loadSubtasks() {
    const result = await this.taskService.getSubtasksForTask(this.taskId()!);
    this.subtaskData.set(result);
    this.isLoading.set(false);
  }

  add() {
    if (this.inputValue.trim()) {
      this.subtasksChange.emit([
        ...this.subtasks,
        { title: this.inputValue.trim(), completed: false },
      ]);
      this.inputValue = '';
      this.editingIndex = null;
    }
  }

  remove(index: number) {
    this.subtasksChange.emit(this.subtasks.filter((_, i) => i !== index));
    if (this.editingIndex === index) this.editingIndex = null;
  }

  edit(index: number) {
    this.editingIndex = index;
    this.editingValue = this.subtasks[index].title;
  }

  save(index: number) {
    if (this.editingValue.trim()) {
      const updated = [...this.subtasks];
      updated[index] = { ...updated[index], title: this.editingValue.trim() };
      this.subtasksChange.emit(updated);
    }
    this.editingIndex = null;
    this.editingValue = '';
  }
}