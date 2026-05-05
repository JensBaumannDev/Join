import { Component, OnInit, inject, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CdkDragDrop,
  CdkDropListGroup,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { AvatarService } from '../../services/avatar.service';
import { Task } from '../../interfaces/task.interface';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class BoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private avatarService = inject(AvatarService);

  /** Filtered tasks for the 'To do' column */
  todo = computed(() => this.taskService.tasks().filter(t =>
    ['to do', 'todo'].includes(t.status?.toLowerCase() ?? '')
  ));

  /** Filtered tasks for the 'In progress' column */
  in_progress = computed(() => this.taskService.tasks().filter(t =>
    t.status?.toLowerCase() === 'in progress'
  ));

  /** Filtered tasks for the 'Await feedback' column */
  await_feedback = computed(() => this.taskService.tasks().filter(t =>
    t.status?.toLowerCase() === 'await feedback'
  ));

  /** Filtered tasks for the 'Done' column */
  done = computed(() => this.taskService.tasks().filter(t =>
    t.status?.toLowerCase() === 'done'
  ));

  /** Configuration for each column in the kanban board */
  columns = [
    { id: 'to do',         configKey: 'to_do',          label: 'To do',          tasks: this.todo },
    { id: 'in progress',   configKey: 'in_progress',     label: 'In progress',    tasks: this.in_progress },
    { id: 'await feedback',configKey: 'await_feedback',  label: 'Await feedback', tasks: this.await_feedback },
    { id: 'done',          configKey: 'done',            label: 'Done',           tasks: this.done },
  ];

  /** Retrieves the current board configuration from the task service */
  get boardConfig() {
    return this.taskService.boardConfig();
  }

  /** Initializes the board by fetching configuration and tasks */
  async ngOnInit() {
    await Promise.all([
      this.taskService.getBoardConfig(),
      this.taskService.getTasks(),
      this.taskService.getContacts()
    ]);
  }

  /** Calculates progress stats for the subtasks of a given task */
  getSubtaskStats(task: Task) {
    let subtasks = task.subtasks;

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!! PLACEHOLDER START !!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (!subtasks || subtasks.length === 0) {
      subtasks = [
        { title: 'Subtask 1', is_done: true },
        { title: 'Subtask 2', is_done: false }
      ];
    }
    // !!!!!!!!!!!!!!!!!!!!!! PLACEHOLDER END !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    const done = subtasks.filter(s => s.is_done).length;
    const total = subtasks.length;
    return { done, total, percentage: (done / total) * 100 };
  }

  /** Returns the file path for the priority icon based on the priority level */
  getPriorityIcon(priority: string): string {
    const p = priority?.toLowerCase();
    return `/icons/board/prio-${p === 'urgent' || p === 'medium' || p === 'low' ? p : 'low'}.svg`;
  }

  /** Retrieves initials and color data for a specific contact assignment */
  getContactInfo(assignment: any) {
    const name = assignment.contact?.name || assignment.name || 'Unknown';
    return this.avatarService.getAvatarData(name);
  }

  /** Returns assignments for a task, with real contacts as fallback for preview */
  getTaskAssignments(task: Task): any[] {
    if (task.task_assignments && task.task_assignments.length > 0) {
      return task.task_assignments;
    }
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!! PLACEHOLDER START !!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const contacts = this.taskService.contacts();
    if (contacts.length > 0) {
      const idStr = String(task.id);
      const charCodeSum = idStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const count = (charCodeSum % 2) + 2; // Always 2 or 3
      return contacts.slice(0, count);
    }
    // !!!!!!!!!!!!!!!!!!!!!! PLACEHOLDER END !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    return [];
  }

  /** Returns a deterministic color for a task category */
  getCategoryColor(category: string): string {
    return this.avatarService.getColor(category + ' category');
  }

  /** Handles the drag and drop event for moving tasks between columns */
  async drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      await this.taskService.updateTaskStatus(task.id, newStatus);
      await this.taskService.getTasks();
    }
  }
}
