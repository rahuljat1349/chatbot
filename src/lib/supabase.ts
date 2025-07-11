import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching your schema
export interface User {
  id: number;
  name?: string;
  email?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  count: number;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: "HUMAN" | "AI";
  content: string;
  timestamp: string;
  created_at: string;
}
