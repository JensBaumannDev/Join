import { Injectable, inject, Type } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/** Service encapsulating Angular Material Dialog operations and transition animations */
@Injectable({ providedIn: 'root' })
export class DialogService {
  /** Injectable MatDialog instance */
  private dialog = inject(MatDialog);

  /** Opens a new modal dialog containing the specified component */
  open<T>(component: Type<T>, data?: any, panelClass: string = '', options: any = {}) {
    if (this.dialog.openDialogs.length > 0) return null;
    return this.dialog.open(component, {
      data,
      panelClass: 'dialog-container',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0',
      disableClose: true,
      autoFocus: false,
      ...options
    });
  }

  /** Closes the dialog with a slide-out transition animation */
  closeDialog(dialogRef: MatDialogRef<any>) {
    dialogRef.addPanelClass('slide-out');
    setTimeout(() => dialogRef.close(), 500);
  }

  /** Binds backdrop clicks and Escape keypress to close operations */
  setupListeners(dialogRef: MatDialogRef<any>, onClose: () => void): Subscription {
    const sub = new Subscription();
    sub.add(dialogRef.backdropClick().subscribe(() => onClose()));
    sub.add(
      dialogRef.keydownEvents()
        .pipe(filter(e => e.key === 'Escape'))
        .subscribe(() => onClose())
    );
    return sub;
  }

  /** Immediately closes all open dialog instances */
  closeAll() {
    this.dialog.closeAll();
  }
}
