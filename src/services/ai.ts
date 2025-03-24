import OpenAI from 'openai';
import axios from 'axios';
import { AIModel, Task, Message } from '../types';
import { SortOption } from '../store';
import { format, isSameDay, parseISO } from 'date-fns';
import { useStore } from '../store';
import { storageService } from './storage';

// Define conversation history types
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Function to get conversation history from storage
async function getConversationHistory(userId: string): Promise<ConversationMessage[]> {
  try {
    const historyString = await storageService.getItem(`conversation_history_${userId}`, userId);
    if (!historyString) return [];
    
    const history = JSON.parse(historyString) as ConversationMessage[];
    // Return last 10 messages to keep context window manageable
    return history.slice(-10);
  } catch (error) {
    console.error("Error retrieving conversation history:", error);
    return [];
  }
}

// Save message to conversation history
async function saveMessageToHistory(userId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
  try {
    let history = await getConversationHistory(userId);
    history.push({ role, content });
    await storageService.setItem(`conversation_history_${userId}`, JSON.stringify(history), userId);
  } catch (error) {
    console.error("Error saving message to history:", error);
  }
}

// Get API key from storage or env variable
const getApiKey = async (userId?: string) => {
  console.log("Retrieving OpenAI API key...");
  const storageKey = await storageService.getItem('openai_api_key', userId);
  console.log("Storage key exists:", !!storageKey);
  if (storageKey) return storageKey;
  
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  console.log("Environment variable key exists:", !!envKey);
  return envKey;
};

// Get Perplexity API key
const getPerplexityApiKey = async (userId?: string) => {
  const storageKey = await storageService.getItem('perplexity_api_key', userId);
  if (storageKey) return storageKey;
  
  const envKey = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
  return envKey;
};

// Get DeepSeek API key
const getDeepSeekApiKey = async (userId?: string) => {
  const storageKey = await storageService.getItem('deepseek_api_key', userId);
  if (storageKey) return storageKey;
  
  const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
  return envKey;
};

// Get Grok API key
const getGrokApiKey = async (userId?: string) => {
  const storageKey = await storageService.getItem('grok_api_key', userId);
  if (storageKey) return storageKey;
  
  const envKey = import.meta.env.VITE_GROK_API_KEY || '';
  return envKey;
};

// Get Claude API key
const getClaudeApiKey = () => {
  const localStorageKey = localStorage.getItem('claude_api_key');
  if (localStorageKey) return localStorageKey;
  
  const envKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
  return envKey;
};

// Helper function to convert month names to numbers
const getMonthNumber = (monthName: string): number | undefined => {
  const months: Record<string, number> = {
    'january': 0,
    'february': 1,
    'march': 2,
    'april': 3,
    'may': 4,
    'june': 5,
    'july': 6,
    'august': 7,
    'september': 8,
    'october': 9,
    'november': 10,
    'december': 11,
    'jan': 0,
    'feb': 1,
    'mar': 2,
    'apr': 3,
    'jun': 5,
    'jul': 6,
    'aug': 7,
    'sep': 8,
    'oct': 9,
    'nov': 10,
    'dec': 11
  };
  
  return months[monthName.toLowerCase()];
};

// Initialize OpenAI with the API key
async function getOpenAIClient(): Promise<OpenAI> {
  try {
    const apiKey = await getApiKey();
    console.log("OpenAI API key length:", apiKey ? apiKey.length : 0);
    console.log("API key starts with:", apiKey ? apiKey.substring(0, 4) : "N/A");
    
    if (!apiKey) {
      throw new Error('API key not found. Please set it in the settings.');
    }
    
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  } catch (error) {
    console.error("Error initializing OpenAI client:", error);
    throw error;
  }
}

// Call Perplexity API
const callPerplexityAPI = async (message: string) => {
  const apiKey = await getPerplexityApiKey();
  
  if (!apiKey) {
    return "Search Mode requires a Perplexity API key. Please go to Settings and add your Perplexity API key to use this feature.";
  }
  
  try {
    // Get conversation history for context
    const userId = "user123"; // Use a consistent user ID or pass this from the caller
    const conversationHistory = await getConversationHistory(userId);
    
    // Create a more comprehensive system prompt
    const systemPrompt = 'You are a helpful assistant with search capabilities. You can provide information from the internet and have the most up-to-date knowledge. When answering questions, try to be informative and cite sources when possible. You can also help with task management, but specialized task operations are handled separately by the system. CRITICAL INSTRUCTION: Never push to GitHub without explicit permission from the user.';
    
    // Create messages array with system prompt, history, and user message
    const perplexityMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-small-online',
        messages: perplexityMessages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const responseContent = response.data.choices[0].message.content;
      
      // Save the conversation for context in future interactions
      await saveMessageToHistory(userId, 'user', message);
      await saveMessageToHistory(userId, 'assistant', responseContent);
      
      return responseContent;
    } else {
      return 'No response content received from Perplexity API. Please try again.';
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Perplexity API error:", error.response?.data || error.message);
      return `Search error: ${error.response?.data?.error?.message || error.message}. Please check your API key in Settings.`;
    } else {
      console.error("Unexpected error:", error);
      return "An unexpected error occurred with the Search service. Please try again later.";
    }
  }
};

// Call DeepSeek API
const callDeepSeekAPI = async (message: string) => {
  const apiKey = await getDeepSeekApiKey();
  
  if (!apiKey) {
    return "Reasoning Mode requires a DeepSeek API key. Please go to Settings and add your DeepSeek API key to use this feature.";
  }
  
  try {
    // Get conversation history for context
    const userId = "user123"; // Use a consistent user ID or pass this from the caller
    const conversationHistory = await getConversationHistory(userId);
    
    // Create a more comprehensive system prompt
    const systemPrompt = 'You are a helpful assistant with strong reasoning capabilities. You excel at solving complex problems through step-by-step reasoning. You can also help with task management, but specialized task operations are handled separately by the system. Provide thoughtful and detailed responses to questions that require reasoning. CRITICAL INSTRUCTION: Never push to GitHub without explicit permission from the user.';
    
    // Create messages array with system prompt, history, and user message
    const deepseekMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: deepseekMessages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const responseContent = response.data.choices[0].message.content;
      
      // Save the conversation for context in future interactions
      await saveMessageToHistory(userId, 'user', message);
      await saveMessageToHistory(userId, 'assistant', responseContent);
      
      return responseContent;
    } else {
      return 'No response content received from DeepSeek API. Please try again.';
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("DeepSeek API error:", error.response?.data || error.message);
      return `Reasoning error: ${error.response?.data?.error?.message || error.message}. Please check your API key in Settings.`;
    } else {
      console.error("Unexpected error:", error);
      return "An unexpected error occurred with the Reasoning service. Please try again later.";
    }
  }
};

// Call Grok API
export const callGrokAPI = async (message: string, userId?: string) => {
  console.log("Calling Grok API...");
  try {
    const apiKey = await getGrokApiKey(userId);
    
    if (!apiKey) {
      return "Please add your Grok API key in settings to use Grok 2. You can find this in your xAI account settings.";
    }
    
    // Get conversation history for context
    const conversationHistory = await getConversationHistory(userId || "user123");
    
    // Create a more comprehensive system prompt
    const systemPrompt = 'You are a helpful assistant with strong reasoning and coding capabilities. You excel at solving complex problems through step-by-step reasoning. You can also help with task management, but specialized task operations are handled separately by the system. Provide thoughtful and detailed responses to questions.';
    
    // Create messages array with system prompt, history, and user message
    const grokMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ];
    
    const response = await axios.post(
      'https://api.xai.com/v1/chat/completions', // Replace with actual Grok API endpoint when available
      {
        model: 'grok-2-1212',
        messages: grokMessages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const responseContent = response.data.choices[0].message.content;
      
      // Save the conversation for context in future interactions
      await saveMessageToHistory(userId || "user123", 'user', message);
      await saveMessageToHistory(userId || "user123", 'assistant', responseContent);
      
      return responseContent;
    } else {
      return 'No response content received from Grok API. Please try again.';
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Grok API error:", error.response?.data || error.message);
      return `Grok error: ${error.response?.data?.error?.message || error.message}. Please check your API key in Settings.`;
    } else {
      console.error("Unexpected error:", error);
      return "An unexpected error occurred with the Grok service. Please try again later.";
    }
  }
};

