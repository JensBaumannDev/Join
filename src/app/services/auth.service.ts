import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';

/** Service handling user authentication, session state, and user-to-contact synchronization */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private contactService = inject(ContactService);
  /** Helper getter for the central Supabase client instance */
  private get supabase() {
    return this.supabaseService.supabase;
  }

  /** Signal holding the currently authenticated user session */
  currentUser = signal<User | null>(null);

  /** Signal indicating if the initial session restoration check has finished */
  isAuthResolved = signal(false);

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

    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Contact sync failed:', error);
      return;
    }

    const name = this.getDisplayName(user);

    if (data) {
      if (data.name !== name) {
        const { error: updateError } = await this.supabase
          .from('contacts')
          .update({ name })
          .eq('id', data.id);

        if (updateError) {
          console.error('Contact name sync failed:', updateError);
        }
      }

      await this.contactService.getContacts();
      return;
    }

    const { error: insertError } = await this.supabase
      .from('contacts')
      .insert([{ name, email: user.email, phone: '0000000000' }]);

    if (insertError) {
      console.error('Contact create failed:', insertError);
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
   * @throws A sign out error if sign out fails.
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
      throw error;
    }

    this.currentUser.set(null);
    sessionStorage.removeItem('greetingShown');
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
