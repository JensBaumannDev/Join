import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Task } from '../interfaces/task.interface';

/**
 * Service handling Kanban tasks, categories, board configs, and subtask operations.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  /** Injected SupabaseService to handle API client requests */
  private supabaseService = inject(SupabaseService);
  /** Injected ContactService to map assignments */
  private contactService = inject(ContactService);

  /** Signal holding the reactive list of all tasks */
  tasks = signal<Task[]>([]);

  /** Signal holding task category names from database */
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

  /**
   * Fetches the board configuration (e.g., column names and layout) from Supabase.
   * 
   * @returns A promise resolving when the board configuration is loaded.
   */
  async getBoardConfig() {
    const { data, error } = await this.supabaseService.supabase
      .from('board')
      .select('*');

    if (!error && data && data.length > 0) {
      this.boardConfig.set(data[0]);
    }
  }

  /**
   * Fetches all tasks from the database sorted by their position.
   * 
   * @returns A promise resolving when the tasks have been loaded into state.
   */
  async getTasks() {
    const { data, error } = await this.supabaseService.supabase
      .from('task')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false });
    if (error) {
      console.error('Task loading error:', error);
      return;
    }
    if (data) this.tasks.set(data as Task[]);
  }

  /**
   * Creates a new task and inserts its associated subtasks in the database.
   * 
   * @param task - The task data object to insert.
   * @param subtasks - The list of initial subtask objects.
   * @returns A promise resolving to the created task object or undefined.
   */
  async createTask(task: any, subtasks: { title: string; completed: boolean }[] = []) {
    const { data, error } = await this.supabaseService.supabase.from('task').insert([task]).select();
    if (error) {
      console.error('create task error:', error);
      return;
    }
    if (data?.[0] && subtasks.length > 0) {
      await this.insertSubtasks(data[0].id, subtasks);
    }
    await this.getTasks();
    return data?.[0];
  }

  private async insertSubtasks(taskId: number, subtasks: { title: string; completed: boolean }[]): Promise<void> {
    const subtasksWithId = subtasks.map(s => ({
      task_id: taskId,
      title: s.title,
      completed: s.completed ?? false
    }));
    const { error } = await this.supabaseService.supabase.from('subtasks').insert(subtasksWithId);
    if (error) {
      console.error('create subtasks error:', error);
    }
  }

  /**
   * Fetches all unique categories extracted from existing tasks in the database.
   * 
   * @returns A promise resolving when the categories are loaded.
   */
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

  /**
   * Updates the category/status column of a task (e.g., during Drag & Drop).
   * 
   * @param taskId - The unique identifier of the task.
   * @param newStatus - The new status value (e.g. 'to-do', 'in-progress').
   * @returns A promise resolving when the status is updated.
   */
  async updateTaskStatus(taskId: string, newStatus: string) {
    const { error } = await this.supabaseService.supabase
      .from('task')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Update error:', error);
    }
  }

  /**
   * Persists the visual position order of all tasks in bulk in the database.
   * 
   * @param tasks - The array of tasks representing the new order.
   * @returns A promise resolving when the bulk positions are updated.
   */
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

  /**
   * Fetches all subtasks associated with a specific task ID.
   * 
   * @param taskId - The unique identifier of the parent task.
   * @returns A promise resolving to the list of subtask records.
   */
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

  /**
   * Updates the completion status of a single subtask and triggers reactive updates.
   * 
   * @param subtaskId - The database ID of the subtask.
   * @param completed - The new completion state.
   * @param taskId - The parent task's unique ID for triggering updates.
   * @returns A promise resolving when the update is complete.
   */
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

  /**
   * Updates task details and completely replaces its set of subtasks.
   * 
   * @param taskId - The unique identifier of the task.
   * @param taskData - The updated fields for the task.
   * @param subtasks - The complete replacement list of subtasks.
   * @returns A promise resolving when the updates are complete.
   */
  async updateTask(taskId: string, taskData: any, subtasks: { title: string; completed: boolean }[] = []) {
    const { error } = await this.supabaseService.supabase.from('task').update(taskData).eq('id', taskId);
    if (error) return console.error('Update task error:', error);

    await this.replaceSubtasks(taskId, subtasks);
    this.tasks.update(tasks =>
      tasks.map(t => String(t.id) === taskId ? { ...t, ...taskData } : t)
    );
    this.subtaskUpdateTrigger.set({ taskId, timestamp: Date.now() });
  }

  private async replaceSubtasks(taskId: string, subtasks: { title: string; completed: boolean }[]): Promise<void> {
    await this.supabaseService.supabase.from('subtasks').delete().eq('task_id', taskId);
    if (subtasks.length > 0) {
      const subtasksWithId = subtasks.map(s => ({
        task_id: taskId,
        title: s.title,
        completed: s.completed ?? false
      }));
      const { error } = await this.supabaseService.supabase.from('subtasks').insert(subtasksWithId);
      if (error) console.error('Update subtasks error:', error);
    }
  }

  /**
   * Deletes a task and all of its associated subtasks from the database.
   * 
   * @param taskId - The unique identifier of the task to delete.
   * @returns A promise resolving when the deletion is complete.
   */
  async deleteTask(taskId: string) {
    await this.supabaseService.supabase.from('subtasks').delete().eq('task_id', taskId);
    const { error } = await this.supabaseService.supabase.from('task').delete().eq('id', taskId);
    if (error) {
      console.error('Task delete error:', error);
    } else {
      this.tasks.update(tasks => tasks.filter(t => String(t.id) !== taskId));
    }
  }
}
