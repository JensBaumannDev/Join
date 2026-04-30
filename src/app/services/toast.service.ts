import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  message = signal<string | null>(null);
  isVisible = signal(false);
  isHiding = signal(false);

  show(msg: string) {
    this.message.set(msg);
    this.isVisible.set(true);
    this.isHiding.set(false);
    
    setTimeout(() => {
      this.isVisible.set(false);
      this.isHiding.set(true);
      setTimeout(() => {
        this.message.set(null);
        this.isHiding.set(false);
      }, 500);
    }, 3000);
  }
}
