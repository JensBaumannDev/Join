import { Injectable, inject, signal } from '@angular/core';
import { Contact } from '../interfaces/interface';
import { SupabaseService } from './supabase.service';

/** Service handling contact CRUD operations and real-time synchronization with Supabase */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /** Injected SupabaseService to handle API client requests */
  private supabaseService = inject(SupabaseService);

  /** Helper getter for the central Supabase client instance */
  get supabase() {
    return this.supabaseService.supabase;
  }

  /** Signal holding the reactive list of all contacts */
  contacts = signal<Contact[]>([]);

  /** Signal holding the currently active/selected contact */
  selectedContact = signal<Contact | null>(null);

  /** Real-time subscription channel for contacts sync */
  private channel: any = null;

  /**
   * Searches for a single contact by its email address.
   * 
   * @param email - The email address to look up.
   * @returns A promise resolving to the found Contact, or null if not found.
   */
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

  /**
   * Fetches all contacts from the database ordered by name and updates the reactive contact signal.
   * 
   * @returns A promise resolving when the load is complete.
   */
  async getContacts() {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    if (error) return console.error(error);
    if (data) this.contacts.set(data as Contact[]);
  }

  /** Subscribes to real-time postgres changes for the contacts table. */
  subscribeToChanges() {
    if (this.channel) return;
    this.channel = this.supabase.channel('contacts-changes');
    this.channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => this.getContacts()
      )
      .subscribe();
  }

  /**
   * Inserts a new contact record into the database.
   * 
   * @param name - The name of the new contact.
   * @param email - The email address of the new contact.
   * @param phone - The phone number of the new contact.
   * @param color - The optional accent color code.
   * @returns A promise resolving when the insertion is complete.
   */
  async addContact(name: string, email: string, phone: string, color?: string) {
    const { error } = await this.supabase
      .from('contacts')
      .insert([{ name, email, phone, color }]);

    if (error) {
      console.error(error);
    }
  }

  /**
   * Updates an existing contact record in the database and updates local reactive state signals.
   * 
   * @param id - The unique ID of the contact to update.
   * @param name - The updated name of the contact.
   * @param email - The updated email address of the contact.
   * @param phone - The updated phone number of the contact.
   * @param color - The optional updated accent color.
   * @returns A promise resolving when the updates are complete.
   */
  async updateContact(id: number, name: string, email: string, phone: string, color?: string) {
    const { error } = await this.supabase
      .from('contacts')
      .update({ name, email, phone, color })
      .eq('id', id);
    if (error) return console.error('Fehler beim Updaten:', error);

    this.updateLocalContacts(id, name, email, phone, color);
  }

  private updateLocalContacts(id: number, name: string, email: string, phone: string, color?: string) {
    this.contacts.update((list) =>
      list.map((c) => (c.id === id ? { ...c, name, email, phone, color } : c))
    );
    if (this.selectedContact()?.id === id) {
      this.selectedContact.set({ ...this.selectedContact()!, name, email, phone, color });
    }
  }

  /**
   * Deletes a contact record from the database and updates local reactive state signals.
   * 
   * @param id - The unique ID of the contact to delete.
   * @returns A promise resolving when the deletion is complete.
   */
  async deleteContact(id: number) {
    const { error } = await this.supabase.from('contacts').delete().eq('id', id);
    if (error) return console.error('Fehler beim Löschen:', error);

    this.contacts.update((list) => list.filter((c) => c.id !== id));
    if (this.selectedContact()?.id === id) {
      this.selectedContact.set(null);
    }
  }
}
