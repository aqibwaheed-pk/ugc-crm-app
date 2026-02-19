import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class DealsService {
  private supabase: SupabaseClient;
  private genAI: GoogleGenerativeAI;
  private logger = new Logger('DealsService');

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Missing required SUPABASE environment variables');
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing required GEMINI_API_KEY environment variable');
    }
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  // Helper function to sanitize user input for AI prompts
  private sanitizeInput(text: string): string {
    if (!text || typeof text !== 'string') return '';
    // Limit length to prevent prompt injection
    return text.substring(0, 2000).replace(/[`${}\\]/g, '\\$&');
  }

  // CREATE DEAL
  async create(rawData: any, userEmail: string) {
    let aiData = { brand_name: 'Manual Deal', amount: 0, deadline: null, description: '' };

    // Agar Gmail se data aaya hai to AI use karo
    if (rawData.subject && rawData.body) {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      // Sanitize inputs before passing to AI
      const sanitizedSubject = this.sanitizeInput(rawData.subject);
      const sanitizedBody = this.sanitizeInput(rawData.body);
      
      const prompt = `
        Extract the following details from this email text and return ONLY a valid JSON object.
        Fields to extract:
        - brand_name (String): The name of the brand/company.
        - amount (Number): The deal value in dollars. If not found, put 0.
        - deadline (Date): The due date in YYYY-MM-DD format. If not found, use today's date.
        - description (String): A short summary of the deal.
        
        Email Subject: ${sanitizedSubject}
        Email Body: ${sanitizedBody}
      `;
      
      try {
        const result = await model.generateContent(prompt);
        let text = (await result.response).text();
        
        // ✅ SMART FIX: AI ke text mein se sirf JSON bracket {...} dhoondh kar extract karo
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}') + 1;
        
        if (startIndex !== -1 && endIndex !== -1) {
          text = text.substring(startIndex, endIndex); // Sirf JSON wala hissa kaat lo
        }

        try {
          aiData = JSON.parse(text); // Ab parse hamesha pass hoga
        } catch (parseError) {
          this.logger.error('Failed to parse AI response:', text);
          // Agar AI bilkul hi ghalat jawab de, to app crash hone ke bajaye default data save kar legi
          aiData = { brand_name: 'AI Extraction Failed', amount: 0, deadline: null, description: text };
        }
      } catch (aiError) {
        this.logger.error('AI model error:', aiError);
        throw new BadRequestException('Failed to process email with AI model');
      }
    } else {
      // Agar Frontend se manual deal add hui hai
      aiData = { ...rawData };
    }

    const { data, error } = await this.supabase
      .from('deals')
      .insert([{
        brand_name: aiData.brand_name || 'Unknown Brand',
        amount: Number(aiData.amount) || 0,
        deadline: aiData.deadline || null,
        description: aiData.description || '',
        status: 'Pending',
        user_email: userEmail,
        created_at: new Date()
      }])
      .select();

    if (error) {
      this.logger.error('Database error:', error);
      throw new BadRequestException('Failed to create deal');
    }
    return data;
  }

  // FIND BY ID (for authorization checks)
  async findById(id: number) {
    const { data, error } = await this.supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      this.logger.error('Error finding deal:', error);
      return null;
    }
    return data;
  }

  // ... (baaki functions wese hi rahenge: findAll, update, remove) ...

  async findAll(userEmail: string) {
    try {
      const { data, error } = await this.supabase
        .from('deals')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
      
      if (error) {
        this.logger.error('Database error:', error);
        throw new BadRequestException('Failed to fetch deals');
      }
      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Unexpected error in findAll:', err);
      throw new BadRequestException('Failed to fetch deals');
    }
  }

  async update(id: number, updateData: any, userEmail: string) {
    try {
      const { data, error } = await this.supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .eq('user_email', userEmail);
      
      if (error) {
        this.logger.error('Database error:', error);
        throw new BadRequestException('Failed to update deal');
      }
      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Unexpected error in update:', err);
      throw new BadRequestException('Failed to update deal');
    }
  }

  async remove(id: number, userEmail: string) {
    try {
      const { data, error } = await this.supabase
        .from('deals')
        .delete()
        .eq('id', id)
        .eq('user_email', userEmail);
      
      if (error) {
        this.logger.error('Database error:', error);
        throw new BadRequestException('Failed to delete deal');
      }
      return data;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Unexpected error in remove:', err);
      throw new BadRequestException('Failed to delete deal');
    }
  }
}