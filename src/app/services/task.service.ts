import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Task } from '../interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private supabaseService = inject(SupabaseService);
  private contactService = inject(ContactService);

  /** Signals for reactive state management */
  tasks = signal<Task[]>([]);

  categories = signal<string[]>([]);

  /** Signal holding the board configuration data */
  boardConfig = signal<any>(null);

  /** Signal for filtering tasks by search term */
  searchTerm = signal<string>('');

  /** Proxy to ContactService contacts for backwards compatibility */
  get contacts() {
    return this.contactService.contacts;
  }

  /** Proxy to ContactService getContacts for backwards compatibility */
  async getContacts() {
    await this.contactService.getContacts();
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
      .select('*')
      .order('position', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Task loading error:', error);
      return;
    }

    if (data) {
      this.tasks.set(data as Task[]);
    }
  }

  /** Creates a new task and its associated subtasks in the database */
  async createTask(task: any, subtasks: { title: string; completed: boolean }[] = []) {
    const { data, error } = await this.supabaseService.supabase
      .from('task')
      .insert([task])
      .select();

    if (error) {
      console.error('create task error:', error);
      return;
    }

    if (data && data.length > 0 && subtasks && subtasks.length > 0) {
      const taskId = data[0].id;
      const subtasksWithId = subtasks.map(s => ({
        task_id: taskId,
        title: s.title,
        completed: s.completed ?? false
      }));

      const { error: subError } = await this.supabaseService.supabase
        .from('subtasks')
        .insert(subtasksWithId);

      if (subError) {
        console.error('create subtasks error:', subError);
      }
    }

    await this.getTasks();
    return data?.[0];
  }

  /** Fetches all unique categories from existing tasks */
  async getCategories() {

    const { data, error } =
      await this.supabaseService.supabase
        .from('task')
        .select('category');

    if (error) {
      console.error('Category loading error:', error);
      return;
    }
    if (data) {
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

  /** Persists the position of all tasks based on their current signal order in bulk */
  async updateTaskPositions(tasks: Task[]) {
    const updates = tasks.map((task, index) => ({
      id: task.id,
      position: index
    }));
    
    const { error } = await this.supabaseService.supabase
      .from('task')
      .upsert(updates);

    if (error) {
      console.error('Bulk update positions error:', error);
    }
  }

  /** Fetches subtasks for a given taskId from Supabase */
  async getSubtasksForTask(taskId: string) {
    const { data, error } = await this.supabaseService.supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId);
    if (error) {
      console.error('Subtask loading error:', error);
      return [];
    }
    return data || [];
  }

  /** Signal to trigger refresh of subtasks in specific components */
  subtaskUpdateTrigger = signal<{ taskId: string; timestamp: number } | null>(null);

  /** Updates the completed state of a subtask */
  async updateSubtaskCompleted(subtaskId: string, completed: boolean, taskId: string) {
    const { error } = await this.supabaseService.supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', subtaskId);
    if (error) {
      console.error('Subtask update error:', error);
    } else {
      this.subtaskUpdateTrigger.set({ taskId, timestamp: Date.now() });
    }
  }

  /** Updates a task and replaces its subtasks */
  async updateTask(taskId: string, taskData: any, subtasks: { title: string; completed: boolean }[] = []) {
    const { error } = await this.supabaseService.supabase
      .from('task')
      .update(taskData)
      .eq('id', taskId);
    if (error) {
      console.error('Update task error:', error);
      return;
    }
    await this.supabaseService.supabase
      .from('subtasks')
      .delete()
      .eq('task_id', taskId);
    if (subtasks.length > 0) {
      const subtasksWithId = subtasks.map(s => ({
        task_id: taskId,
        title: s.title,
        completed: s.completed ?? false
      }));
      const { error: subError } = await this.supabaseService.supabase
        .from('subtasks')
        .insert(subtasksWithId);
      if (subError) {
        console.error('Update subtasks error:', subError);
      }
    }
    this.tasks.update(tasks =>
      tasks.map(t => String(t.id) === taskId ? { ...t, ...taskData } : t)
    );
    this.subtaskUpdateTrigger.set({ taskId, timestamp: Date.now() });
  }

  /** Deletes a task and its subtasks from Supabase */
  async deleteTask(taskId: string) {
    await this.supabaseService.supabase
      .from('subtasks')
      .delete()
      .eq('task_id', taskId);
    const { error } = await this.supabaseService.supabase
      .from('task')
      .delete()
      .eq('id', taskId);
    if (error) {
      console.error('Task delete error:', error);
    } else {
      this.tasks.update(tasks => tasks.filter(t => String(t.id) !== taskId));
    }
  }
}
