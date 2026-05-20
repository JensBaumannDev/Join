import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { RouterLink } from '@angular/router';
import { Greetings } from "../../components/greetings/greetings";

@Component({
  selector: 'app-summary',
  imports: [RouterLink, Greetings],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  private taskService = inject(TaskService);
  /** MOBILE GREETING OVERLAY TOGGLE */
  showMobileGreeting = signal(false);

  /** TO DO COUNTER */
  todoCount = computed(() =>
    this.taskService.tasks().filter(task => ['to do', 'todo'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  /** DONE COUNTER*/
  doneCount = computed(() =>
    this.taskService.tasks().filter(task => ['done'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  /** URGENT COUNTER*/
  urgentCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.taskService.tasks().filter(task => {
      if (task.priority?.toLowerCase() !== 'urgent') return false;
      if (task.status?.toLowerCase() === 'done') return false;
      if (task.due_date) {
        const taskDate = new Date(task.due_date);
        if (taskDate < today) return false;
      }
      return true;
    }).length;
  })


  /** URGENT DEADLINE COUNTER*/
  upcomingDeadline = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskWithDates = this.taskService.tasks().filter(task => {
      if (!task.due_date || task.priority?.toLowerCase() !== 'urgent') {
        return false;
      }
      if (task.status?.toLowerCase() === 'done') {
        return false;
      }
      const taskDate = new Date(task.due_date);
      return taskDate >= today;
    });

    if (taskWithDates.length === 0) {
      return null;
    }

    const sortedDates = taskWithDates
      .map(task => new Date(task.due_date))
      .sort((a, b) => a.getTime() - b.getTime());

    const earliestDate = sortedDates[0];

    return earliestDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  /** TASKS IN BOAR COUNTER */
  taskInBoardCount = computed(() =>
    this.taskService.tasks().length
  );

  /** IN PORGRESS COUNTER*/
  inPorgressCount = computed(() =>
    this.taskService.tasks().filter(task => task.status?.toLowerCase() === 'in progress'
    ).length
  );

  /** AWAITING FEEDBACK COUNTER*/
  awaitingFeedbackCount = computed(() =>
    this.taskService.tasks().filter(task => ['await feedback', 'awaitfeedback'].includes(task.status?.toLowerCase() ?? '')
    ).length
  );

  /** INITIALIZES GREETING INTRO AND LOADS TASKS */
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
