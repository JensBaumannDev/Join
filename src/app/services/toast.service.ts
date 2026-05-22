import { Injectable, signal } from '@angular/core';

/** Service managing application-wide toast notification messages and states */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  /** Signal containing the active toast notification text message */
  message = signal<string | null>(null);
  /** Signal indicating if the toast container is currently visible */
  isVisible = signal(false);
  /** Signal indicating if the toast is in the process of hiding (fade out) */
  isHiding = signal(false);
  /** Signal specifying whether to render a checked badge icon along with text */
  showIcon = signal(false);

  /** Timeout reference tracking duration before initiating hide sequence */
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  /** Timeout reference tracking delay before clearing the active toast message */
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Displays a toast notification with the specified message and style configuration.
   * Automatically handles automatic fade-out timers and resetting status signals.
   * 
   * @param msg - The text message to display.
   * @param withIcon - Optional flag to display a success badge icon next to the text.
   */
  show(msg: string, withIcon = false) {
    this.clearTimers();
    this.isVisible.set(false);
    this.isHiding.set(false);

    requestAnimationFrame(() => {
      this.message.set(msg);
      this.showIcon.set(withIcon);
      this.isVisible.set(true);
      this.startHideTimer();
    });
  }

  private clearTimers() {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.clearTimer) clearTimeout(this.clearTimer);
  }

  private startHideTimer() {
    this.hideTimer = setTimeout(() => {
      this.isVisible.set(false);
      this.isHiding.set(true);
      this.clearTimer = setTimeout(() => {
        this.message.set(null);
        this.isHiding.set(false);
        this.showIcon.set(false);
      }, 500);
    }, 3000);
  }
}
