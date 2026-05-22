import { Injectable } from '@angular/core';

/** Service that manages avatar generation, initials extraction, and dynamic colors */
@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  /** Array of predefined CSS color variables for contact avatars */
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

  /**
   * Generates initials from a name (e.g. "Jens Baumann" -> "JB").
   * 
   * @param name - The full name string.
   * @returns The extracted initials (usually 1 or 2 uppercase characters), or '??' if invalid.
   */
  getInitials(name: string): string {
    if (!name) return '??';
    const cleaned = name.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!cleaned) return '??';

    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 1).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Returns a deterministic color based on the name string.
   * 
   * @param name - The name to generate a color for.
   * @returns A CSS variable color string.
   */
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

  /**
   * Returns initials and color for a user avatar.
   * Falls back to a name-based generated color if no fixed color is provided.
   * 
   * @param name - The name of the user.
   * @param fixedColor - An optional predefined color string.
   * @returns An object containing initials and the background color string.
   */
  getAvatarData(name: string, fixedColor?: string) {
    return {
      initials: this.getInitials(name),
      color: fixedColor || this.getColor(name)
    };
  }

  /**
   * Returns a random color from the palette.
   * 
   * @returns A random CSS variable color string.
   */
  getRandomColor(): string {
    const index = Math.floor(Math.random() * this.colors.length);
    return this.colors[index];
  }

  /**
   * Returns a color that guarantees even distribution across existing avatars.
   * Counts how often each color is used and picks randomly from the least used colors.
   * 
   * @param usedColors - List of colors currently in use by other avatars.
   * @returns The selected CSS variable color string.
   */
  getBalancedColor(usedColors: string[]): string {
    const frequencies = new Map<string, number>();
    this.colors.forEach(c => frequencies.set(c, 0));

    usedColors.forEach(c => {
      if (frequencies.has(c)) {
        frequencies.set(c, frequencies.get(c)! + 1);
      }
    });

    let minFreq = Infinity;
    frequencies.forEach(count => {
      if (count < minFreq) minFreq = count;
    });

    const leastUsedColors = this.colors.filter(c => frequencies.get(c) === minFreq);

    const index = Math.floor(Math.random() * leastUsedColors.length);
    return leastUsedColors[index];
  }
}
