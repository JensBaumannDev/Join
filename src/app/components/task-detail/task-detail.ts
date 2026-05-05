import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-task-detail',
  imports: [],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
})
export class TaskDetail {
  private dialogRef = inject(MatDialogRef<TaskDetail>);

  closeDialog() {
    this.dialogRef.close();
  }
}