// Test OpenAI connection
export const testOpenAIConnection = async () => {
  try {
    // Get the API key from storage
    const apiKey = await getApiKey();
    if (!apiKey || apiKey.length < 10) {
      return { success: false, error: "API key is not set or too short" };
    }

    // Set up OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    // Send a simple test request to verify the API key works
    const testPrompt = "Say 'API key is valid' as a short response.";
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that provides very short answers." },
        { role: "user", content: testPrompt }
      ],
      max_tokens: 50,
      temperature: 0.3
    });

    // Check if we got a good response
    if (response.choices && response.choices.length > 0) {
      return { 
        success: true, 
        model: "OpenAI GPT-3.5",
        message: "API connection successful" 
      };
    } else {
      return { success: false, error: "No completion was generated" };
    }
  } catch (error: any) {
    console.error("Error testing OpenAI API:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error occurred" 
    };
  }
};

// Test Grok API connection
export const testGrokAPIConnection = async (userId?: string) => {
  console.log("Testing Grok API connection...");
  try {
    const apiKey = await getGrokApiKey(userId);
    
    if (!apiKey) {
      return {
        success: false,
        error: "No Grok API key found. Please provide a valid API key in settings."
      };
    }
    
    // Test with a simple request to the models endpoint
    const response = await axios.get('https://api.xai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      return {
        success: true,
        models: response.data.data || response.data,
        response: response.data
      };
    } else {
      return {
        success: false,
        status: response.status,
        error: "Failed to connect to Grok API. Status: " + response.status,
        response: response.data
      };
    }
  } catch (error: any) {
    console.error("Error testing Grok API connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      response: error.response?.data
    };
  }
};

// Define task store interface
interface TaskStoreType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByDate: (filter: string) => Task[];
  getSortedTasks?: () => Task[];
  bulkUpdateTasks: (filter: string, updates: Partial<Task>) => void;
}

type Priority = 'high' | 'medium' | 'low';

/**
 * Process natural language task instructions using OpenAI's GPT model
 * This gives us true AI understanding of task requests without needing manual pattern matching
 */
export async function processTaskWithAI(message: string, taskStore: TaskStoreType): Promise<string> {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      throw new Error("Failed to initialize OpenAI client");
    }

    console.log("Processing message with AI:", message);
    
    // Create a comprehensive system prompt that guides the model to extract task intent
    const systemPrompt = `You are a task assistant that understands natural language instructions for task management.
Extract the task management intent from the user's message. Focus on:

1. Task Creation: "add task", "create task", "remind me to"
2. Task Updates: "change priority", "move to tomorrow"
3. Task Deletion: "delete task", "remove task"
4. Task Completion: "mark done", "complete task"
5. Task Queries: "show tasks", "list tasks"
6. Multi-task Selection: "tasks 1 and 2", "tasks 3,4,5"

Return a JSON response with:
{
  "intent": "create|update|delete|complete|list",
  "taskTitle": "task title if creating",
  "taskNumber": number if referencing specific task,
  "date": "due date if specified",
  "priority": "high|medium|low if specified",
  "targetDate": "date to move to if moving task",
  "property": "what to update if modifying",
  "value": "new value for update"
}`;

    // Send the request to the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    try {
      const taskData = JSON.parse(content);
      // Always include the original message to improve parsing of multi-task operations
      taskData.message = taskData.message || message;
      console.log("Parsed task data:", taskData);

      switch (taskData.intent?.toLowerCase()) {
        case "create":
          return handleAITaskCreation(taskData, taskStore);
        case "update":
          return handleAITaskModification(taskData, taskStore);
        case "delete":
          return handleAITaskDeletion(taskData, taskStore);
        case "complete":
          return handleAITaskCompletion(taskData, taskStore);
        case "list":
          if (taskData.priority) {
            return handleTaskListByPriority(taskData.priority, taskStore);
          }
          return handleTaskListRequest(taskData.date || "all", taskStore);
        default:
          return "I couldn't understand what you want to do with your tasks. Please try again with a clearer instruction.";
      }
    } catch (error) {
      console.error("Error processing task data:", error);
      return "I had trouble understanding your request. Please try rephrasing it.";
    }
  } catch (error) {
    console.error("Error in processTaskWithAI:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to process task. Please check your API key in settings."
    );
  }
}

/**
 * Generate subtasks for a complex activity using OpenAI
 * For example: breaking down "bake a cake" into multiple prerequisite steps
 */
async function generateSubtasksWithAI(message: string, taskStore: TaskStoreType): Promise<string> {
  try {
    const openai = await getOpenAIClient();
    
    // Extract the main activity from the message
    const activityMatch = message.match(/(?:help me|add tasks that would help|add subtasks|create subtasks|what steps|steps to)(?:\s+for)?\s+(.+?)(?:\s+by|\s+on|\s+due|\s+$)/i);
    const mainActivity = activityMatch ? activityMatch[1].trim() : message;
    
    const systemPrompt = `You are a task planning assistant. The user is asking for help breaking down a complex activity into subtasks.

CRITICAL INSTRUCTION: Never push to GitHub without explicit permission from the user.

Extract the main activity from their message and generate a list of 4-6 specific subtasks that would help them complete it. 
Each subtask should be specific, actionable, and clearly contribute to the overall goal.

For each subtask, include:
1. A clear title
2. A suggested due date (relative to today)
3. A priority level (high, medium, or low)
4. A short description if needed

Format your response as a JSON object:
{
  "mainActivity": "The main activity extracted from the user's message",
  "subtasks": [
    {
      "title": "Subtask 1 title",
      "dueDate": "today" or "tomorrow" or "+2 days",
      "priority": "high" or "medium" or "low",
      "description": "Optional description"
    },
    ...more subtasks...
  ]
}`;
    
    // Send the request to the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need to ${mainActivity}. What tasks should I create?` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const subtasksData = JSON.parse(content);
    console.log("Generated subtasks:", subtasksData);
    
    // Create all the subtasks
    const today = new Date();
    const correctYear = 2025; // Hardcoded to 2025 per requirement
    const createdTasks: string[] = [];
    
    if (subtasksData.subtasks && Array.isArray(subtasksData.subtasks)) {
      for (const subtask of subtasksData.subtasks) {
        // Parse the relative due date
        let dueDate = new Date();
        dueDate.setFullYear(correctYear);
        
        if (subtask.dueDate === "today") {
          dueDate = new Date();
          dueDate.setFullYear(correctYear);
        } else if (subtask.dueDate === "tomorrow") {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
          dueDate.setFullYear(correctYear);
        } else if (subtask.dueDate.startsWith("+")) {
          const daysToAdd = parseInt(subtask.dueDate.match(/\+(\d+)/)?.[1] || "0");
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + daysToAdd);
          dueDate.setFullYear(correctYear);
        }
        
        // Create a unique ID for the task
        const id = Date.now().toString() + Math.floor(Math.random() * 1000);
        
        // Create the task object
        const newTask = {
          id,
          title: subtask.title,
          description: subtask.description || "",
          dueDate,
          priority: (subtask.priority || "medium").toLowerCase() as "low" | "medium" | "high",
          status: "todo" as "todo" | "in_progress" | "done",
          createdAt: new Date(),
          updatedAt: new Date(),
          aiGenerated: true
        };
        
        // Add the task to the store
        taskStore.addTask(newTask);
        
        // Format the due date for display
        const dueDateString = dueDate.toLocaleDateString("en-US", { 
          weekday: "long", 
          month: "short", 
          day: "numeric"
        });
        
        createdTasks.push(`- "${subtask.title}" (${subtask.priority} priority, due ${dueDateString})`);
      }
    }
    
    // Return a summary of the created tasks
    return `✅ I've added ${createdTasks.length} subtasks to help you ${subtasksData.mainActivity || mainActivity}:\n\n${createdTasks.join("\n")}`;
  } catch (error) {
    console.error("Error generating subtasks with AI:", error);
    return "Sorry, I encountered an error while generating subtasks. Please try again.";
  }
}

