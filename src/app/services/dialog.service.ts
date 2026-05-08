import { Injectable, inject, Type } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(MatDialog);

  open<T>(component: Type<T>, data?: any, panelClass: string = '', options: any = {}) {
    if (this.dialog.openDialogs.length > 0) return null;
    return this.dialog.open(component, {
      data,
      panelClass: 'dialog-container',
      maxWidth: '100vw',
      enterAnimationDuration: '0',
      exitAnimationDuration: '0',
      disableClose: true,
      ...options
    });
  }

  closeDialog(dialogRef: MatDialogRef<any>) {
    dialogRef.addPanelClass('slide-out');
    setTimeout(() => dialogRef.close(), 500);
  }

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

  closeAll() {
    this.dialog.closeAll();
  }
}
