import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SubtaskItem {
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-subtask-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subtask-input.html',
  styleUrl: './subtask-input.scss',
})
/** Component managing the creation and editing of subtasks inside a task form */
export class SubtaskInput {
  /** Inputs the list of subtask items */
  @Input() subtasks: SubtaskItem[] = [];

  /** Emitter that broadcasts updates to the subtasks list */
  @Output() subtasksChange = new EventEmitter<SubtaskItem[]>();

  /** Current input text for a new subtask */
  inputValue = '';

  /** Tracks whether the subtask input field has focus */
  inputFocus = false;

  /** Index of the subtask item currently being edited */
  editingIndex: number | null = null;

  /** Temporary editing value for the active subtask */
  editingValue = '';

  /** Appends a new subtask to the list and resets the input field */
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

  /** Removes a subtask from the list by its index */
  remove(index: number) {
    this.subtasksChange.emit(this.subtasks.filter((_, i) => i !== index));
    if (this.editingIndex === index) this.editingIndex = null;
  }

  /** Sets a subtask item into editing mode and initializes its editing value */
  edit(index: number) {
    this.editingIndex = index;
    this.editingValue = this.subtasks[index].title;
  }

  /** Saves the edited subtask value back to the list and exits editing mode */
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
