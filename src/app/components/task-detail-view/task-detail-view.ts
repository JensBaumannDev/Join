import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { CategoryBadge } from '../category-badge/category-badge';
import { AvatarComponent } from '../avatar/avatar.component';
import { Task } from '../../interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { ContactService } from '../../services/contact.service';
import { AuthService } from '../../services/auth.service';
import { parseAssignedTo } from '../../utils/task.utils';

/** Component rendering the details of a single task in a overlay panel */
@Component({
  selector: 'app-task-detail-view',
  standalone: true,
  imports: [CategoryBadge, DatePipe, LowerCasePipe, AvatarComponent],
  templateUrl: './task-detail-view.html',
  styleUrl: './task-detail-view.scss',
})
export class TaskDetailView implements AfterViewInit {
  /** Reference to the scrollable content container */
  @ViewChild('detailContent') detailContent!: ElementRef<HTMLElement>;

  /** Signal indicating if the scroll helper arrow should be shown */
  showScrollIndicator = signal(false);

  /** Input property representing the current task details */
  @Input() task!: Task;

  /** Input property representing the subtasks for this task */
  @Input() subtasks: any[] = [];

  /** Event emitted when the detail panel is closed */
  @Output() closed = new EventEmitter<void>();

  /** Event emitted when the task is deleted */
  @Output() deleted = new EventEmitter<void>();

  /** Event emitted when the edit mode is activated */
  @Output() editClicked = new EventEmitter<void>();

  /** Event emitted when a subtask's completion status is toggled */
  @Output() subtaskToggled = new EventEmitter<any>();

  /** Injected TaskService for performing task operations */
  private taskService = inject(TaskService);
  /** Injected ContactService for looking up assignees */
  private contactService = inject(ContactService);
  /** Injected AuthService for looking up current logged-in user state */
  private authService = inject(AuthService);

  /** Resolves the display name of the current authenticated user */
  private get currentUserContactName(): string | null {
    const user = this.authService.currentUser();
    if (!user?.email) return null;
    const contact = this.contactService.contacts().find((c) => c.email === user.email);
    return contact?.name || this.authService.getDisplayName(user);
  }

  /** Resolves and builds contact preview objects for all task assignees */
  get assignees(): { name: string; color?: string; isYou?: boolean }[] {
    const val: any = this.task.assigned_to;
    if (!val) return [];

    const names = parseAssignedTo(val);
    const allContacts = this.contactService.contacts();
    return names.map(name => {
      const color = allContacts.find(c => c.name === name)?.color;
      return {
        name,
        color,
        isYou: name === this.currentUserContactName,
      };
    });
  }

  /** Checks scrollability of the task content after view is rendered */
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.detailContent) {
        this.checkScroll(this.detailContent.nativeElement);
      }
    }, 100);
  }

  /** Triggered on scroll event of the detail container */
  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    this.checkScroll(target);
  }

  /** Evaluates scroll positions to toggle visibility of scroll indicator arrow */
  checkScroll(element: HTMLElement) {
    const isScrollable = element.scrollHeight > element.clientHeight + 10;
    const isAtTop = element.scrollTop < 10;
    this.showScrollIndicator.set(isScrollable && isAtTop);
  }
}
