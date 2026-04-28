import { Component, inject } from '@angular/core';
import { ContactList } from './contact-list/contact-list';
import { MatDialog } from '@angular/material/dialog';
import { ContactDialogComponent } from './contact-overlay/contact-overlay';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ContactList],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  private dialog = inject(MatDialog);

  openContactDialog(mode: 'add' | 'edit') {
    this.dialog.open(ContactDialogComponent, {
      data: { mode },
      panelClass: 'contact-dialog-panel',
      maxWidth: '100vw',
      width: 'auto',
      height: 'auto',
    });
  }
}