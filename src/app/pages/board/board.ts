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

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, FindTask, CategoryBadge, SubtaskProgress],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
/** Page component managing the kanban board interface and drag-and-drop task workflow */
export class Board implements OnInit {
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private avatarService = inject(AvatarService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
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

  /** Shows the avatar popup on click of the contact list */
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

  /** Closes the avatar popup when clicking anywhere else on the document */
  @HostListener('document:click')
  closeAvatarPopup() {
    if (this.avatarPopup().visible) {
      this.avatarPopup.update(p => ({ ...p, visible: false }));
    }
  }

  /** Updates the screenWidth signal when the window is resized */
  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
  }

  /** Computed property determining if columns should be displayed horizontally (mobile) or vertically (desktop) */
  listOrientation = computed(() => this.screenWidth() <= 1024 ? 'horizontal' : 'vertical');

  /** Computed property adding a delay to drag start on mobile to allow for page scrolling */
  dragDelay = computed(() => this.screenWidth() <= 1024 ? 150 : 0);

  /** Opens the detail dialog for a specific task */
  async openTaskDetailDialog(task: any) {
    const subtasks = await this.taskService.getSubtasksForTask(task.id);
    this.dialogService.open(TaskDetail, { task, subtasks }, 'task-dialog-panel');
  }

  /** Navigates to the add-task page on mobile or opens the add-task dialog on desktop */
  openAddTaskDialog(status: string) {
    if (this.screenWidth() <= 1200) {
      this.router.navigate(['/add-task']);
      return;
    }
    this.dialogService.open(AddTaskDialog, { initialStatus: status }, 'add-task-dialog-panel');
  }

  /** Returns done/total/percentage stats for subtasks of a task */
  getSubtaskStats(task: Task): { done: number; total: number; percentage: number } | null {
    const subtasks = (task as any).subtasks;
    if (!subtasks || subtasks.length === 0) return null;
    const total = subtasks.length;
    const done = subtasks.filter((s: any) => s.done || s.completed || s.is_done).length;
    return { done, total, percentage: Math.round((done / total) * 100) };
  }



  /** Parses raw task assignees into mapped contact objects */
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

  /** Returns the file path for the priority icon based on the priority level */
  getPriorityIcon(priority: string): string {
    const p = priority?.toLowerCase();
    return `./icons/board/prio-${p === 'urgent' || p === 'medium' || p === 'low' ? p : 'low'}.svg`;
  }

  /** Retrieves initials and color data for a specific contact assignment */
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

  /** Helper checking if an assignment matches the current user */
  private isCurrentUserAssignment(assign: any): boolean {
    const name = assign.contact?.name || assign.name;
    return !!name && name === this.currentUserContactName;
  }

  /** Resolves label for assignment, appending '(You)' if appropriate */
  getAssignmentLabel(assign: any): string {
    const name = assign.contact?.name || assign.name || 'Unknown';
    return this.isCurrentUserAssignment(assign) ? `${name} (You)` : name;
  }

  /** Returns assignments for a task, prioritizing task_assignments but falling back to assigned_to names */
  getTaskAssignments(task: Task): any[] {
    return (task as any).assignments || [];
  }

  /** Handles the drag and drop event for moving tasks between columns */
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