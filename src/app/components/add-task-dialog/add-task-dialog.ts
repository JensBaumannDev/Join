import { Component, inject, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private data = inject(MAT_DIALOG_DATA);
  private sub = new Subscription();

  initialStatus: string = this.data?.initialStatus ?? 'To do';

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth <= 1200) {
      this.dialogRef.close();
      this.router.navigate(['/add-task']);
    }
  }

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