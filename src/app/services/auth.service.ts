import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from '../pages/contacts/contact.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(Supabase);
  private get supabase() {
    return this.supabaseService.supabase;
  }

  currentUser = signal<User | null>(null);
  isAuthResolved = signal(false);

  constructor() {
    void this.loadSession();
  }

  getDisplayName(user: User | null = this.currentUser()): string {
    if (!user) return 'Guest';
    if (user.email === 'guest@join.com') return 'Guest';
    return user.user_metadata?.['full_name'] || user.user_metadata?.['display_name'] || user.email || 'Guest';
  }

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

      await this.supabaseService.getContacts();
      return;
    }

    const { error: insertError } = await this.supabase
      .from('contacts')
      .insert([{ name, email: user.email, phone: '0000000000' }]);

    if (insertError) {
      console.error('Contact create failed:', insertError);
      return;
    }

    await this.supabaseService.getContacts();
  }

  /**
   * Restores the user session after a page reload.
   * Supabase stores the session token in localStorage.
   * getSession() reads that token and returns the active session.
   */
  async loadSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    await this.syncCurrentUserContact();
    this.isAuthResolved.set(true);
  }

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

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
      throw error;
    }

    this.currentUser.set(null);
    sessionStorage.removeItem('greetingShown');
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
