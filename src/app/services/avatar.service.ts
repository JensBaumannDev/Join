import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  private readonly colors = [
    'var(--user-color-1)',
    'var(--user-color-2)',
    'var(--user-color-3)',
    'var(--user-color-4)',
    'var(--user-color-5)',
    'var(--user-color-6)',
    'var(--user-color-7)',
    'var(--user-color-8)',
    'var(--user-color-9)',
    'var(--user-color-10)',
    'var(--user-color-11)',
    'var(--user-color-12)',
    'var(--user-color-13)',
    'var(--user-color-14)',
    'var(--user-color-15)',
  ];

  /** Generates initials from a name (e.g. "Jens Baumann" -> "JB") */
  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /** Returns a deterministic color based on the name string */
  getColor(name: string): string {
    if (!name) return this.colors[0];

    // Simple hash function to get a consistent index for the same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % this.colors.length;
    return this.colors[index];
  }

  /** Returns both initials and color for a user */
  getAvatarData(name: string) {
    return {
      initials: this.getInitials(name),
      color: this.getColor(name)
    };
  }

  /** Returns a random color from the palette */
  getRandomColor(): string {
    const index = Math.floor(Math.random() * this.colors.length);
    return this.colors[index];
  }
}
