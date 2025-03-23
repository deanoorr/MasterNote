import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Interface for storage operations
interface StorageService {
  getItem: (key: string, userId?: string) => Promise<string | null>;
  setItem: (key: string, value: string, userId?: string) => Promise<void>;
  removeItem: (key: string, userId?: string) => Promise<void>;
}

// Storage service that handles both localStorage and Supabase
export const storageService: StorageService = {
  // Get item from storage
  getItem: async (key: string, userId?: string): Promise<string | null> => {
    // Try Supabase first if configured and userId is provided
    if (isSupabaseConfigured() && userId) {
      try {
        // Determine which table to query based on the key
        if (key.includes('api_key')) {
          const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;
          
          // Return the specific API key based on the key requested
          if (key === 'openai_api_key') return data?.openai_key;
          if (key === 'perplexity_api_key') return data?.perplexity_key;
          if (key === 'deepseek_api_key') return data?.deepseek_key;
        }
        
        // Handle user preferences
        if (key === 'selected_model' || key === 'dark_mode') {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;
          
          if (key === 'selected_model') return data?.selected_model;
          if (key === 'dark_mode') return data?.dark_mode ? 'true' : 'false';
        }
        
        // Handle conversation history
        if (key === `conversation_history_${userId}`) {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          
          if (data && data.length > 0) {
            const messages = data.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            return JSON.stringify(messages);
          }
        }
      } catch (error) {
        console.error(`Error getting ${key} from Supabase:`, error);
        // Fall back to localStorage
      }
    }
    
    // Fall back to localStorage
    return localStorage.getItem(key);
  },
  
  // Set item in storage
  setItem: async (key: string, value: string, userId?: string): Promise<void> => {
    // Always set in localStorage as a fallback
    localStorage.setItem(key, value);
    
    // If Supabase is configured and userId is provided, also store there
    if (isSupabaseConfigured() && userId) {
      try {
        // Handle API keys
        if (key.includes('api_key')) {
          const updates: Record<string, any> = {
            user_id: userId,
            updated_at: new Date().toISOString()
          };
          
          // Set the specific API key
          if (key === 'openai_api_key') updates.openai_key = value;
          if (key === 'perplexity_api_key') updates.perplexity_key = value;
          if (key === 'deepseek_api_key') updates.deepseek_key = value;
          
          const { error } = await supabase
            .from('api_keys')
            .upsert(updates);
            
          if (error) throw error;
        }
        
        // Handle user preferences
        if (key === 'selected_model' || key === 'dark_mode') {
          const updates: Record<string, any> = {
            user_id: userId,
            updated_at: new Date().toISOString()
          };
          
          if (key === 'selected_model') updates.selected_model = value;
          if (key === 'dark_mode') updates.dark_mode = value === 'true';
          
          const { error } = await supabase
            .from('user_preferences')
            .upsert(updates);
            
          if (error) throw error;
        }
        
        // Handle conversation history
        if (key === `conversation_history_${userId}`) {
          try {
            const messages = JSON.parse(value);
            
            // Only add the latest message if it's an array
            if (Array.isArray(messages) && messages.length > 0) {
              const latestMessage = messages[messages.length - 1];
              
              const { error } = await supabase
                .from('messages')
                .insert({
                  user_id: userId,
                  role: latestMessage.role,
                  content: latestMessage.content,
                  created_at: new Date().toISOString()
                });
                
              if (error) throw error;
            }
          } catch (parseError) {
            console.error('Error parsing conversation history:', parseError);
          }
        }
      } catch (error) {
        console.error(`Error setting ${key} in Supabase:`, error);
        // localStorage was already set, so the data is not lost
      }
    }
  },
  
  // Remove item from storage
  removeItem: async (key: string, userId?: string): Promise<void> => {
    // Always remove from localStorage
    localStorage.removeItem(key);
    
    // If Supabase is configured and userId is provided, also remove there
    if (isSupabaseConfigured() && userId) {
      try {
        // Handle API keys
        if (key.includes('api_key')) {
          const updates: Record<string, any> = {
            user_id: userId,
            updated_at: new Date().toISOString()
          };
          
          // Set the specific API key to null
          if (key === 'openai_api_key') updates.openai_key = null;
          if (key === 'perplexity_api_key') updates.perplexity_key = null;
          if (key === 'deepseek_api_key') updates.deepseek_key = null;
          
          const { error } = await supabase
            .from('api_keys')
            .upsert(updates);
            
          if (error) throw error;
        }
        
        // Handle conversation history
        if (key === `conversation_history_${userId}`) {
          const { error } = await supabase
            .from('messages')
            .delete()
            .eq('user_id', userId);
            
          if (error) throw error;
        }
      } catch (error) {
        console.error(`Error removing ${key} from Supabase:`, error);
        // localStorage was already removed, so at least that worked
      }
    }
  }
}; 