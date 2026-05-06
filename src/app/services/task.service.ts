import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from '../pages/contacts/contact.service';
import { Task } from '../interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private supabaseService = inject(Supabase);

  /** Signals for reactive state management */
  tasks = signal<Task[]>([]);

  /** Signal holding the current list of contacts */
  contacts = signal<any[]>([]);

  /** Signal holding the board configuration data */
  boardConfig = signal<any>(null);

  /** Signal for filtering tasks by search term */
  searchTerm = signal<string>('');

  /** Fetches all contacts from Supabase */
  async getContacts() {
    const { data, error } = await this.supabaseService.supabase
      .from('contacts')
      .select('*');
    if (!error && data) {
      this.contacts.set(data);
    }
  }

  /** Fetches the board configuration (column names etc.) */
  async getBoardConfig() {
    const { data, error } = await this.supabaseService.supabase
      .from('board')
      .select('*');

    if (!error && data && data.length > 0) {
      this.boardConfig.set(data[0]);
    }
  }

  /** Fetches all tasks from the database */
  async getTasks() {
    const { data, error } = await this.supabaseService.supabase
      .from('task')
      .select('*');

    if (error) {
      console.error('Task loading error:', error);
      return;
    }

    if (data) {
      this.tasks.set(data as Task[]);
    }
  }

  /** Updates the status of a task (Drag & Drop) */
  async updateTaskStatus(taskId: string, newStatus: string) {
    const { error } = await this.supabaseService.supabase
      .from('task')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Update error:', error);
    }
  }
}
