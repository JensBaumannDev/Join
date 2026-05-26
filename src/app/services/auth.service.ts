import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';

/** Service handling user authentication, session state, and user-to-contact synchronization */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Registers a new user with Supabase
   * @param email - The user's email address
   * @param password - The user's password
   * @param fullName - The user's full name
   * @returns The Supabase response data
   * @throws Error if registration fails
   */
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  }


  /** Injected SupabaseService to handle API connections */
  private supabaseService = inject(SupabaseService);
  /** Injected ContactService for updating user contacts information */
  private contactService = inject(ContactService);


  /** Helper getter for the central Supabase client instance */
  private get supabase() {
    return this.supabaseService.supabase;
  }


  /** Signal holding the currently authenticated user session */
  currentUser = signal<User | null>(null);

  /** Signal indicating if the initial session restoration check has finished */
  isAuthResolved = signal(false);


  /** Restores current authenticated user session from database on startup */
  constructor() {
    void this.loadSession();
  }


  /**
   * Resolves and returns a human-readable display name for the user.
   * 
   * @param user - The user object to resolve the name for. Defaults to the current user.
   * @returns The resolved full name, display name, email, or 'Guest'.
   */
  getDisplayName(user: User | null = this.currentUser()): string {
    if (!user) return 'Guest';
    if (user.email === 'guest@join.com') return 'Guest';
    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || 'Guest';
  }


  /**
   * Duplicates default tasks, subtasks and contacts (where user_id is null) for a newly registered/logged-in user
   * if they do not have any tasks or contacts yet.
   *
   * @param user - The authenticated user object
   */
  async initializeUserCopy(user: User): Promise<void> {
    await this.initTasksCopy(user);
    await this.initContactsCopy(user);
  }


  /**
   * Populates the user's tasks with database templates on first initialization.
   * 
   * @param user - The active authenticated user account.
   */
  private async initTasksCopy(user: User): Promise<void> {
    const { count, error } = await this.supabase
      .from('task').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if (error || count !== 0) return;
    const { data: templates, error: tErr } = await this.supabase
      .from('task').select('*').is('user_id', null);
    if (!tErr && templates) {
      for (const template of templates) {
        await this.copyTemplateTaskWithSubtasks(template, user.id);
      }
    }
  }


  /**
   * Duplicates a single template task and sets user ownership.
   * 
   * @param template - The template task record.
   * @param userId - Target user account ID.
   */
  private async copyTemplateTaskWithSubtasks(template: any, userId: string): Promise<void> {
    const oldTaskId = template.id;
    const taskCopy = { ...template };
    delete taskCopy.id;
    delete taskCopy.created_at;
    taskCopy.user_id = userId;
    const { data: newTasks, error } = await this.supabase
      .from('task').insert([taskCopy]).select();
    if (!error && newTasks?.[0]) {
      await this.copySubtasksToNewTask(oldTaskId, newTasks[0].id);
    }
  }


  /**
   * Copies template subtasks to the newly instantiated task record.
   * 
   * @param oldTaskId - The parent template task database ID.
   * @param newTaskId - The newly instantiated task database ID.
   */
  private async copySubtasksToNewTask(oldTaskId: number, newTaskId: number): Promise<void> {
    const { data: subtasks, error } = await this.supabase
      .from('subtasks').select('*').eq('task_id', oldTaskId);
    if (error || !subtasks || subtasks.length === 0) return;
    const subtaskCopies = subtasks.map(s => {
      const sCopy = { ...s };
      delete sCopy.id;
      sCopy.task_id = newTaskId;
      return sCopy;
    });
    await this.supabase.from('subtasks').insert(subtaskCopies);
  }


  /**
   * Maps template contacts into user contact records.
   * 
   * @param contacts - Predefined contact records array.
   * @param userId - Target user account ID.
   * @returns Cloned contact records array.
   */
  private buildContactCopies(contacts: any[], userId: string): any[] {
    return contacts.map(c => {
      const copy = { ...c };
      delete copy.id;
      delete copy.created_at;
      copy.user_id = userId;
      return copy;
    });
  }


  /**
   * Populates the user's contacts with database templates on first initialization.
   * 
   * @param user - The active authenticated user account.
   */
  private async initContactsCopy(user: User): Promise<void> {
    const { count, error } = await this.supabase
      .from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if (error || count !== 0) return;
    const { data: templates, error: cErr } = await this.supabase
      .from('contacts').select('*').is('user_id', null);
    if (!cErr && templates && templates.length > 0) {
      await this.supabase.from('contacts').insert(this.buildContactCopies(templates, user.id));
    }
  }


  /**
   * Synchronizes the current user details with the contacts table in the database.
   * Creates a new contact record if none exists.
   * 
   * @returns A promise resolving when synchronization is complete.
   */
  async syncCurrentUserContact(): Promise<void> {
    const user = this.currentUser();
    if (!user?.email) return;
    const { data, error } = await this.fetchContactByEmail(user.email, user.id);
    if (error) return console.error('Contact sync failed:', error);

    const name = this.getDisplayName(user);
    if (data) {
      await this.updateExistingContactIfNeeded(data, name);
    } else {
      await this.createNewContact(user.email, name, user.id);
    }
  }


  /**
   * Resolves a contact details record matching email and user_id.
   * 
   * @param email - Target contact email address.
   * @param userId - Target user account ID.
   */
  private fetchContactByEmail(email: string, userId: string) {
    return this.supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
  }


  /**
   * Updates contact name records if user display configurations change.
   * 
   * @param contact - The original contact record details.
   * @param name - The updated display name string.
   */
  private async updateExistingContactIfNeeded(contact: any, name: string): Promise<void> {
    if (contact.name !== name) {
      const { error } = await this.supabase
        .from('contacts')
        .update({ name })
        .eq('id', contact.id);
      if (error) console.error('Contact name sync failed:', error);
    }
    await this.contactService.getContacts();
  }


  /**
   * Generates a new self-representing user contact record.
   * 
   * @param email - User email address.
   * @param name - User display name string.
   * @param userId - Target user account ID.
   */
  private async createNewContact(email: string, name: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('contacts')
      .insert([{ name, email, phone: '0000000000', user_id: userId }]);
    if (error) {
      console.error('Contact create failed:', error);
      return;
    }
    await this.contactService.getContacts();
  }


  /**
   * Restores the user session from local storage on startup.
   * 
   * @returns A promise resolving when session check and contact sync are complete.
   */
  async loadSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    const user = data.session?.user ?? null;
    this.currentUser.set(user);
    if (user) {
      await this.initializeUserCopy(user);
      await this.syncCurrentUserContact();
    }
    this.isAuthResolved.set(true);
  }


  /**
   * Authenticates a user using email and password.
   * 
   * @param email - The user's email address.
   * @param password - The user's plain text password.
   * @returns A promise resolving when authentication is complete.
   * @throws An authentication error if sign in fails.
   */
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login failed:', error.message);
      throw error;
    }

    this.currentUser.set(data.user);
    if (data.user) {
      await this.initializeUserCopy(data.user);
      await this.syncCurrentUserContact();
    }
  }


  /**
   * Signs out the current user and clears session storage flags.
   * 
   * @returns A promise resolving when sign out is complete.
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Logout failed:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      this.currentUser.set(null);
      sessionStorage.removeItem('greetingShown');
    }
  }


  /**
   * Checks if a user is currently authenticated.
   * 
   * @returns True if a user session exists, false otherwise.
   */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
