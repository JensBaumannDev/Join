import { Component, OnInit, inject, computed, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { TaskDetail } from '../../components/task-detail/task-detail';
import { AddTaskDialog } from '../../components/add-task-dialog/add-task-dialog';
import { NgTemplateOutlet } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  CdkDragDrop,
  CdkDropListGroup,
  CdkDropList,
  CdkDrag,
} from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { ContactService } from '../../services/contact.service';
import { AvatarService } from '../../services/avatar.service';
import { Task } from '../../interfaces/task.interface';
import { FindTask } from '../../components/find-task/find-task';
import { CategoryBadge } from '../../components/category-badge/category-badge';
import { SubtaskProgress } from '../../components/subtask-progress/subtask-progress';
import { parseAssignedTo } from '../../utils/task.utils';

/** Page component managing the kanban board interface and drag-and-drop task workflow */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, FindTask, CategoryBadge, SubtaskProgress],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board implements OnInit {
  /** Injected TaskService for performing CRUD and status operations on tasks */
  private taskService = inject(TaskService);
  /** Injected ContactService for retrieving assignees info */
  private contactService = inject(ContactService);
  /** Injected AvatarService for resolving user visual avatar settings */
  private avatarService = inject(AvatarService);
  /** Injected DialogService for managing overlay dialog views */
  private dialogService = inject(DialogService);
  /** Injected Angular Router for navigating between board views */
  private router = inject(Router);
  /** Injected AuthService for accessing current logged-in user state */
  private authService = inject(AuthService);

  /** Signal tracking the current screen width for responsive rendering */
  screenWidth = signal(window.innerWidth);

  /** State for the avatar popup */
  avatarPopup = signal<{ visible: boolean; x: number; bottom?: number; top?: number; maxHeight: number; assignments: any[] }>({
    visible: false,
    x: 0,
    maxHeight: 400,
    assignments: [],
  });

  /**
   * Toggles the display state of the assignee avatar overlay popup.
   * Computes the alignment and maximum height based on available screen space.
   * 
   * @param event - The mouse click event.
   * @param task - The active task object.
   */
  toggleAvatarPopup(event: MouseEvent, task: Task) {
    event.stopPropagation();
    if (this.avatarPopup().visible) {
      this.avatarPopup.update(p => ({ ...p, visible: false }));
      return;
    }
    
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const assignments = this.getTaskAssignments(task);
    const headerHeight = 95;
    const margin = 12;
    
    // Check space above
    const spaceAbove = rect.top - headerHeight - margin;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    
    let bottom: number | undefined;
    let top: number | undefined;
    let maxHeight: number;

    if (spaceAbove > 150 || spaceAbove > spaceBelow) {
      // Show above
      bottom = window.innerHeight - rect.top + 8;
      maxHeight = Math.min(400, spaceAbove);
    } else {
      // Show below
      top = rect.bottom + 8;
      maxHeight = Math.min(400, spaceBelow);
    }
    
    this.avatarPopup.set({
      visible: true,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 262)),
      bottom: bottom as number,
      top: top as number,
      maxHeight,
      assignments,
    });
  }

  /** Closes the avatar popup overlay. */
  @HostListener('document:click')
  closeAvatarPopup() {
    if (this.avatarPopup().visible) {
      this.avatarPopup.update(p => ({ ...p, visible: false }));
    }
  }

  /** Updates the screenWidth signal when the window is resized. */
  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
  }

  /** Computed property determining if columns should be displayed horizontally (mobile) or vertically (desktop) */
  listOrientation = computed(() => this.screenWidth() <= 1024 ? 'horizontal' : 'vertical');

  /** Computed property adding a delay to drag start on mobile to allow for page scrolling */
  dragDelay = computed(() => this.screenWidth() <= 1024 ? 150 : 0);

  /**
   * Opens the detail dialog modal for a specific task.
   * 
   * @param task - The task object to display details for.
   * @returns A promise resolving when the dialog opens.
   */
  async openTaskDetailDialog(task: any) {
    const subtasks = await this.taskService.getSubtasksForTask(task.id);
    this.dialogService.open(TaskDetail, { task, subtasks }, 'task-dialog-panel');
  }

  /**
   * Opens the add-task interface (navigates on mobile, opens modal on desktop).
   * 
   * @param status - The initial status/column category for the new task.
   */
  openAddTaskDialog(status: string) {
    if (this.screenWidth() <= 1200) {
      this.router.navigate(['/add-task']);
      return;
    }
    this.dialogService.open(AddTaskDialog, { initialStatus: status }, 'add-task-dialog-panel');
  }

  /**
   * Computes statistics for the subtasks of a given task.
   * 
   * @param task - The target task object.
   * @returns An object containing done count, total count, and percentage, or null if there are no subtasks.
   */
  getSubtaskStats(task: Task): { done: number; total: number; percentage: number } | null {
    const subtasks = (task as any).subtasks;
    if (!subtasks || subtasks.length === 0) return null;
    const total = subtasks.length;
    const done = subtasks.filter((s: any) => s.done || s.completed || s.is_done).length;
    return { done, total, percentage: Math.round((done / total) * 100) };
  }

  /**
   * Maps raw string names or assignments of a task into structured contact assignment objects.
   * 
   * @param task - The task to parse assignments for.
   * @param allContacts - The master list of all contact records to match against.
   * @returns An array of enriched assignment objects.
   */
  private parseTaskAssignments(task: Task, allContacts: any[]): any[] {
    if (task.task_assignments && task.task_assignments.length > 0) {
      return task.task_assignments;
    }

    const val: any = task.assigned_to;
    if (!val) return [];

    const names = parseAssignedTo(val);
    return names.map(name => {
      const contact = allContacts.find(c => c.name === name);
      const assignment = {
        name: name,
        color: contact?.color,
        contact: contact,
      };
      return {
        ...assignment,
        isYou: this.isCurrentUserAssignment(assignment),
      };
    });
  }

  /** All tasks filtered by the search term and enriched with pre-computed contact assignments */
  filteredTasks = computed(() => {
    const term = this.taskService.searchTerm().toLowerCase();
    const tasks = this.taskService.tasks();
    const allContacts = this.contactService.contacts();
    
    const enriched = tasks.map(t => {
      const assignments = this.parseTaskAssignments(t, allContacts);
      return {
        ...t,
        assignments
      };
    });

    if (!term) return enriched;
    return enriched.filter(t =>
      (t.title?.toLowerCase() ?? '').includes(term) ||
      (t.description?.toLowerCase() ?? '').includes(term) ||
      (t.category?.toLowerCase() ?? '').includes(term)
    );
  });

  /** Computed list of tasks currently in the 'To do' status */
  todo = computed(() => this.filteredTasks().filter(t =>
    ['to do', 'todo'].includes(t.status?.toLowerCase() ?? '')
  ));

  /** Computed list of tasks currently in the 'In progress' status */
  in_progress = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'in progress'
  ));

  /** Computed list of tasks currently in the 'Await feedback' status */
  await_feedback = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'await feedback'
  ));

  /** Computed list of tasks currently in the 'Done' status */
  done = computed(() => this.filteredTasks().filter(t =>
    t.status?.toLowerCase() === 'done'
  ));

  /** Configuration defining columns, labels, and task lists */
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
      this.contactService.getContacts()
    ]);
  }

  /**
   * Resolves the static SVG file path for a task's priority level.
   * 
   * @param priority - The priority string (e.g. 'urgent', 'medium', 'low').
   * @returns The relative file path to the SVG asset.
   */
  getPriorityIcon(priority: string): string {
    const p = priority?.toLowerCase();
    return `./icons/board/prio-${p === 'urgent' || p === 'medium' || p === 'low' ? p : 'low'}.svg`;
  }

  /**
   * Retrieves initials and color configuration for a specific assignment.
   * 
   * @param assignment - The assignment object containing contact details.
   * @returns An object with initials and background color.
   */
  getContactInfo(assignment: any) {
    const name = assignment.contact?.name || assignment.name || 'Unknown';
    const color = assignment.contact?.color || assignment.color;
    return this.avatarService.getAvatarData(name, color);
  }

  /** Getter resolving the name of the current authenticated user */
  private get currentUserContactName(): string | null {
    const user = this.authService.currentUser();
    if (!user?.email) return null;
    const contact = this.contactService.contacts().find((c) => c.email === user.email);
    return contact?.name || this.authService.getDisplayName(user);
  }

  /**
   * Checks if a given assignment belongs to the currently logged in user.
   * 
   * @param assign - The assignment object.
   * @returns True if it matches the current user, false otherwise.
   */
  private isCurrentUserAssignment(assign: any): boolean {
    const name = assign.contact?.name || assign.name;
    return !!name && name === this.currentUserContactName;
  }

  /**
   * Generates a descriptive string for an assignment, appending '(You)' if it matches the active user.
   * 
   * @param assign - The assignment object.
   * @returns The generated display name label.
   */
  getAssignmentLabel(assign: any): string {
    const name = assign.contact?.name || assign.name || 'Unknown';
    return this.isCurrentUserAssignment(assign) ? `${name} (You)` : name;
  }

  /**
   * Returns pre-computed contact assignments for a task.
   * 
   * @param task - The target task object.
   * @returns An array of assignment objects.
   */
  getTaskAssignments(task: Task): any[] {
    return (task as any).assignments || [];
  }

  /**
   * Handles the CDK drag & drop event when moving tasks within or between columns.
   * Persists new positions and column status updates directly in the database.
   * 
   * @param event - The CdkDragDrop event details.
   * @returns A promise resolving when positions have been updated.
   */
  async drop(event: CdkDragDrop<any[]>) {
    const movedTask = event.previousContainer.data[event.previousIndex];
    const isSameColumn = event.previousContainer === event.container;
    const newStatus = event.container.id;

    // Work on a mutable copy of the global tasks array
    const allTasks = [...this.taskService.tasks()];
    const globalFromIdx = allTasks.findIndex(t => t.id === movedTask.id);
    if (globalFromIdx === -1) return;

    if (isSameColumn) {
      // Same column: reorder by finding the target card's global position
      const targetTask = event.container.data[event.currentIndex];
      if (!targetTask || targetTask.id === movedTask.id) return;

      const globalToIdx = allTasks.findIndex(t => t.id === targetTask.id);
      if (globalToIdx === -1) return;

      allTasks.splice(globalFromIdx, 1);
      const adjustedToIdx = allTasks.findIndex(t => t.id === targetTask.id);
      // Moving forward → insert after target; moving backward → insert before target
      allTasks.splice(globalFromIdx < globalToIdx ? adjustedToIdx + 1 : adjustedToIdx, 0, movedTask);
      this.taskService.tasks.set(allTasks);
      await this.taskService.updateTaskPositions(allTasks);
    } else {
      // Cross-column: update status and insert at the exact drop position
      const [removedTask] = allTasks.splice(globalFromIdx, 1);
      const updatedTask = { ...removedTask, status: newStatus };

      const targetColumnData = event.container.data;
      if (event.currentIndex < targetColumnData.length) {
        // Insert before the card currently at the drop position
        const targetTask = targetColumnData[event.currentIndex];
        const globalToIdx = allTasks.findIndex(t => t.id === targetTask.id);
        allTasks.splice(globalToIdx !== -1 ? globalToIdx : allTasks.length, 0, updatedTask);
      } else {
        // Dropped at the end of the column
        allTasks.push(updatedTask);
      }

      this.taskService.tasks.set(allTasks);
      await Promise.all([
        this.taskService.updateTaskStatus(movedTask.id, newStatus),
        this.taskService.updateTaskPositions(allTasks),
      ]);
    }
  }
}