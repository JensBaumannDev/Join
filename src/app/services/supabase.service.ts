import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/** Central service that initializes and provides the Supabase client */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  /** The initialized Supabase client instance */
  supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
}