/**
 * Parse natural language date references to JavaScript Date objects
 */
function parseDateReference(dateStr: string): Date | null {
  console.log("Parsing date reference:", dateStr);
  const today = new Date();
  const correctYear = 2025; // Hardcoded to 2025 per requirement
  
  if (!dateStr) return null;
  
  // Convert to lowercase for easier matching
  const normalizedDateStr = dateStr.toLowerCase().trim();
  
  // Handle "today" - using exact match or contains with word boundary
  if (normalizedDateStr === 'today' || normalizedDateStr.match(/\btoday\b/)) {
    console.log("Matched 'today', creating date object");
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Reset time part
    date.setFullYear(correctYear);
    console.log("Returning today's date with year set to 2025:", date.toISOString());
    return date;
  }
  
  // Handle "tomorrow"
  if (normalizedDateStr === 'tomorrow' || normalizedDateStr.match(/\btomorrow\b/)) {
    console.log("Matched 'tomorrow', creating date object");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Reset time part
    tomorrow.setFullYear(correctYear);
    console.log("Returning tomorrow's date with year set to 2025:", tomorrow.toISOString());
    return tomorrow;
  }
  
  // Handle day of week (e.g., "on Monday")
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (normalizedDateStr.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      
      // If the day has already passed this week, go to next week
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysToAdd);
      futureDate.setFullYear(correctYear);
      return futureDate;
    }
  }
  
  // Handle "next week"
  if (normalizedDateStr.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setFullYear(correctYear);
    return nextWeek;
  }
  
  // Handle "X days" (e.g., "in 3 days")
  const daysMatch = normalizedDateStr.match(/in (\d+) days?/);
  if (daysMatch && daysMatch[1]) {
    const daysToAdd = parseInt(daysMatch[1]);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    futureDate.setFullYear(correctYear);
    return futureDate;
  }
  
  // Handle specific date format (e.g., "on April 15")
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  
  for (let i = 0; i < monthNames.length; i++) {
    if (normalizedDateStr.includes(monthNames[i])) {
      const month = i;
      
      // Extract the day
      const dayMatch = normalizedDateStr.match(/(\d+)(st|nd|rd|th)?/);
      if (dayMatch && dayMatch[1]) {
        const day = parseInt(dayMatch[1]);
        
        // Set the date with the correct year
        const date = new Date();
        date.setMonth(month);
        date.setDate(day);
        date.setFullYear(correctYear);
        
        return date;
      }
    }
  }
  
  // Handle YYYY-MM-DD format
  const isoMatch = normalizedDateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1;
    const day = parseInt(isoMatch[3]);
    
    // If the year is the current year, use the correct year instead
    const date = new Date(year, month, day);
    if (year === today.getFullYear()) {
      date.setFullYear(correctYear);
    }
    return date;
  }
  
  // Handle MM/DD/YYYY format
  const usMatch = normalizedDateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const month = parseInt(usMatch[1]) - 1;
    const day = parseInt(usMatch[2]);
    const year = parseInt(usMatch[3]);
    
    // If the year is the current year, use the correct year instead
    const date = new Date(year, month, day);
    if (year === today.getFullYear()) {
      date.setFullYear(correctYear);
    }
    return date;
  }
  
  // Handle MM/DD format (assume correct year)
  const shortMatch = normalizedDateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (shortMatch) {
    const month = parseInt(shortMatch[1]) - 1;
    const day = parseInt(shortMatch[2]);
    
    const date = new Date();
    date.setMonth(month);
    date.setDate(day);
    date.setFullYear(correctYear);
    
    return date;
  }
  
  console.log("Could not parse date:", dateStr);
  return null;
}

/**
 * Handle task creation based on AI-parsed data
 */
function handleAITaskCreation(taskData: any, taskStore: TaskStoreType): string {
  // Extract task details
  const title = taskData.taskTitle || taskData.title;
  if (!title) {
    return "I couldn't understand the task title. Please specify what task you want to create.";
  }

  // Parse date if provided
  let dueDate: Date | undefined = undefined;
  if (taskData.date) {
    const parsedDate = parseDateReference(taskData.date);
    if (parsedDate) {
      dueDate = parsedDate;
    }
  }

  // Create task object
  const task: Task = {
    id: Date.now().toString(),
    title: title,
    description: taskData.description || "",
    priority: (taskData.priority || "medium").toLowerCase() as "high" | "medium" | "low",
    status: "todo" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: dueDate,
    aiGenerated: true
  };

  // Add task to store
  taskStore.addTask(task);

  // Format response
  const dueDateStr = task.dueDate 
    ? task.dueDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : "no due date";

  return `✅ Added task: "${task.title}" (${task.priority} priority, ${dueDateStr})`;
}

/**
 * Find task by number in a list (helper function)
 * Only includes uncompleted tasks
 */
function findTaskByNumber(taskNumber: number, taskStore: TaskStoreType): Task | null {
  // Get tasks in the current sort order and filter completed ones
  let activeTasks;
  
  // If getSortedTasks is available (it should be), use it to get tasks in proper order
  if (taskStore.getSortedTasks) {
    activeTasks = taskStore.getSortedTasks().filter(task => task.status !== "done");
  } else {
    // Fallback to unsorted tasks
    activeTasks = taskStore.tasks.filter(task => task.status !== "done");
  }
  
  if (taskNumber < 1 || taskNumber > activeTasks.length) {
    return null;
  }
  return activeTasks[taskNumber - 1] || null;
}

/**
 * Find task by title/name in a list (helper function)
 * Only includes uncompleted tasks
 */
function findTaskByName(taskTitle: string, taskStore: TaskStoreType): Task | null {
  // Filter out completed tasks
  const activeTasks = taskStore.tasks.filter(task => task.status !== "done");
  const normalizedTitle = taskTitle.toLowerCase().trim();
  
  // First try exact match
  let matchedTask = activeTasks.find(task => 
    task.title.toLowerCase() === normalizedTitle
  );
  
  // If no exact match, try contains
  if (!matchedTask) {
    matchedTask = activeTasks.find(task => 
      task.title.toLowerCase().includes(normalizedTitle)
    );
  }
  
  return matchedTask || null;
}

/**
 * Delete a task by number
 */
function deleteTaskByNumber(taskNumber: number, taskStore: TaskStoreType): string {
  const task = findTaskByNumber(taskNumber, taskStore);
  
  if (!task) {
    return `Task #${taskNumber} not found. Please check the task number and try again.`;
  }
  
  taskStore.deleteTask(task.id);
  return `✅ Deleted task #${taskNumber}: "${task.title}"`;
}

/**
 * Delete a task by name/title
 */
function deleteTaskByName(taskTitle: string, taskStore: TaskStoreType): string {
  const task = findTaskByName(taskTitle, taskStore);
  
  if (!task) {
    return `Task "${taskTitle}" not found. Please check the task name and try again.`;
  }
  
  const { position } = getTaskWithPosition(task, taskStore);
  taskStore.deleteTask(task.id);
  return `✅ Deleted task #${position}: "${task.title}"`;
}

/**
 * Mark a task as complete by number
 */
function completeTaskByNumber(taskNumber: number, taskStore: TaskStoreType): string {
  const task = findTaskByNumber(taskNumber, taskStore);
  
  if (!task) {
    return `Task #${taskNumber} not found. Please check the task number and try again.`;
  }
  
  taskStore.updateTask(task.id, { status: "done" });
  return `✅ Marked task #${taskNumber} "${task.title}" as complete.`;
}

/**
 * Mark a task as complete by name/title
 */
function completeTaskByName(taskTitle: string, taskStore: TaskStoreType): string {
  const task = findTaskByName(taskTitle, taskStore);
  
  if (!task) {
    return `Task "${taskTitle}" not found. Please check the task name and try again.`;
  }
  
  const { position } = getTaskWithPosition(task, taskStore);
  taskStore.updateTask(task.id, { status: "done" });
  return `✅ Marked task #${position} "${task.title}" as complete.`;
}

/**
 * Handle task deletion based on AI-parsed data
 */
