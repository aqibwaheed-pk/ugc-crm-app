import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class DealsService {
  private supabase: SupabaseClient;
  private genAI: GoogleGenerativeAI;

  constructor() {
    // 1. Supabase Setup
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );

    // 2. Gemini AI Setup
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async create(rawData: any) {
    console.log("AI Processing Started for:", rawData.subject);

    // Step A: AI se Data Extract karna
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Extract the following details from this email text and return ONLY a valid JSON object.
      Do not add markdown formatting like \`\`\`json.
      
      Fields to extract:
      - brand_name (String): The name of the brand/company.
      - amount (Number): The deal value in dollars. If not found, put 0.
      - deadline (Date): The due date in YYYY-MM-DD format. If not found, use today's date.
      
      Email Subject: ${rawData.subject}
      Email Body: ${rawData.body}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleaning (Agar AI ne markdown laga diya to hatana)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("AI Extracted Data:", text);
    const aiData = JSON.parse(text);

    // Step B: Supabase mein Save karna
    const { data, error } = await this.supabase
      .from('deals')
      .insert([
        {
          brand_name: aiData.brand_name,
          amount: aiData.amount,
          deadline: aiData.deadline,
          status: 'Pending',
          user_email: 'test@example.com', // Abhi Hardcoded hai (Auth baad mein)
          created_at: new Date()
        },
      ])
      .select();

    if (error) throw new Error(error.message);

    return data;
  }
}