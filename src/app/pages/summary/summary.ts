import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { RouterLink } from '@angular/router';
import { Greetings } from "../../components/greetings/greetings";

/** Dashboard summary component providing statistics on tasks and deadlines */
@Component({
  selector: 'app-summary',
  imports: [RouterLink, Greetings],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  /** Injectable TaskService to query tasks and compute counters */
  private taskService = inject(TaskService);
  /** Signal determining visibility of the mobile greeting overlay */
  showMobileGreeting = signal(false);

  /** Computed number of tasks with a 'to do' status */
  todoCount = computed(() =>
    this.taskService.tasks().filter(task => ['to do', 'todo'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  /** Computed number of tasks with a 'done' status */
  doneCount = computed(() =>
    this.taskService.tasks().filter(task => ['done'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  private getTodayStart(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private isUrgentPending(task: any, today: Date): boolean {
    if (task.priority?.toLowerCase() !== 'urgent') return false;
    if (task.status?.toLowerCase() === 'done') return false;
    if (task.due_date && new Date(task.due_date) < today) return false;
    return true;
  }

  private getUrgentTasksWithDates(today: Date) {
    return this.taskService.tasks().filter(task => {
      if (!task.due_date || task.priority?.toLowerCase() !== 'urgent') return false;
      if (task.status?.toLowerCase() === 'done') return false;
      return new Date(task.due_date) >= today;
    });
  }

  private formatDeadlineDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /** Computed number of pending tasks with an 'urgent' priority */
  urgentCount = computed(() => {
    const today = this.getTodayStart();
    return this.taskService.tasks().filter(t => this.isUrgentPending(t, today)).length;
  });

  /** Computed formatted earliest due date among pending urgent tasks */
  upcomingDeadline = computed(() => {
    const today = this.getTodayStart();
    const tasks = this.getUrgentTasksWithDates(today);
    if (tasks.length === 0) return null;

    const sorted = tasks
      .map(t => new Date(t.due_date))
      .sort((a, b) => a.getTime() - b.getTime());
    return this.formatDeadlineDate(sorted[0]);
  });

  /** Computed total number of tasks in the workspace */
  taskInBoardCount = computed(() =>
    this.taskService.tasks().length
  );

  /** Computed number of tasks with an 'in progress' status */
  inProgressCount = computed(() =>
    this.taskService.tasks().filter(task => task.status?.toLowerCase() === 'in progress'
    ).length
  );

  /** Computed number of tasks awaiting feedback */
  awaitingFeedbackCount = computed(() =>
    this.taskService.tasks().filter(task => ['await feedback', 'awaitfeedback'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  /** Triggers the introductory greeting once per session and fetches tasks */
  ngOnInit() {
    const alreadySeen = sessionStorage.getItem('greetingShown');

    if (!alreadySeen) {
      this.showMobileGreeting.set(true);
      sessionStorage.setItem('greetingShown', 'true');

      setTimeout(() => this.showMobileGreeting.set(false), 3000);
    }
    this.taskService.getTasks();
  }
}
