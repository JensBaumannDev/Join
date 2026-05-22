/**
 * Parses the database representation of assigned contacts into a clean array of names.
 * Supports JSON arrays, bracket lists, curly brace lists, and comma-separated string formats.
 * 
 * @param val - The raw database representation of the assigned contacts.
 * @returns A parsed array of contact names.
 */
export function parseAssignedTo(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback for custom formatted bracket-lists e.g. "[Name 1, Name 2]"
        return trimmed.slice(1, -1)
          .split(',')
          .map(n => n.trim().replace(/^["']|["']$/g, ''))
          .filter(n => n.length > 0);
      }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed.slice(1, -1)
        .split(',')
        .map(n => n.trim().replace(/^["']|["']$/g, ''))
        .filter(n => n.length > 0);
    }
    return trimmed.split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }
  return [];
}