function handleAITaskDeletion(taskData: any, taskStore: TaskStoreType): string {
  console.log("Handling task deletion with data:", taskData);
  
  // Try to extract task numbers from the original message if available
  if (taskData.message) {
    const taskNumbers = extractTaskNumbers(taskData.message);
    console.log("Extracted task numbers from message:", taskNumbers);
    
    if (taskNumbers.length > 0) {
      // Handle bulk deletion
      const activeTasks = taskStore.tasks.filter(task => task.status !== "done");
      const foundTasks: Task[] = [];
      const notFoundNumbers: number[] = [];
      
      // Find all tasks by their numbers
      taskNumbers.forEach(number => {
        if (number > 0 && number <= activeTasks.length) {
          foundTasks.push(activeTasks[number - 1]);
        } else {
          notFoundNumbers.push(number);
        }
      });
      
      // Delete all found tasks
      if (foundTasks.length > 0) {
        foundTasks.forEach(task => {
          taskStore.deleteTask(task.id);
        });
        
        if (notFoundNumbers.length > 0) {
          return `Deleted ${foundTasks.length} task(s). Could not find task numbers: ${notFoundNumbers.join(', ')}.`;
        }
        return `Successfully deleted ${foundTasks.length} task(s).`;
      } else {
        return `Could not find any tasks with numbers: ${taskNumbers.join(', ')}.`;
      }
    }
  }
  
  // Fallback to original single task deletion logic
  // If we have a task number, delete by number
  if (taskData.taskNumber !== undefined) {
    return deleteTaskByNumber(taskData.taskNumber, taskStore);
  }
  
  // If we have a task title, try to delete by name
  if (taskData.taskTitle) {
    return deleteTaskByName(taskData.taskTitle, taskStore);
  }
  
  return "I couldn't determine which task you want to delete. Please specify a task number or title.";
}

/**
 * Handle task completion based on AI-parsed data
 */
function handleAITaskCompletion(taskData: any, taskStore: TaskStoreType): string {
  console.log("Handling task completion with data:", taskData);
  
  // Try to extract task numbers from the original message if available
  if (taskData.message) {
    const taskNumbers = extractTaskNumbers(taskData.message);
    console.log("Extracted task numbers from message:", taskNumbers);
    
    if (taskNumbers.length > 0) {
      // Handle bulk completion
      const activeTasks = taskStore.tasks.filter(task => task.status !== "done");
      const foundTasks: Task[] = [];
      const notFoundNumbers: number[] = [];
      
      // Find all tasks by their numbers
      taskNumbers.forEach(number => {
        if (number > 0 && number <= activeTasks.length) {
          foundTasks.push(activeTasks[number - 1]);
        } else {
          notFoundNumbers.push(number);
        }
      });
      
      // Complete all found tasks
      if (foundTasks.length > 0) {
        foundTasks.forEach(task => {
          taskStore.updateTask(task.id, { status: "done", updatedAt: new Date() });
        });
        
        if (notFoundNumbers.length > 0) {
          return `Completed ${foundTasks.length} task(s). Could not find task numbers: ${notFoundNumbers.join(', ')}.`;
        }
        return `Successfully completed ${foundTasks.length} task(s).`;
      } else {
        return `Could not find any tasks with numbers: ${taskNumbers.join(', ')}.`;
      }
    }
  }
  
  // Fallback to original single task completion logic
  // If we have a task number, complete by number
  if (taskData.taskNumber !== undefined) {
    return completeTaskByNumber(taskData.taskNumber, taskStore);
  }
  
  // If we have a task title, try to complete by name
  if (taskData.taskTitle) {
    return completeTaskByName(taskData.taskTitle, taskStore);
  }
  
  return "I couldn't determine which task you want to complete. Please specify a task number or title.";
}

/**
 * Get task with its numerical position in the list of active tasks
 */
function getTaskWithPosition(task: Task, taskStore: TaskStoreType): { task: Task; position: number } {
  // Get tasks in the current sort order and filter completed ones
  let activeTasks;
  
  // If getSortedTasks is available (it should be), use it to get tasks in proper order
  if (taskStore.getSortedTasks) {
    activeTasks = taskStore.getSortedTasks().filter(task => task.status !== "done");
  } else {
    // Fallback to unsorted tasks
    activeTasks = taskStore.tasks.filter(task => task.status !== "done");
  }
  
  const position = activeTasks.findIndex(t => t.id === task.id) + 1;
  return { task, position };
}

/**
 * Format task for display with numerical position
 */
function formatTaskWithPosition(task: Task, position: number, includeDetails: boolean = true): string {
  const dueDate = task.dueDate 
    ? task.dueDate.toLocaleDateString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric" 
      })
    : "No due date";
  
  if (includeDetails) {
    return `#${position}. ${task.title} (${task.priority} priority, due ${dueDate})${task.status === "done" ? " ✓" : ""}`;
  } else {
    return `#${position}. ${task.title}`;
  }
}

/**
 * Handle task list request with numerical ordering
 * Only includes uncompleted tasks
 */
function handleTaskListRequest(dateFilter: string, taskStore: TaskStoreType): string {
  // Get the tasks based on the filter, excluding completed tasks
  let tasks: Task[] = [];
  
  if (dateFilter === "all") {
    tasks = taskStore.tasks.filter(task => task.status !== "done");
  } else {
    tasks = taskStore.getTasksByDate(dateFilter).filter(task => task.status !== "done");
  }
  
  if (tasks.length === 0) {
    if (dateFilter === "all") {
      return "You don't have any active tasks. Add some tasks to get started!";
    } else {
      return `You don't have any active tasks ${dateFilter === "today" ? "for today" : "for " + dateFilter}.`;
    }
  }
  
  // Format the task list with numerical positions
  const formattedTasks = tasks.map((task, index) => formatTaskWithPosition(task, index + 1));
  
  const dateDescription = dateFilter === "all" ? "all active tasks" : `active tasks for ${dateFilter}`;
  return `Here are your ${dateDescription}:\n\n${formattedTasks.join("\n")}`;
}

/**
 * Handle task list by priority with numerical ordering
 * Only includes uncompleted tasks
 */
function handleTaskListByPriority(priority: "high" | "medium" | "low", taskStore: TaskStoreType): string {
  const tasks = taskStore.tasks.filter(task => task.priority === priority && task.status !== "done");
  
  if (tasks.length === 0) {
    return `You don't have any active ${priority} priority tasks.`;
  }
  
  // Format the task list with numerical positions
  const formattedTasks = tasks.map((task, index) => formatTaskWithPosition(task, index + 1));
  
  return `Here are your active ${priority} priority tasks:\n\n${formattedTasks.join("\n")}`;
}

/**
 * Move a task to a specific date by number
 */
function moveTaskByNumber(taskNumber: number, targetDate: string, taskStore: TaskStoreType): string {
  const task = findTaskByNumber(taskNumber, taskStore);
  
  if (!task) {
    return `Task #${taskNumber} not found. Please check the task number and try again.`;
  }
  
  const newDate = parseDateReference(targetDate);
  if (!newDate) {
    return `I couldn't understand the date "${targetDate}". Please try a different format.`;
  }
  
  // Ensure correct year (2025)
  if (newDate.getFullYear() !== 2025) {
    newDate.setFullYear(2025);
  }
  
  taskStore.updateTask(task.id, { dueDate: newDate });
  
  const dueDateString = newDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric"
  });
  
  return `✅ Moved task #${taskNumber} "${task.title}" to ${dueDateString}.`;
}

/**
 * Change a task's priority by number
 */
function priorityTaskByNumber(taskNumber: number, priority: "high" | "medium" | "low", taskStore: TaskStoreType): string {
  const task = findTaskByNumber(taskNumber, taskStore);
  
  if (!task) {
    return `Task #${taskNumber} not found. Please check the task number and try again.`;
  }
  
  taskStore.updateTask(task.id, { priority });
  return `✅ Changed priority of task #${taskNumber} "${task.title}" to ${priority}.`;
}

/**
 * Handle task modification based on AI-parsed data
 */
