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

  constructor() {
    this.loadSession();
  }

  /**
   * Restores the user session after a page reload.
   * Supabase stores the session token in localStorage.
   * getSession() reads that token and returns the active session.
   */
  async loadSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
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
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
      throw error;
    }

    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
