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

  categories = signal<string[]>([]);

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

  async createTask(task:Task) {

    const { error } = 
    await this.supabaseService.supabase
    .from ('task')
    .insert([task]);

    if (error) {
      console.error('create task error:', error);
      return;
    }
    await this.getTasks();
  }

  async getCategories() {

    const { data, error } =
    await this.supabaseService.supabase
    .from('task')
    .select('category');

    if (error) {
      console.error('Category loading error:', error);
      return;
    }
    if(data) {
      const uniqueCategories = [
        ...new Set(
          data.map(item => item.category)
        )
      ];
      this.categories.set(uniqueCategories);
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
