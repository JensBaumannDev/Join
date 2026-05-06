import { Component, inject, ViewEncapsulation, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CategoryBadge } from '../category-badge/category-badge';
import { Task } from '../../interfaces/task.interface';
// import { Supabase } from '../service'; ANPASSEN LINK

@Component({
  selector: 'app-task-detail',
  imports: [CategoryBadge],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TaskDetail implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<TaskDetail>);
  task: Task = inject(MAT_DIALOG_DATA).task;
  private subscriptions = new Subscription();
  // private supabase = inject(Supabase);

  isClosing = signal(false);

  ngOnInit() {
    this.subscriptions.add(
      this.dialogRef.backdropClick().subscribe(() => {
        this.closeDialog();
      })
    );

    this.subscriptions.add(
      this.dialogRef.keydownEvents()
        .pipe(filter(event => event.key === 'Escape'))
        .subscribe(() => {
          this.closeDialog();
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  closeDialog() {
    this.isClosing.set(true);
    this.dialogRef.addPanelClass('slide-out');
    setTimeout(() => {
      this.dialogRef.close();
    }, 500);
  }
}
