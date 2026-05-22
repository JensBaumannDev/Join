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
   * Synchronizes the current user details with the contacts table in the database.
   * Creates a new contact record if none exists.
   * 
   * @returns A promise resolving when synchronization is complete.
   */
  async syncCurrentUserContact(): Promise<void> {
    const user = this.currentUser();
    if (!user?.email) return;
    const { data, error } = await this.fetchContactByEmail(user.email);
    if (error) return console.error('Contact sync failed:', error);

    const name = this.getDisplayName(user);
    if (data) {
      await this.updateExistingContactIfNeeded(data, name);
    } else {
      await this.createNewContact(user.email, name);
    }
  }

  private fetchContactByEmail(email: string) {
    return this.supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
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

  private async createNewContact(email: string, name: string): Promise<void> {
    const { error } = await this.supabase
      .from('contacts')
      .insert([{ name, email, phone: '0000000000' }]);
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
    this.currentUser.set(data.session?.user ?? null);
    await this.syncCurrentUserContact();
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
    await this.syncCurrentUserContact();
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
