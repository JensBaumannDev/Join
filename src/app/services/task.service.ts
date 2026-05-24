import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { AuthService } from './auth.service';
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
  /** Injected AuthService for user state lookup */
  private authService = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.tasks.set([]);
        this.categories.set([]);
      }
    });
  }

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
   * Fetches all tasks from the database sorted by their position and filtered by logged-in user.
   * 
   * @returns A promise resolving when the tasks have been loaded into state.
   */
  async getTasks() {
    const user = this.authService.currentUser();
    if (!user) return this.tasks.set([]);
    const { data: tasks, error } = await this.supabaseService.supabase
      .from('task')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true, nullsFirst: false });
    if (error) return console.error('Task loading error:', error);
    await this.loadAndMergeSubtasks(tasks || []);
  }

  private async loadAndMergeSubtasks(tasks: Task[]) {
    if (tasks.length === 0) return this.tasks.set([]);
    const taskIds = tasks.map(t => t.id);
    const { data: subtasks, error } = await this.supabaseService.supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds);
    if (error) {
      console.error('Subtask loading error:', error);
      return this.tasks.set(tasks);
    }
    this.tasks.set(this.mergeTasks(tasks, subtasks || []));
  }

  private mergeTasks(tasks: any[], subtasks: any[]): Task[] {
    return tasks.map(t => ({
      ...t,
      subtasks: subtasks.filter(s => String(s.task_id) === String(t.id))
    }));
  }

  /**
   * Creates a new task and inserts its associated subtasks in the database.
   * 
   * @param task - The task data object to insert.
   * @param subtasks - The list of initial subtask objects.
   * @returns A promise resolving to the created task object or undefined.
   */
  async createTask(task: any, subtasks: { title: string; completed: boolean }[] = []) {
    const user = this.authService.currentUser();
    if (!user) return;
    const taskWithUser = {
      ...task,
      user_id: user.id
    };
    const { data, error } = await this.supabaseService.supabase.from('task').insert([taskWithUser]).select();
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
   * Fetches all unique categories extracted from user-specific tasks in the database.
   * 
   * @returns A promise resolving when the categories are loaded.
   */
  async getCategories() {
    const user = this.authService.currentUser();
    if (!user) {
      this.categories.set([]);
      return;
    }
    const { data, error } =
      await this.supabaseService.supabase
        .from('task')
        .select('category')
        .eq('user_id', user.id);

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
    const user = this.authService.currentUser();
    if (!user) return;
    const { error } = await this.supabaseService.supabase
      .from('task')
      .update({ status: newStatus })
      .eq('id', taskId)
      .eq('user_id', user.id);

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
    const user = this.authService.currentUser();
    if (!user) return;
    const updates = tasks.map((task, index) => ({
      id: task.id,
      position: index,
      user_id: user.id
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
      this.updateLocalSubtask(subtaskId, completed, taskId);
    }
  }

  private updateLocalSubtask(subtaskId: string, completed: boolean, taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (String(t.id) !== taskId) return t;
        const subtasks = (t.subtasks || []).map(s =>
          String(s.id) === subtaskId ? { ...s, completed } : s
        );
        return { ...t, subtasks };
      })
    );
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
    const user = this.authService.currentUser();
    if (!user) return;
    const { error } = await this.supabaseService.supabase
      .from('task')
      .update(taskData)
      .eq('id', taskId)
      .eq('user_id', user.id);
    if (error) return console.error('Update task error:', error);
    await this.saveAndApplyUpdatedTask(taskId, taskData, subtasks);
  }

  private async saveAndApplyUpdatedTask(taskId: string, taskData: any, subtasks: any[]) {
    const newSubtasks = await this.replaceSubtasks(taskId, subtasks);
    this.tasks.update(tasks =>
      tasks.map(t => String(t.id) === taskId ? { ...t, ...taskData, subtasks: newSubtasks } : t)
    );
  }

  private async replaceSubtasks(taskId: string, subtasks: { title: string; completed: boolean }[]): Promise<any[]> {
    await this.supabaseService.supabase.from('subtasks').delete().eq('task_id', taskId);
    if (subtasks.length === 0) return [];
    return this.insertAndGetSubtasks(taskId, subtasks);
  }

  private async insertAndGetSubtasks(taskId: string, subtasks: any[]): Promise<any[]> {
    const payload = subtasks.map(s => ({
      task_id: taskId,
      title: s.title,
      completed: s.completed ?? false
    }));
    const { data, error } = await this.supabaseService.supabase
      .from('subtasks')
      .insert(payload)
      .select();
    if (error) console.error('Update subtasks error:', error);
    return data || [];
  }

  /**
   * Deletes a task and all of its associated subtasks from the database.
   * 
   * @param taskId - The unique identifier of the task to delete.
   * @returns A promise resolving when the deletion is complete.
   */
  async deleteTask(taskId: string) {
    const user = this.authService.currentUser();
    if (!user) return;
    await this.supabaseService.supabase.from('subtasks').delete().eq('task_id', taskId);
    const { error } = await this.supabaseService.supabase
      .from('task')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);
    if (error) {
      console.error('Task delete error:', error);
    } else {
      this.tasks.update(tasks => tasks.filter(t => String(t.id) !== taskId));
    }
  }
}