function handleAITaskModification(taskData: any, taskStore: TaskStoreType): string {
  console.log("Handling task modification:", taskData);
  
  // Try to directly parse task numbers from the original user message
  // This is a new approach that doesn't rely on the AI correctly identifying task numbers
  const originalMessage = taskData.message || "";
  const directTaskNumbers = extractTaskNumbers(originalMessage);
  
  console.log("Direct task number extraction:", directTaskNumbers);
  
  // If we found multiple task numbers directly from the message
  if (directTaskNumbers.length > 1) {
    console.log("Detected multi-task operation based on direct extraction:", directTaskNumbers);
    
    // Get active tasks (not completed)
    let activeTasks;
    if (taskStore.getSortedTasks) {
      activeTasks = taskStore.getSortedTasks().filter(task => task.status !== "done");
    } else {
      activeTasks = taskStore.tasks.filter(task => task.status !== "done");
    }
    
    // Get valid tasks based on provided numbers
    const selectedTasks = directTaskNumbers
      .map(num => (num >= 1 && num <= activeTasks.length) ? activeTasks[num - 1] : null)
      .filter((task): task is Task => task !== null);
    
    if (selectedTasks.length === 0) {
      return `Task #${directTaskNumbers.join(',')} not found. Please check the task number and try again.`;
    }
    
    // Determine the operation type and target values
    const isMovingTasks = originalMessage.toLowerCase().includes("move");
    const isChangingPriority = originalMessage.toLowerCase().includes("priority");
    
    // Handle changing priority
    if (isChangingPriority) {
      const priority = (originalMessage.toLowerCase().includes("high") ? "high" : 
                     originalMessage.toLowerCase().includes("medium") ? "medium" : 
                     originalMessage.toLowerCase().includes("low") ? "low" : 
                     taskData.priority) as "high" | "medium" | "low";
      
      if (!priority) {
        return "I couldn't determine which priority to set for the tasks.";
      }
      
      const updatedTasks = selectedTasks.map(task => {
        const position = activeTasks.findIndex(t => t.id === task.id) + 1;
        taskStore.updateTask(task.id, { priority });
        return formatTaskWithPosition(task, position, false);
      });
      
      return `✅ Changed the following tasks to ${priority} priority:\n\n${updatedTasks.join("\n")}`;
    }
    
    // Other multi-task handling continues as before...
  }
  
  // Original implementation continues for single task operations...
  // Check for multi-task operations first (using the full message)
  if (taskData.message) {
    const message = taskData.message;
    const taskNumbers = extractTaskNumbers(message);
    
    if (taskNumbers.length > 1) {
      console.log("Detected multi-task operation with task numbers:", taskNumbers);
      
      // Get active tasks (not completed)
      let activeTasks;
      if (taskStore.getSortedTasks) {
        activeTasks = taskStore.getSortedTasks().filter(task => task.status !== "done");
      } else {
        activeTasks = taskStore.tasks.filter(task => task.status !== "done");
      }
      
      // Get valid tasks based on provided numbers
      const selectedTasks = taskNumbers
        .map(num => (num >= 1 && num <= activeTasks.length) ? activeTasks[num - 1] : null)
        .filter((task): task is Task => task !== null);
      
      if (selectedTasks.length === 0) {
        return `Task #${taskNumbers.join(',')} not found. Please check the task number and try again.`;
      }
      
      // Determine the operation type and target values
      const isMovingTasks = message.toLowerCase().includes("move");
      const isChangingPriority = message.toLowerCase().includes("priority");
      
      // Handle moving tasks to a specific date
      if (isMovingTasks && taskData.targetDate) {
        const targetDate = parseDateReference(taskData.targetDate);
        if (!targetDate) {
          return `I couldn't understand the date "${taskData.targetDate}". Please try a different format.`;
        }
        
        const updatedTasks = selectedTasks.map(task => {
          const position = activeTasks.findIndex(t => t.id === task.id) + 1;
          taskStore.updateTask(task.id, { dueDate: targetDate });
          return formatTaskWithPosition(task, position, false);
        });
        
        const dueDateString = targetDate.toLocaleDateString("en-US", { 
          weekday: "long", 
          month: "short", 
          day: "numeric"
        });
        
        return `✅ Moved the following tasks to ${dueDateString}:\n\n${updatedTasks.join("\n")}`;
      }
      
      // Handle changing priority
      if (isChangingPriority && taskData.priority) {
        const priority = taskData.priority.toLowerCase() as "high" | "medium" | "low";
        
        const updatedTasks = selectedTasks.map(task => {
          const position = activeTasks.findIndex(t => t.id === task.id) + 1;
          taskStore.updateTask(task.id, { priority });
          return formatTaskWithPosition(task, position, false);
        });
        
        return `✅ Changed the following tasks to ${priority} priority:\n\n${updatedTasks.join("\n")}`;
      }
      
      return "I couldn't determine what action you want to perform on the selected tasks.";
    }
  }
  
  // Handle moving a single task to a specific date
  if (taskData.taskNumber !== undefined && taskData.targetDate) {
    return moveTaskByNumber(taskData.taskNumber, taskData.targetDate, taskStore);
  }
  
  // Handle updating a single task's priority by number
  if (taskData.taskNumber !== undefined && (taskData.priority || (taskData.property === "priority" && taskData.value))) {
    const priorityValue = taskData.priority || taskData.value;
    return priorityTaskByNumber(
      taskData.taskNumber,
      priorityValue.toLowerCase() as "high" | "medium" | "low",
      taskStore
    );
  }
  
  // Handle updating a single task's priority by name
  if (taskData.taskTitle && (taskData.priority || (taskData.property === "priority" && taskData.value))) {
    const priorityValue = taskData.priority || taskData.value;
    const task = findTaskByName(taskData.taskTitle, taskStore);
    
    if (!task) {
      return `Task "${taskData.taskTitle}" not found.`;
    }
    
    const { position } = getTaskWithPosition(task, taskStore);
    taskStore.updateTask(task.id, { 
      priority: priorityValue.toLowerCase() as "low" | "medium" | "high" 
    });
    
    return `✅ Updated priority for task #${position} "${task.title}" to ${priorityValue}.`;
  }
  
  return "I couldn't determine how to modify the task. Please specify what you want to change.";
}

/**
 * Extract task numbers from a string containing patterns like "1 and 2" or "5, 6, and 7"
 * Returns an array of numbers representing the selected task positions
 */
function extractTaskNumbers(message: string): number[] {
  const numbers: number[] = [];
  console.log("Extracting task numbers from:", message);
  
  // Basic direct number pattern - handles formats like "1 and 3" without requiring "task" keyword
  const directPattern = /\b(\d+)\s+and\s+(\d+)\b/i;
  const directMatch = message.match(directPattern);
  if (directMatch) {
    console.log("Matched direct 'X and Y' pattern:", directMatch);
    const num1 = parseInt(directMatch[1], 10);
    const num2 = parseInt(directMatch[2], 10);
    if (!isNaN(num1)) numbers.push(num1);
    if (!isNaN(num2)) numbers.push(num2);
    return numbers;
  }
  
  // Delete pattern: "delete tasks 1,2,4 and 5" or "delete task 1 and 2"
  const deletePattern = /delete\s+tasks?\s+([\d,\s]+(?:and\s+\d+)?)/i;
  const deleteMatch = message.match(deletePattern);
  if (deleteMatch && deleteMatch[1]) {
    console.log("Matched 'delete tasks' pattern:", deleteMatch);
    const allNumbers = deleteMatch[1].match(/\d+/g);
    if (allNumbers) {
      allNumbers.forEach(numStr => {
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) numbers.push(num);
      });
    }
    return numbers;
  }
  
  // Complete pattern: "complete tasks 1 and 2" or "mark tasks 1,2,3 as complete"
  const completePattern = /(?:complete|mark)\s+tasks?\s+([\d,\s]+(?:and\s+\d+)?)/i;
  const completeMatch = message.match(completePattern);
  if (completeMatch && completeMatch[1]) {
    console.log("Matched 'complete tasks' pattern:", completeMatch);
    const allNumbers = completeMatch[1].match(/\d+/g);
    if (allNumbers) {
      allNumbers.forEach(numStr => {
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) numbers.push(num);
      });
    }
    return numbers;
  }
  
  // Pattern 1: "task 1 and 2" or "tasks 1 and 2" or "move task 1 and 2"
  const andPattern = /(?:move\s+)?tasks?\s+(\d+)\s+and\s+(\d+)/i;
  const andMatch = message.match(andPattern);
  if (andMatch) {
    console.log("Matched 'and' pattern:", andMatch);
    const num1 = parseInt(andMatch[1], 10);
    const num2 = parseInt(andMatch[2], 10);
    if (!isNaN(num1)) numbers.push(num1);
    if (!isNaN(num2)) numbers.push(num2);
    return numbers;
  }
  
  // Pattern 2: "tasks 1, 2, and 3" or similar comma-separated lists
  const commaPattern = /(?:move\s+)?tasks?\s+((?:\d+(?:\s*,\s*|\s+and\s+))+\d+)/i;
  const commaMatch = message.match(commaPattern);
  if (commaMatch && commaMatch[1]) {
    console.log("Matched comma pattern:", commaMatch);
    // Extract all numbers from the matched section
    const numberMatches = commaMatch[1].match(/\d+/g);
    if (numberMatches) {
      numberMatches.forEach(numStr => {
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) numbers.push(num);
      });
    }
    return numbers;
  }
  
  // Simple single number pattern
  const singleNumberPattern = /task\s+(\d+)/i;
  const singleMatch = message.match(singleNumberPattern);
  if (singleMatch) {
    console.log("Matched single task number pattern:", singleMatch);
    const num = parseInt(singleMatch[1], 10);
    if (!isNaN(num)) numbers.push(num);
    return numbers;
  }
  
  console.log("No task numbers found in message");
  return numbers;
}

