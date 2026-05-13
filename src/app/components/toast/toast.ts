import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  toastService = inject(ToastService);

  @ViewChild('toastContainer') set toastContainer(el: ElementRef<HTMLElement> | undefined) {
    (el?.nativeElement as any)?.showPopover?.();
  }
}

