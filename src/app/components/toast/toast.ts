import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { ToastService } from '../../services/toast.service';

/** Component representing a toast notification displayed on-screen */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  /** Injectable ToastService providing current toast message and visible status */
  toastService = inject(ToastService);

  /** Callback that shows the toast popover when the view child container is rendered */
  @ViewChild('toastContainer') set toastContainer(el: ElementRef<HTMLElement> | undefined) {
    (el?.nativeElement as any)?.showPopover?.();
  }
}

