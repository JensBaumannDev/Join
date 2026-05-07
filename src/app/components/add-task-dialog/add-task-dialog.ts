import { Component, inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AddTask } from '../../pages/add-task/add-task';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [AddTask],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AddTaskDialog implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddTaskDialog>);
  private dialogService = inject(DialogService);
  private data = inject(MAT_DIALOG_DATA);
  private sub = new Subscription();

  initialStatus: string = this.data?.initialStatus ?? 'To do';

  ngOnInit() {
    this.sub = this.dialogService.setupListeners(this.dialogRef, () => this.closeDialog());
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeDialog() {
    this.dialogService.closeDialog(this.dialogRef);
  }
}