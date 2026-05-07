import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  message = signal<string | null>(null);
  isVisible = signal(false);
  isHiding = signal(false);
  showIcon = signal(false);

  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  show(msg: string, withIcon = false) {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.clearTimer) clearTimeout(this.clearTimer);

    this.isVisible.set(false);
    this.isHiding.set(false);

    requestAnimationFrame(() => {
      this.message.set(msg);
      this.showIcon.set(withIcon);
      this.isVisible.set(true);

      this.hideTimer = setTimeout(() => {
        this.isVisible.set(false);
        this.isHiding.set(true);
        this.clearTimer = setTimeout(() => {
          this.message.set(null);
          this.isHiding.set(false);
          this.showIcon.set(false);
        }, 500);
      }, 3000);
    });
  }
}
