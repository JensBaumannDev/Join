import { Injectable, signal } from '@angular/core'
import { createClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root',
})
export class Supabase {

  supabaseUrl = 'https://xghgnrqmiunojpfilsyr.supabase.co'
  supabaseKey = 'sb_publishable_fq87MyT8emzNGArQ2tHwHA_9DRDSjD9'

  supabase = createClient(this.supabaseUrl, this.supabaseKey)

  contacts = signal<{
    id?: number
    name: string
    email: string
    phone: string
  }[]>([])

  selectedContact = signal<{
    id?: number
    name: string
    email: string
    phone: string
  } | null>(null)

  private channel: any

  async getContacts() {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    if (data) {
      this.contacts.set(data)
    }
  }

  subscribeToChanges() {
    this.supabase
      .channel('contacts-changes')
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

  async addContact(name: string, email: string, phone: number) {
    const { error } = await this.supabase
      .from('contacts')
      .insert([{ name, email, phone }])

    if (error) {
      console.error(error)
    }
  }

  async updateContact(id: number, name: string, email: string, phone: number) {
    const { error } = await this.supabase
      .from('contacts')
      .update({ name, email, phone })
      .eq('id', id);

    if (error) {
      console.error('Fehler beim Updaten:', error);
    }
  }

  async deleteContact(id: number) {
    const { error } = await this.supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fehler beim Löschen:', error);
    }
  }
}