/**
 * Handle bulk action with numerical ordering
 * Only affects uncompleted tasks
 */
function handleBulkAction(taskData: any, taskStore: TaskStoreType): string {
  console.log("Handling bulk action with data:", taskData);
  
  // Extract task numbers if this is a multi-task selection command
  const message = taskData.message || "";
  const selectedTaskNumbers = extractTaskNumbers(message);
  console.log("Selected task numbers:", selectedTaskNumbers);
  
  // Enhanced intent detection
  const intent = taskData.intent?.toLowerCase() || 
               (taskData.message?.toLowerCase().includes("delete") ? "delete" : 
                taskData.message?.toLowerCase().includes("complete") ? "complete" :
                taskData.message?.toLowerCase().includes("move") || 
                taskData.message?.toLowerCase().includes("set") ||
                taskData.message?.toLowerCase().includes("change") ? "update" : "unknown");
  
  // Enhanced property detection
  const propertyUpdate = taskData.property?.toLowerCase() || 
                      (taskData.message?.toLowerCase().includes("priority") ? "priority" :
                       taskData.message?.toLowerCase().includes("status") ? "status" :
                       taskData.message?.toLowerCase().includes("due") ? "dueDate" : null);
  
  // Enhanced value detection
  const updateValue = taskData.value || 
                   (taskData.message?.toLowerCase().includes("high") ? "high" :
                    taskData.message?.toLowerCase().includes("medium") ? "medium" :
                    taskData.message?.toLowerCase().includes("low") ? "low" : null);
  
  // Handle operations on specific selected tasks if task numbers are provided
  if (selectedTaskNumbers.length > 0) {
    console.log("Processing multi-task selection:", selectedTaskNumbers);
    
    // Get active tasks (not completed)
    const activeTasks = taskStore.tasks.filter(task => task.status !== "done");
    
    // Get valid tasks based on provided numbers
    const selectedTasks = selectedTaskNumbers
      .map(num => (num >= 1 && num <= activeTasks.length) ? activeTasks[num - 1] : null)
      .filter((task): task is Task => task !== null);
    
    if (selectedTasks.length === 0) {
      return "I couldn't find the specified tasks. Please check the task numbers and try again.";
    }
    
    // Handle different operations on selected tasks
    if (intent === "delete" || intent === "remove") {
      const tasksToDelete = selectedTasks.map((task, index) => {
        const position = activeTasks.findIndex(t => t.id === task.id) + 1;
        return formatTaskWithPosition(task, position, false);
      });
      
      selectedTasks.forEach(task => taskStore.deleteTask(task.id));
      
      return `✅ Deleted the following tasks:\n\n${tasksToDelete.join("\n")}`;
    }
    
    if (intent === "complete" || intent === "finish" || intent === "mark") {
      const completedTasks = selectedTasks.map(task => {
        const position = activeTasks.findIndex(t => t.id === task.id) + 1;
        taskStore.updateTask(task.id, { status: "done" });
        return formatTaskWithPosition(task, position, false);
      });
      
      return `✅ Marked the following tasks as complete:\n\n${completedTasks.join("\n")}`;
    }
    
    // Handle property updates (like priority)
    if (intent === "update" && propertyUpdate && updateValue) {
      const updatedTasks = selectedTasks.map(task => {
        const position = activeTasks.findIndex(t => t.id === task.id) + 1;
        
        if (propertyUpdate === "priority") {
          taskStore.updateTask(task.id, { 
            priority: updateValue as "high" | "medium" | "low" 
          });
        } else if (propertyUpdate === "status") {
          taskStore.updateTask(task.id, { 
            status: updateValue as "todo" | "in_progress" | "done"
          });
        } else if (propertyUpdate === "dueDate") {
          const date = parseDateReference(updateValue);
          if (date) {
            taskStore.updateTask(task.id, { dueDate: date });
          }
        }
        
        return formatTaskWithPosition(task, position, false);
      });
      
      return `✅ Updated the following tasks to ${updateValue} ${propertyUpdate}:\n\n${updatedTasks.join("\n")}`;
    }
    
    // Move tasks to a specific date
    if ((intent === "move" || intent === "update") && taskData.targetDate) {
      const targetDate = parseDateReference(taskData.targetDate);
      if (!targetDate) {
        return `I couldn't understand the date "${taskData.targetDate}". Please try a different format.`;
      }
      
      const updatedTasks = selectedTasks.map(task => {
        const position = activeTasks.findIndex(t => t.id === task.id) + 1;
        taskStore.updateTask(task.id, { dueDate: targetDate });
        return formatTaskWithPosition(task, position, false);
      });
      
      const dueDateString = targetDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "short", 
        day: "numeric"
      });
      
      return `✅ Moved the following tasks to ${dueDateString}:\n\n${updatedTasks.join("\n")}`;
    }
    
    return "I couldn't determine what action you want to perform on the selected tasks.";
  }
  
  // Determine filter for bulk operations on all tasks
  let filter = taskData.filter?.toLowerCase() || "all";
  let dateFilter = taskData.date?.toLowerCase();
  
  // Check for target date (for "move all tasks to X")
  const targetDate = taskData.targetDate || 
                   (taskData.message?.toLowerCase().includes("today") ? "today" : 
                    taskData.message?.toLowerCase().includes("tomorrow") ? "tomorrow" : null);
  
  console.log("Bulk action:", { intent, propertyUpdate, updateValue, filter, dateFilter, targetDate });
  
  // If there's a date mentioned, use it as the filter
  if (dateFilter) {
    filter = dateFilter;
  }
  
  // Get the filtered tasks with their positions, excluding completed tasks
  let filteredTasks: Task[] = [];
  
  if (filter === "all") {
    filteredTasks = taskStore.tasks.filter(task => task.status !== "done");
  } else if (filter === "today" || filter === "tomorrow" || filter === "this week" || filter === "next week" || filter === "overdue" || filter === "no date" || filter === "undated") {
    filteredTasks = taskStore.getTasksByDate(filter).filter(task => task.status !== "done");
  }
  
  // Handle moving all tasks to a specific date
  if ((intent === "move" || intent === "update") && targetDate) {
    console.log(`Attempting to move all tasks to target date: "${targetDate}"`);
    
    const newDate = parseDateReference(targetDate);
    console.log("Parsed date result:", newDate);
    
    if (!newDate) {
      return `I couldn't understand the date "${targetDate}". Please try a different format.`;
    }
    
    // Ensure correct year (2025)
    if (newDate.getFullYear() !== 2025) {
      newDate.setFullYear(2025);
    }
    
    console.log(`Moving ${filteredTasks.length} tasks to date:`, newDate.toISOString());
    const updatedTasks: string[] = [];
    
    filteredTasks.forEach((task, index) => {
      console.log(`Moving task ID ${task.id} to new date`);
      taskStore.updateTask(task.id, { dueDate: newDate });
      updatedTasks.push(formatTaskWithPosition(task, index + 1, false));
    });
    
    if (updatedTasks.length > 0) {
      const dueDateString = newDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "short", 
        day: "numeric"
      });
      
      return `✅ Moved the following tasks to ${dueDateString}:\n\n${updatedTasks.join("\n")}`;
    }
    
    return `No active tasks found to move ${filter !== "all" ? `for ${filter}` : ""}.`;
  }
  
  // Handle property updates with position information
  if (intent === "update" && propertyUpdate && updateValue) {
    let updatedTasks: string[] = [];
    
    filteredTasks.forEach((task, index) => {
      if (propertyUpdate === "priority") {
        task.priority = updateValue as "high" | "medium" | "low";
        taskStore.updateTask(task.id, { priority: task.priority });
        updatedTasks.push(formatTaskWithPosition(task, index + 1, false));
      }
    });
    
    if (updatedTasks.length > 0) {
      return `Updated the following tasks to ${updateValue} ${propertyUpdate}:\n\n${updatedTasks.join("\n")}`;
    }
    return `No active tasks found to update ${filter !== "all" ? `for ${filter}` : ""}.`;
  }
  
  // Handle other bulk actions with position information
  if (intent === "delete" || intent === "remove") {
    const tasksToDelete = filteredTasks.map((task, index) => formatTaskWithPosition(task, index + 1, false));
    filteredTasks.forEach(task => taskStore.deleteTask(task.id));
    
    if (tasksToDelete.length > 0) {
      return `✅ Deleted the following tasks:\n\n${tasksToDelete.join("\n")}`;
    }
    return `No active tasks found to delete ${filter !== "all" ? `for ${filter}` : ""}.`;
  }
  
  if (intent === "complete" || intent === "finish" || intent === "mark") {
    const completedTasks = filteredTasks.map((task, index) => {
      taskStore.updateTask(task.id, { status: "done" });
      return formatTaskWithPosition(task, index + 1, false);
    });
    
    if (completedTasks.length > 0) {
      return `✅ Marked the following tasks as complete:\n\n${completedTasks.join("\n")}`;
    }
    return `No active tasks found to complete ${filter !== "all" ? `for ${filter}` : ""}.`;
  }
  
  return "I couldn't determine what bulk action you want to perform on your tasks.";
}

