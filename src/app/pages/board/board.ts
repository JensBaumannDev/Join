import { Component, OnInit, inject, computed } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { TaskDetail } from '../../components/task-detail/task-detail';
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
import { FindTask } from '../../components/find-task/find-task';
import { CategoryBadge } from '../../components/category-badge/category-badge';
import { Subtask } from '../../components/subtask/subtask';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, FindTask, CategoryBadge, Subtask],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board implements OnInit {
  private taskService = inject(TaskService);
  private avatarService = inject(AvatarService);
  private dialogService = inject(DialogService);

  async openTaskDetailDialog(task: any) {
    const subtasks = await this.taskService.getSubtasksForTask(task.id);
    this.dialogService.open(TaskDetail, { task, subtasks }, 'task-dialog-panel');
  }

  /** All tasks filtered by the search term */
  filteredTasks = computed(() => {
    const term = this.taskService.searchTerm().toLowerCase();
    const tasks = this.taskService.tasks();
    if (!term) return tasks;
    return tasks.filter(t =>
      (t.title?.toLowerCase() ?? '').includes(term) ||
      (t.description?.toLowerCase() ?? '').includes(term) ||
      (t.category?.toLowerCase() ?? '').includes(term)
    );
  });

  /** Filtered tasks for the 'To do' column */
  todo = computed(() => this.filteredTasks().filter(t =>
    ['to do', 'todo'].includes(t.status?.toLowerCase() ?? '')
  ));

  /** Filtered tasks for the 'In progress' column */
  in_progress = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'in progress'
  ));

  /** Filtered tasks for the 'Await feedback' column */
  await_feedback = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'await feedback'
  ));

  /** Filtered tasks for the 'Done' column */
  done = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'done'
  ));

  /** Configuration for each column in the kanban board */
  columns = [
    { id: 'to do', configKey: 'to_do', label: 'To do', tasks: this.todo },
    { id: 'in progress', configKey: 'in_progress', label: 'In progress', tasks: this.in_progress },
    { id: 'await feedback', configKey: 'await_feedback', label: 'Await feedback', tasks: this.await_feedback },
    { id: 'done', configKey: 'done', label: 'Done', tasks: this.done },
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

  /** Returns the file path for the priority icon based on the priority level */
  getPriorityIcon(priority: string): string {
    const p = priority?.toLowerCase();
    return `/icons/board/prio-${p === 'urgent' || p === 'medium' || p === 'low' ? p : 'low'}.svg`;
  }

  /** Retrieves initials and color data for a specific contact assignment */
  getContactInfo(assignment: any) {
    const name = assignment.contact?.name || assignment.name || 'Unknown';
    const color = assignment.contact?.color || assignment.color;
    return this.avatarService.getAvatarData(name, color);
  }

  /** Returns assignments for a task, prioritizing task_assignments but falling back to assigned_to names */
  getTaskAssignments(task: Task): any[] {
    if (task.task_assignments && task.task_assignments.length > 0) {
      return task.task_assignments;
    }

    // Parse assigned_to array of names and match them to real contacts
    const val = task.assigned_to;
    if (!val) return [];

    let names: string[] = [];
    if (Array.isArray(val)) {
      names = val;
    } else {
      names = (val as unknown as string).split(',').map(n => n.trim()).filter(n => n.length > 0);
    }

    const allContacts = this.taskService.contacts();

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!! PLACEHOLDER START !!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!   ONLY FOR TESTING  !!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TEMPORARY PLACEHOLDER: Ensure at least 2-3 contacts for visual testing
    if (names.length < 2 && allContacts.length >= 3) {
      const idStr = String(task.id);
      const charCodeSum = idStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const count = (charCodeSum % 2) + 2; // Always 2 or 3
      const startIndex = charCodeSum % (allContacts.length - count);

      const placeholderContacts = allContacts.slice(startIndex, startIndex + count);
      return placeholderContacts.map(c => ({
        name: c.name,
        color: c.color,
        contact: c
      }));
    }
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!  PLACEHOLDER END  !!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    return names.map(name => {
      const contact = allContacts.find(c => c.name === name);
      return {
        name: name,
        color: contact?.color,
        contact: contact
      };
    });
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