import { Component, inject, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AddTask } from '../../pages/add-task/add-task';
import { DialogService } from '../../services/dialog.service';

/** Dialog component for adding tasks in a modal view */
@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [AddTask],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AddTaskDialog implements OnInit, OnDestroy {
  /** Reference to the current dialog */
  private dialogRef = inject(MatDialogRef<AddTaskDialog>);
  /** Service to manage dialog states */
  private dialogService = inject(DialogService);
  /** Angular Router for navigation */
  private router = inject(Router);
  /** Injected dialog data containing initial task status */
  private data = inject(MAT_DIALOG_DATA);
  /** Subscription to manage cleanup on destroy */
  private sub = new Subscription();

  /** Initial status for the new task */
  initialStatus: string = this.data?.initialStatus ?? 'To do';

  /** Closes dialog and routes to add-task page if screen size shrinks below 1200px */
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth <= 1200) {
      this.dialogRef.close();
      this.router.navigate(['/add-task']);
    }
  }

  /** Sets up dialog listener subscription on initialization */
  ngOnInit() {
    this.sub = this.dialogService.setupListeners(this.dialogRef, () => this.closeDialog());
  }

  /** Unsubscribes from active subscriptions on component destruction */
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /** Triggers the dialog close operation */
  closeDialog() {
    this.dialogService.closeDialog(this.dialogRef);
  }
}