/**
 * Main function to handle AI responses for the chat interface
 * This function intelligently determines if the query is task-related or a general question
 * and responds accordingly without requiring explicit mode switching
 */
export async function getAIResponse(message: string, userId: string): Promise<string> {
  console.log(`Processing AI response with message: ${message}`);
  try {
    const taskStore = useStore.getState();
    console.log("taskStore available:", !!taskStore);
    
    // Get current model from localStorage
    const currentModel = localStorage.getItem('selected_model') as AIModel || 'gpt-3.5-turbo';
    
    // Get the normalized message for logging
    const normalizedMessage = message.toLowerCase().trim();
    console.log("Processing normalized message:", normalizedMessage);
    
    // Use AI-based classification to determine if this is a task-related query
    const openai = await getOpenAIClient();
    
    // Get comprehensive classification using AI understanding
    const classificationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: 'system', 
          content: `You are a classifier that determines if a message is related to task management or a general knowledge question.

Task management queries are about:
- Creating, updating, managing, or deleting user's personal tasks or to-dos
- Checking, listing, viewing, or organizing a user's personal tasks
- Setting deadlines, priorities, or modifying task attributes
- Completing user's tasks or marking them as done
- Any query that asks you to interact with the user's task management system

General knowledge queries include:
- Factual questions about the world, history, science, geography
- Questions about concepts, ideas, places, or things
- Requests for help that don't involve managing the user's tasks
- Queries seeking information or explanations on any topic
- Any question about facts, events, people, or knowledge not related to the user's personal tasks

Based on true AI understanding of language, determine the user's intent.
Respond with ONLY ONE WORD: "TASK" or "GENERAL"` 
        },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    
    const classification = classificationResponse.choices[0].message.content?.trim().toUpperCase();
    console.log("AI classification result:", classification);
    
    // Process based on classification
    if (classification === 'TASK') {
      // If classified as task-related, use task processing
      console.log("AI classified as task-related, using task processing");
      return await processAITaskQuery(message, taskStore);
    } else {
      // If general knowledge question, use model-specific response
      console.log("AI classified as general knowledge, using general response");
      
      // Handle based on selected model
      if (currentModel === 'perplexity-sonar') {
        return await callPerplexityAPI(message);
      } else if (currentModel === 'deepseek-r1') {
        return await callDeepSeekAPI(message);
      } else if (currentModel === 'grok-2-1212') {
        return await callGrokAPI(message, userId);
      } else {
        // For GPT-4o or GPT-o3 Mini models, use general conversation
        const history = await getConversationHistory(userId);
        
        // Create messages array with system prompt and history
        const messages = [
          { role: 'system' as const, content: "You are a helpful and friendly assistant. Be concise and to the point." },
          ...history,
          { role: 'user' as const, content: message }
        ];
        
        // Call OpenAI API
        console.log("Calling OpenAI API with messages:", messages);
        const response = await openai.chat.completions.create({
          model: currentModel === 'gpt-o3-mini' ? "gpt-3.5-turbo" : "gpt-3.5-turbo",
          messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        
        // Get response content
        const responseContent = response.choices[0].message.content || "I'm not sure how to respond to that.";
        console.log("Received response from OpenAI:", responseContent.substring(0, 100) + "...");
        
        // Save the conversation
        await saveMessageToHistory(userId, 'user', message);
        await saveMessageToHistory(userId, 'assistant', responseContent);
        
        return responseContent;
      }
    }
  } catch (error) {
    console.error("Error in getAIResponse:", error);
    return "I encountered an error. Please try again later.";
  }
}

/**
 * Process natural language task instructions using OpenAI's GPT model exclusively.
 * This function only uses AI capabilities and does not fall back to regex patterns.
 */
export async function processAITaskQuery(message: string, taskStore: TaskStoreType): Promise<string> {
  console.log("Processing task exclusively with GPT-4o:", message);
  console.log("taskStore available:", !!taskStore);
  console.log("taskStore methods:", Object.keys(taskStore || {}));
  
  try {
    // First check for direct command patterns for bulk operations
    const normalizedMessage = message.toLowerCase().trim();
    
    // Add special handler for "move task X and Y to date" pattern
    const moveTasksToDatePattern = /move\s+tasks?\s+(\d+)\s+and\s+(\d+)\s+to\s+(today|tomorrow|next\s+week|this\s+week)/i;
    const moveTasksToDateMatch = normalizedMessage.match(moveTasksToDatePattern);
    if (moveTasksToDateMatch) {
      console.log("Direct match: move specific tasks to a date");
      const num1 = parseInt(moveTasksToDateMatch[1], 10);
      const num2 = parseInt(moveTasksToDateMatch[2], 10);
      const targetDate = moveTasksToDateMatch[3];
      
      // Create taskData manually with message for task extraction
      const taskData = {
        intent: "move",
        message: `move task ${num1} and ${num2}`,
        targetDate: targetDate
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Direct pattern matching for multi-task selection (added for fallback)
    const multiTaskPattern = /(?:(?:move|mark|complete|set|change)\s+)?tasks?\s+\d+(?:\s*,\s*|\s+and\s+)\d+/i;
    if (multiTaskPattern.test(normalizedMessage)) {
      console.log("Direct multi-task pattern match detected, letting AI handle it");
      return await processTaskWithAI(message, taskStore);
    }
    
    // Add pattern for "move tasks for today to tomorrow"
    const moveTasksForDayPattern = /^move\s+all\s+tasks\s+(?:for|from)\s+(today|tomorrow|this\s+week|next\s+week)\s+to\s+(today|tomorrow|next\s+week|this\s+week)\.?$/i;
    const moveTasksForDayMatch = normalizedMessage.match(moveTasksForDayPattern);
    if (moveTasksForDayMatch) {
      console.log("Direct match: move all tasks from specific day to another day");
      const sourceDate = moveTasksForDayMatch[1];
      const targetDate = moveTasksForDayMatch[2];
      
      // Create taskData manually
      const taskData = {
        intent: "move",
        bulkAction: true,
        filter: sourceDate,
        targetDate: targetDate
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Add a direct pattern match for "move all tasks to today" command
    const moveAllTasksPattern = /^move\s+all\s+tasks\s+to\s+(today|tomorrow|next\s+week|this\s+week)\.?$/i;
    const moveAllTasksMatch = normalizedMessage.match(moveAllTasksPattern);
    if (moveAllTasksMatch) {
      console.log("Direct match: move all tasks to specific date");
      const targetDate = moveAllTasksMatch[1];
      
      // Create taskData manually
      const taskData = {
        intent: "move",
        bulkAction: true,
        filter: "all",
        targetDate: targetDate
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Add a direct pattern match for priority change
    const priorityChangePattern = /^move\s+all\s+tasks\s+to\s+(high|medium|low)\s+priority\.?$/i;
    const priorityMatch = normalizedMessage.match(priorityChangePattern);
    if (priorityMatch) {
      console.log("Direct match: change all tasks to specific priority");
      const priorityValue = priorityMatch[1].toLowerCase();
      
      // Create taskData manually
      const taskData = {
        intent: "update",
        bulkAction: true,
        filter: "all",
        property: "priority",
        value: priorityValue
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Handle direct bulk operations with regex as a fallback
    // Check for "delete all tasks" pattern
    if (/^delete\s+all\s+tasks(\s+for\s+(today|tomorrow|this\s+week|next\s+week))?\.?$/i.test(normalizedMessage)) {
      console.log("Direct match: delete all tasks");
      const filter = normalizedMessage.includes("today") ? "today" : 
                    normalizedMessage.includes("tomorrow") ? "tomorrow" :
                    normalizedMessage.includes("this week") ? "this week" :
                    normalizedMessage.includes("next week") ? "next week" : "all";
      
      // Create taskData manually
      const taskData = {
        intent: "delete",
        bulkAction: true,
        filter: filter
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Check for "complete all tasks" pattern
    if (/^(complete|mark)\s+all\s+tasks(\s+for\s+(today|tomorrow|this\s+week|next\s+week))?(\s+as\s+done)?\.?$/i.test(normalizedMessage)) {
      console.log("Direct match: complete all tasks");
      const filter = normalizedMessage.includes("today") ? "today" : 
                    normalizedMessage.includes("tomorrow") ? "tomorrow" :
                    normalizedMessage.includes("this week") ? "this week" :
                    normalizedMessage.includes("next week") ? "next week" : "all";
      
      // Create taskData manually
      const taskData = {
        intent: "complete",
        bulkAction: true,
        filter: filter
      };
      
      return handleBulkAction(taskData, taskStore);
    }
    
    // Use AI-based processing for all other cases
    return await processTaskWithAI(message, taskStore);
  } catch (error) {
    console.error("Error during AI task processing:", error);
    return "I encountered an issue while processing your request. Please check your API key settings and try again.";
  }
}

/**
 * Process a message containing multiple tasks (like a list or email)
 * and create multiple tasks from it
 */
async function processMultiTaskCreation(message: string, taskStore: TaskStoreType): Promise<string> {
  try {
    const openai = await getOpenAIClient();
    
    // Define a system prompt that instructs GPT how to extract tasks from text
    const systemPrompt = `You are a task extraction assistant. Extract tasks from the user's message and format them as a list of tasks.

CRITICAL INSTRUCTION: Never push to GitHub without explicit permission from the user.

Your job is to identify distinct tasks in the user's message. These might be in a list format, bullet points, or embedded in regular text like an email.

For each task you identify, extract the following:
1. TASK_TITLE: The main task to be completed
2. DATE: Any mentioned date or deadline (today, tomorrow, specific date)
3. PRIORITY: Any priority indication (high, medium, low)
4. DESCRIPTION: Any additional details about the task

Return your response as a JSON array of task objects:
{
  "tasks": [
    {
      "title": "First task title",
      "date": "today" or "2023-11-15", (optional)
      "priority": "high|medium|low", (optional)
      "description": "Additional details" (optional)
    },
    {
      "title": "Second task title",
      "date": "tomorrow",
      "priority": "medium",
      "description": "More details"
    },
    ...
  ]
}

Only include fields that you can extract from the text. If a field is not mentioned, omit it from the JSON.`;
    
    // Send the request to the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    // Extract and parse the JSON from the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Parse the JSON
    const tasksData = JSON.parse(content);
    console.log("Extracted tasks data:", tasksData);
    
    // Check if we got a valid tasks array
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks) || tasksData.tasks.length === 0) {
      return "I couldn't identify any tasks in your message. Please provide a clearer list of tasks.";
    }
    
    // Create all the extracted tasks
    const createdTasks: string[] = [];
    
    for (const taskData of tasksData.tasks) {
      if (!taskData.title) continue; // Skip tasks without a title
      
      // Parse date if provided
      let dueDate: Date | undefined = undefined;
      if (taskData.date) {
        dueDate = parseDateReference(taskData.date) || undefined;
        
        // Additional check to ensure future dates
        if (dueDate) {
          const today = new Date();
          // If date is in the past, set it to next year
          if (dueDate < today && Math.abs(today.getTime() - dueDate.getTime()) > 24 * 60 * 60 * 1000) {
            dueDate.setFullYear(today.getFullYear() + 1);
          }
        }
      }
      
      // Create the task
      const newTask: Task = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 10),
        title: taskData.title,
        description: taskData.description || "",
        priority: (taskData.priority || "medium").toLowerCase() as "low" | "medium" | "high",
        status: "todo" as "todo" | "in_progress" | "done",
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: true,
        dueDate
      };
      
      // Add task to store
      taskStore.addTask(newTask);
      
      // Add to created tasks list
      createdTasks.push(taskData.title);
    }
    
    // Return a summary
    if (createdTasks.length === 0) {
      return "I couldn't create any tasks from your message. Please try again with clearer task descriptions.";
    } else if (createdTasks.length === 1) {
      return `✅ Added 1 task: "${createdTasks[0]}"`;
    } else {
      return `✅ Added ${createdTasks.length} tasks:\n\n${createdTasks.map((title, i) => `${i+1}. ${title}`).join('\n')}`;
    }
  } catch (error) {
    console.error("Error processing multi-task creation:", error);
    return "I encountered an error while creating tasks from your message. Please try again.";
  }
}

/**
 * Helper function to count regex matches in a string
 */
function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(new RegExp(regex, 'g'));
  return matches ? matches.length : 0;
}

function listTasks(taskStore: TaskStoreType, filter?: (task: Task) => boolean): string {
  // Filter out completed tasks first
  const activeTasks = taskStore.tasks.filter(task => task.status !== "done");
  const filteredTasks = filter ? activeTasks.filter(filter) : activeTasks;
  
  if (filteredTasks.length === 0) {
    return "No active tasks found.";
  }

  return filteredTasks
    .map((task, index) => formatTaskWithPosition(task, index + 1))
    .join("\n");
}

function listTasksByPriority(priority: Priority, taskStore: TaskStoreType): string {
  // Filter by priority and exclude completed tasks
  const tasks = taskStore.tasks.filter(task => task.priority === priority && task.status !== "done");
  
  if (tasks.length === 0) {
    return `No active ${priority} priority tasks found.`;
  }

  return tasks
    .map((task, index) => formatTaskWithPosition(task, index + 1))
    .join("\n");
}

function listTasksByDate(date: string, taskStore: TaskStoreType): string {
  const parsedDate = parseISO(date);
  // Filter by date and exclude completed tasks
  const tasks = taskStore.tasks.filter(task => {
    if (!task.dueDate || task.status === "done") return false;
    const taskDate = task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate);
    return isSameDay(taskDate, parsedDate);
  });
  
  if (tasks.length === 0) {
    return `No active tasks found for ${date}.`;
  }

  return tasks
    .map((task, index) => formatTaskWithPosition(task, index + 1))
    .join("\n");
}
