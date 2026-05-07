import { Injectable, Type, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

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

  closeAll() {
    this.dialog.closeAll();
  }
}
