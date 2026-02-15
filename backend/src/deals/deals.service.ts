import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DealsService {
  private supabase: SupabaseClient;

  constructor() {
    // Hum '!' laga rahe hain taake TypeScript ko yaqeen ho ke keys mojood hain
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async create(dealData: any) {
    // 1. Supabase mein Insert karo
    const { data, error } = await this.supabase
      .from('deals')
      .insert([
        {
          brand_name: dealData.brand,
          amount: dealData.amount,
          user_email: 'test@example.com', // Abhi hardcoded hai test ke liye
          status: 'Pending',
        },
      ])
      .select();

    // 2. Agar error aaye to batao
    if (error) {
      console.error('Supabase Error:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
}