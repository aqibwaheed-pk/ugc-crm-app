import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger('SupabaseService');

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Missing required SUPABASE environment variables');
    }

    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: {
          persistSession: false, // Server-side doesn't need session persistence
        },
      }
    );

    this.logger.log('Supabase client initialized');
  }

  onModuleInit() {
    this.logger.log('SupabaseService module initialized');
  }

  /**
   * Get the Supabase client instance
   * @returns SupabaseClient
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Helper method for SQL-like query access
   * @param table - The table name
   * @returns Query builder for the specified table
   */
  from(table: string) {
    return this.client.from(table);
  }
}
