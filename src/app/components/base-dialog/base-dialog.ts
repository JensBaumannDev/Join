import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive()
export abstract class BaseDialog<T> implements OnInit, OnDestroy {
  protected dialogRef = inject(MatDialogRef<T>);
  private _subscriptions = new Subscription();

  ngOnInit() {
    this._subscriptions.add(
      this.dialogRef.backdropClick().subscribe(() => this.closeDialog())
    );
    this._subscriptions.add(
      this.dialogRef.keydownEvents()
        .pipe(filter(e => e.key === 'Escape'))
        .subscribe(() => this.closeDialog())
    );
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  closeDialog() {
    this.dialogRef.addPanelClass('slide-out');
    setTimeout(() => {
      this.dialogRef.close();
    }, 500);
  }
}
