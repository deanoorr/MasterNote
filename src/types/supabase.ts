export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          openai_key: string | null;
          perplexity_key: string | null;
          deepseek_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          openai_key?: string | null;
          perplexity_key?: string | null;
          deepseek_key?: string | null;
          created_at?: string;
          updated_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          openai_key?: string | null;
          perplexity_key?: string | null;
          deepseek_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          priority: string;
          status: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          ai_generated: boolean;
          notes: string | null;
          subtasks: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          description?: string;
          priority: string;
          status: string;
          due_date?: string | null;
          created_at: string;
          updated_at: string;
          ai_generated?: boolean;
          notes?: string | null;
          subtasks?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          priority?: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          ai_generated?: boolean;
          notes?: string | null;
          subtasks?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          selected_model: string | null;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          selected_model?: string | null;
          dark_mode?: boolean;
          created_at?: string;
          updated_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          selected_model?: string | null;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 