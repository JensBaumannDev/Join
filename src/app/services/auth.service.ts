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
    // 1. Check if user already has tasks
    const { count: taskCount, error: taskCheckError } = await this.supabase
      .from('task')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!taskCheckError && taskCount === 0) {
      const { data: templates, error: templateError } = await this.supabase
        .from('task')
        .select('*')
        .is('user_id', null);

      if (!templateError && templates) {
        for (const template of templates) {
          const oldTaskId = template.id;
          const taskCopy = { ...template };
          delete taskCopy.id;
          delete taskCopy.created_at;
          taskCopy.user_id = user.id;

          const { data: newTasks, error: insertError } = await this.supabase
            .from('task')
            .insert([taskCopy])
            .select();

          if (!insertError && newTasks?.[0]) {
            const newTaskId = newTasks[0].id;
            const { data: subtasks, error: subtaskError } = await this.supabase
              .from('subtasks')
              .select('*')
              .eq('task_id', oldTaskId);

            if (!subtaskError && subtasks && subtasks.length > 0) {
              const subtaskCopies = subtasks.map(s => {
                const sCopy = { ...s };
                delete sCopy.id;
                sCopy.task_id = newTaskId;
                return sCopy;
              });
              await this.supabase.from('subtasks').insert(subtaskCopies);
            }
          }
        }
      }
    }

    // 2. Check if user already has contacts
    const { count: contactCount, error: contactCheckError } = await this.supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!contactCheckError && contactCount === 0) {
      const { data: templateContacts, error: contactTemplateError } = await this.supabase
        .from('contacts')
        .select('*')
        .is('user_id', null);

      if (!contactTemplateError && templateContacts && templateContacts.length > 0) {
        const contactCopies = templateContacts.map(c => {
          const cCopy = { ...c };
          delete cCopy.id;
          delete cCopy.created_at;
          cCopy.user_id = user.id;
          return cCopy;
        });
        await this.supabase.from('contacts').insert(contactCopies);
      }
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

  private fetchContactByEmail(email: string, userId: string) {
    return this.supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
  }

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
