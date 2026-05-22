import { Injectable, inject, signal } from '@angular/core';
import { Contact } from '../interfaces/interface';
import { SupabaseService } from './supabase.service';

/** Service handling contact CRUD operations and real-time synchronization with Supabase */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private supabaseService = inject(SupabaseService);

  /** Helper getter for the central Supabase client instance */
  get supabase() {
    return this.supabaseService.supabase;
  }

  /** Signal holding the reactive list of all contacts */
  contacts = signal<Contact[]>([]);

  /** Signal holding the currently active/selected contact */
  selectedContact = signal<Contact | null>(null);

  private channel: any = null;

  /** Searches for a single contact by its email address */
  async findContactByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Contact lookup error:', error);
      return null;
    }

    return data as Contact | null;
  }

  /** Fetches all contacts from the database ordered by name */
  async getContacts() {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      this.contacts.set(data as Contact[]);
    }
  }

  /** Subscribes to real-time postgres changes for the contacts table */
  subscribeToChanges() {
    if (this.channel) {
      return;
    }

    this.channel = this.supabase.channel('contacts-changes');

    this.channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        () => {
          this.getContacts();
        }
      )
      .subscribe();
  }

  /** Inserts a new contact record into the database */
  async addContact(name: string, email: string, phone: string, color?: string) {
    const { error } = await this.supabase
      .from('contacts')
      .insert([{ name, email, phone, color }]);

    if (error) {
      console.error(error);
    }
  }

  /** Updates an existing contact record and syncs local signals */
  async updateContact(id: number, name: string, email: string, phone: string, color?: string) {
    const { error } = await this.supabase
      .from('contacts')
      .update({ name, email, phone, color })
      .eq('id', id);

    if (error) {
      console.error('Fehler beim Updaten:', error);
      return;
    }

    this.contacts.update((list) =>
      list.map((c) =>
        c.id === id ? { ...c, name, email, phone, color } : c
      )
    );

    if (this.selectedContact()?.id === id) {
      this.selectedContact.set({
        ...this.selectedContact()!,
        name,
        email,
        phone,
        color,
      });
    }
  }

  /** Deletes a contact record and syncs local signals */
  async deleteContact(id: number) {
    const { error } = await this.supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fehler beim Löschen:', error);
      return;
    }

    this.contacts.update((list) => list.filter((c) => c.id !== id));

    if (this.selectedContact()?.id === id) {
      this.selectedContact.set(null);
    }
  }
}
