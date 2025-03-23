import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Use environment variables if available, fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bkynstayuaejyigeauds.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreW5zdGF5dWFlanlpZ2VhdWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTkwMDYsImV4cCI6MjA1ODMzNTAwNn0.21aQJtJJt4-w0ELkOOyhh8c_-DS2dYQ2G_NxdIWWCyg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if Supabase config is available
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Function to migrate data from localStorage to Supabase
export const migrateLocalStorageToSupabase = async (userId: string) => {
  if (!userId) return;

  try {
    // Migrate API keys
    const openaiApiKey = localStorage.getItem('openai_api_key');
    const perplexityApiKey = localStorage.getItem('perplexity_api_key');
    const deepseekApiKey = localStorage.getItem('deepseek_api_key');
    const grokApiKey = localStorage.getItem('grok_api_key');
    
    if (openaiApiKey || perplexityApiKey || deepseekApiKey || grokApiKey) {
      await supabase.from('api_keys').upsert({
        user_id: userId,
        openai_key: openaiApiKey || null,
        perplexity_key: perplexityApiKey || null,
        deepseek_key: deepseekApiKey || null,
        grok_key: grokApiKey || null,
        updated_at: new Date().toISOString()
      });
    }
    
    // Migrate tasks (stored via Zustand)
    const tasksJson = localStorage.getItem('masternote-storage');
    if (tasksJson) {
      const tasksData = JSON.parse(tasksJson);
      
      if (tasksData?.state?.tasks && Array.isArray(tasksData.state.tasks)) {
        // Insert each task into Supabase
        for (const task of tasksData.state.tasks) {
          await supabase.from('tasks').upsert({
            id: task.id,
            user_id: userId,
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
            created_at: new Date(task.createdAt).toISOString(),
            updated_at: new Date(task.updatedAt).toISOString(),
            ai_generated: task.aiGenerated || false,
            notes: task.notes || ''
          });
        }
      }
    }
    
    // Migrate selected model
    const selectedModel = localStorage.getItem('selected_model');
    if (selectedModel) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        selected_model: selectedModel,
        dark_mode: localStorage.getItem('dark_mode') === 'true',
        updated_at: new Date().toISOString()
      });
    }
    
    // Migrate conversation history
    const conversationHistory = localStorage.getItem(`conversation_history_${userId}`);
    if (conversationHistory) {
      const messages = JSON.parse(conversationHistory);
      
      if (Array.isArray(messages)) {
        for (const message of messages) {
          await supabase.from('messages').insert({
            user_id: userId,
            role: message.role,
            content: message.content,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    console.log('Successfully migrated data from localStorage to Supabase');
    return true;
  } catch (error) {
    console.error('Error migrating data to Supabase:', error);
    return false;
  }
}; 