import { Component, OnInit, OnDestroy, inject, computed, signal, HostListener } from '@angular/core';
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
import { Task } from '../../interfaces/task.interface';
import { FindTask } from '../../components/find-task/find-task';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { parseAssignedTo } from '../../utils/task.utils';

/** Page component managing the kanban board interface and drag-and-drop task workflow */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, CdkDropListGroup, CdkDropList, CdkDrag, FindTask, TaskCardComponent],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board implements OnInit, OnDestroy {
  /** Injected TaskService for performing CRUD and status operations on tasks */
  private taskService = inject(TaskService);
  /** Injected ContactService for retrieving assignees info */
  private contactService = inject(ContactService);
  /** Injected DialogService for managing overlay dialog views */
  private dialogService = inject(DialogService);
  /** Injected Angular Router for navigating between board views */
  private router = inject(Router);
  /** Injected AuthService for accessing current logged-in user state */
  private authService = inject(AuthService);

  /** Signal tracking the current screen width for responsive rendering */
  screenWidth = signal(window.innerWidth);

  /** Updates the screenWidth signal when the window is resized. */
  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
  }

  /** Computed property determining if columns should be displayed horizontally (mobile) or vertically (desktop) */
  listOrientation = computed(() => this.screenWidth() <= 768 ? 'horizontal' : 'vertical');

  /** Computed property adding a delay to drag start on mobile to allow for page scrolling */
  dragDelay = computed(() => this.screenWidth() <= 768 ? 150 : 0);

  /**
   * Opens the detail dialog modal for a specific task.
   * 
   * @param task - The task object to display details for.
   * @returns A promise resolving when the dialog opens.
   */
  openTaskDetailDialog(task: any) {
    this.dialogService.open(TaskDetail, { task, subtasks: task.subtasks || [] }, 'task-dialog-panel');
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


  /**
   * Initializes the board by fetching configuration and tasks.
   */
  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.taskService.getTasks(),
      this.contactService.getContacts()
    ]);
  }


  /**
   * Lifecycle cleanup hook.
   */
  ngOnDestroy(): void {}


  /**
   * Handles same-column task reordering after a drag-and-drop event.
   *
   * @param event - The CdkDragDrop event details.
   * @param movedTask - The task being dragged.
   * @param allTasks - Mutable copy of the full task list.
   * @param fromIdx - Global index of the moved task.
   */
  private async reorderSameColumn(
    event: CdkDragDrop<any[]>, movedTask: any, allTasks: Task[], fromIdx: number
  ): Promise<void> {
    const targetTask = event.container.data[event.currentIndex];
    if (!targetTask || targetTask.id === movedTask.id) return;
    const globalToIdx = allTasks.findIndex(t => t.id === targetTask.id);
    if (globalToIdx === -1) return;
    allTasks.splice(fromIdx, 1);
    const adjustedToIdx = allTasks.findIndex(t => t.id === targetTask.id);
    allTasks.splice(fromIdx < globalToIdx ? adjustedToIdx + 1 : adjustedToIdx, 0, movedTask);
    this.taskService.tasks.set(allTasks);
    await this.taskService.updateTaskPositions(allTasks);
  }


  /**
   * Inserts a task into the global list at the correct position after a cross-column drop.
   *
   * @param event - The CdkDragDrop event details.
   * @param allTasks - Mutable copy of the full task list.
   * @param updatedTask - The task with its new status already set.
   */
  private insertTaskAtDropPosition(event: CdkDragDrop<any[]>, allTasks: Task[], updatedTask: Task): void {
    const targetColumnData = event.container.data;
    if (event.currentIndex < targetColumnData.length) {
      const targetTask = targetColumnData[event.currentIndex];
      const globalToIdx = allTasks.findIndex(t => t.id === targetTask.id);
      allTasks.splice(globalToIdx !== -1 ? globalToIdx : allTasks.length, 0, updatedTask);
    } else {
      allTasks.push(updatedTask);
    }
  }


  /**
   * Handles cross-column task movement after a drag-and-drop event.
   *
   * @param event - The CdkDragDrop event details.
   * @param movedTask - The task being dragged.
   * @param allTasks - Mutable copy of the full task list.
   * @param fromIdx - Global index of the moved task.
   * @param newStatus - The target column status value.
   */
  private async moveToOtherColumn(
    event: CdkDragDrop<any[]>, movedTask: any, allTasks: Task[], fromIdx: number, newStatus: string
  ): Promise<void> {
    const [removedTask] = allTasks.splice(fromIdx, 1);
    const updatedTask = { ...removedTask, status: newStatus };
    this.insertTaskAtDropPosition(event, allTasks, updatedTask);
    this.taskService.tasks.set(allTasks);
    await Promise.all([
      this.taskService.updateTaskStatus(movedTask.id, newStatus),
      this.taskService.updateTaskPositions(allTasks),
    ]);
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
    const allTasks = [...this.taskService.tasks()];
    const globalFromIdx = allTasks.findIndex(t => t.id === movedTask.id);
    if (globalFromIdx === -1) return;
    if (isSameColumn) {
      await this.reorderSameColumn(event, movedTask, allTasks, globalFromIdx);
    } else {
      await this.moveToOtherColumn(event, movedTask, allTasks, globalFromIdx, newStatus);
    }
  }
}