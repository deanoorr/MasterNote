import OpenAI from 'openai';
import axios from 'axios';
import { AIModel, Task } from '../types';
import { SortOption, AIModeType } from '../store';
import { format } from 'date-fns';
import { useStore } from '../store';

// Get API key from localStorage or env variable
const getApiKey = () => {
  console.log("Retrieving OpenAI API key...");
  const localStorageKey = localStorage.getItem('openai_api_key');
  console.log("LocalStorage key exists:", !!localStorageKey);
  if (localStorageKey) return localStorageKey;
  
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  console.log("Environment variable key exists:", !!envKey);
  return envKey;
};

// Get Perplexity API key from localStorage or env variable
const getPerplexityApiKey = () => {
  const localStorageKey = localStorage.getItem('perplexity_api_key');
  if (localStorageKey) return localStorageKey;
  return import.meta.env.VITE_PERPLEXITY_API_KEY || '';
};

// Get DeepSeek API key from localStorage or env variable
const getDeepSeekApiKey = () => {
  const localStorageKey = localStorage.getItem('deepseek_api_key');
  if (localStorageKey) return localStorageKey;
  return import.meta.env.VITE_DEEPSEEK_API_KEY || '';
};

// Helper function to map month names to month numbers (0-based index)
const getMonthNumber = (monthName: string): number | undefined => {
  const months: {[key: string]: number} = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  return months[monthName.toLowerCase()];
};

// Initialize OpenAI with the API key
const getOpenAIClient = () => {
  const apiKey = getApiKey();
  console.log("OpenAI API key length:", apiKey ? apiKey.length : 0);
  console.log("API key starts with:", apiKey ? apiKey.substring(0, 4) : "N/A");
  
  if (!apiKey) {
    throw new Error('API key not found. Please set it in the settings.');
  }
  
  try {
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    console.error("Error initializing OpenAI client:", error);
    throw error;
  }
};

// Call Perplexity API
const callPerplexityAPI = async (message: string) => {
  const apiKey = getPerplexityApiKey();
  if (!apiKey) {
    throw new Error('Perplexity API key not found. Please set it in the settings.');
  }
  
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can manage tasks as well as answer general questions using internet search. IMPORTANT INSTRUCTION: Only create tasks when the user explicitly asks to create, add, or manage a task. When creating a task, ALWAYS use the format "TASK: [task title] | [task description]" to clearly mark it as a task to be added to the task list. The title should be brief (2-5 words) and the description should provide more details. For example: "TASK: Buy groceries | Need to get milk, eggs, and bread for the weekend." Any other responses should be normal conversation without the TASK prefix. When users ask you to do something or give you instructions, DO NOT convert those instructions into tasks unless they explicitly ask for a task to be created. If the user asks you to "add a task", "create a task", or uses similar wording, then format your response with "TASK:" prefix.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Perplexity API Error:', error);
    throw error;
  }
};

// Call DeepSeek R1 API
const callDeepSeekAPI = async (message: string) => {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    throw new Error('DeepSeek API key not found. Please set it in the settings.');
  }
  
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can manage tasks as well as answer general questions. When creating a task, ALWAYS use the format "TASK: [task title] | [task description]" to clearly mark it as a task to be added to the task list. The title should be brief (2-5 words) and the description should provide more details. For example: "TASK: Buy groceries | Need to get milk, eggs, and bread for the weekend." If the user asks you to "add a task", "create a task", or uses similar wording, then format your response with "TASK:" prefix.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
};

// Test OpenAI API key
export async function testOpenAIConnection() {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }
    
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that can manage tasks and answer questions. When creating tasks, separate the brief action title from detailed descriptions.' 
        },
        { role: 'user', content: 'Hello' }
      ],
      max_tokens: 5
    });
    
    return { 
      success: true, 
      data: { 
        id: response.id,
        model: response.model,
        content: response.choices[0]?.message?.content
      }
    };
  } catch (error: any) {
    console.error('OpenAI API test failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.status,
      response: error.response?.data
    };
  }
}

// Define a response type
export interface AIResponse {
  content: string;
  suggestedTasks?: Task[];
}

// Near the top of the file, add this helper function to process task text
const extractTaskComponents = (taskText: string): { title: string; description: string; dueDate?: Date } => {
  // First check for specific date formats
  let dueDate: Date | undefined = undefined;
  let titleText = taskText.trim();
  const dateExtracted = extractDateFromTaskText(titleText);
  
  if (dateExtracted.dueDate) {
    dueDate = dateExtracted.dueDate;
    titleText = dateExtracted.text;
  }
  
  // Process direct creation from user (like "add a task for X")
  // Handle date-related patterns
  titleText = titleText
    .replace(/^add(?:\s+a)?\s+task\s+(?:for|to|about)\s+/i, '')
    .replace(/^create(?:\s+a)?\s+task\s+(?:for|to|about)\s+/i, '')
    .replace(/^new\s+task\s+(?:for|to|about)\s+/i, '');
  
  // Identify task title vs description using natural language processing
  // For basic task: "write a poem"
  // For task with date: "write a poem on Monday"
  // For task with description: "write a poem about tai chi"

  // Simple heuristic: For short tasks (less than 6 words), use the entire text as the title
  const words = titleText.split(/\s+/);
  if (words.length <= 5) {
    return { title: titleText, description: '', dueDate };
  }
  
  // Use common connecting words and prepositions to split title from description
  const splitPatterns = [
    { pattern: /\s+to\s+/, joinWord: 'to' },
    { pattern: /\s+about\s+/, joinWord: 'about' },
    { pattern: /\s+for\s+/, joinWord: 'for' },
    { pattern: /\s+called\s+/, joinWord: 'called' },
    { pattern: /\s+named\s+/, joinWord: 'named' },
    { pattern: /\s+regarding\s+/, joinWord: 'regarding' },
    { pattern: /\s+concerning\s+/, joinWord: 'concerning' },
    { pattern: /\s+on\s+/, joinWord: 'on' },
  ];
  
  for (const { pattern, joinWord } of splitPatterns) {
    if (pattern.test(titleText)) {
      const parts = titleText.split(pattern);
      if (parts.length >= 2) {
        // If the first part is very short (2-3 words), include the connecting word in the title
        const firstPartWords = parts[0].split(/\s+/).filter(w => w.length > 0);
        
        if (firstPartWords.length <= 3) {
          const title = parts[0] + ' ' + joinWord;
          const description = parts.slice(1).join(' ' + joinWord + ' ');
          return { title, description, dueDate };
        } else {
          // If the first part is already substantial, use it as the complete title
          const title = parts[0];
          const description = joinWord + ' ' + parts.slice(1).join(' ' + joinWord + ' ');
          return { title, description, dueDate };
        }
      }
    }
  }
  
  // If no connecting words found, try to break at a natural sentence boundary
  const sentenceBreakers = [',', ';', '-', '–', '—'];
  for (const breaker of sentenceBreakers) {
    if (titleText.includes(breaker)) {
      const parts = titleText.split(breaker);
      return { 
        title: parts[0].trim(), 
        description: parts.slice(1).join(breaker).trim(),
        dueDate
      };
    }
  }
  
  // If still no good splitting point, use first 5 words as title and rest as description
  if (words.length > 5) {
    const title = words.slice(0, 5).join(' ');
    const description = words.slice(5).join(' ');
    return { title, description, dueDate };
  }
  
  // Fallback: use entire text as title
  return { title: titleText, description: '', dueDate };
};

// Helper function to extract date information from task text
const extractDateFromTaskText = (text: string): { text: string; dueDate?: Date } => {
  // Check for direct "tomorrow" mention first - most common case
  if (/\btomorrow\b/i.test(text)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { 
      text: text.replace(/\btomorrow\b/i, '').trim(), 
      dueDate: tomorrow 
    };
  }
  
  // Check for direct "today" mention
  if (/\btoday\b/i.test(text)) {
    return { 
      text: text.replace(/\btoday\b/i, '').trim(), 
      dueDate: new Date() 
    };
  }
  
  // Date patterns to look for
  const datePatterns = [
    // "on Monday", "for Monday", "this Monday", "next Monday", etc.
    { 
      regex: /\b(on|for|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const targetDay = match[2].toLowerCase();
        const qualifier = match[1].toLowerCase();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIndex = daysOfWeek.indexOf(targetDay);
        
        if (dayIndex !== -1) {
          const today = new Date();
          const currentDay = today.getDay();
          let daysToAdd = dayIndex - currentDay;
          
          // For "next", always go to next week
          if (qualifier === 'next') {
            daysToAdd += (daysToAdd <= 0) ? 7 : 7;
          }
          // For "this" or others, if day already passed this week, go to next week
          else {
            if (daysToAdd <= 0) daysToAdd += 7;
          }
          
          const result = new Date();
          result.setDate(result.getDate() + daysToAdd);
          return result;
        }
        
        return new Date(); // Fallback
      }
    },
    
    // General time frames: "this weekend", "next month", "next weekend"
    {
      regex: /\b(this|next)\s+(weekend|week|month)\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const timeFrame = match[2].toLowerCase();
        const qualifier = match[1].toLowerCase();
        const result = new Date();
        
        if (timeFrame === 'weekend') {
          // Find the coming Saturday
          const currentDay = result.getDay(); // 0 = Sunday, 6 = Saturday
          let daysToAdd = 6 - currentDay; // Days until Saturday
          if (daysToAdd < 0) daysToAdd += 7; // If today is Sunday, go to next Saturday
          
          // For "next weekend", add 7 more days
          if (qualifier === 'next') daysToAdd += 7;
          
          result.setDate(result.getDate() + daysToAdd);
        } 
        else if (timeFrame === 'week') {
          // "this week" = this coming Friday; "next week" = next Friday
          const daysToFriday = 5 - result.getDay(); // Days until Friday
          const daysToAdd = qualifier === 'next' 
            ? (daysToFriday < 0 ? daysToFriday + 14 : daysToFriday + 7) 
            : (daysToFriday < 0 ? daysToFriday + 7 : daysToFriday);
          
          result.setDate(result.getDate() + daysToAdd);
        }
        else if (timeFrame === 'month') {
          // For "next month", move to next month's same date
          if (qualifier === 'next') {
            const nextMonth = result.getMonth() + 1;
            result.setMonth(nextMonth);
          }
          // For "this month", set to the end of current month
          else {
            result.setDate(28); // At least go to 28th of current month
            const month = result.getMonth();
            result.setDate(31); // Try to set to 31st
            // If month changed, go back to last day of previous month
            if (result.getMonth() !== month) {
              result.setDate(0);
            }
          }
        }
        
        return result;
      }
    },
    
    // "on March 20th", "for March 20", "on the 20th of March", etc.
    {
      regex: /\s+(on|for|by)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)(?:\s+|\,\s*|\s+in\s+)(\d{4})?\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const day = parseInt(match[2]);
        const monthName = match[3].toLowerCase();
        // If year not provided, use current year
        const year = match[4] ? parseInt(match[4]) : new Date().getFullYear();
        
        const monthNumber = getMonthNumber(monthName);
        
        if (monthNumber !== undefined && day >= 1 && day <= 31) {
          return new Date(year, monthNumber, day);
        }
        
        return new Date(); // Fallback
      }
    },

    // "on March 20th", "for March 20", without year
    {
      regex: /\s+(on|for|by)\s+(?:the\s+)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const monthName = match[2].toLowerCase();
        const day = parseInt(match[3]);
        const year = new Date().getFullYear();
        
        const monthNumber = getMonthNumber(monthName);
        
        if (monthNumber !== undefined && day >= 1 && day <= 31) {
          return new Date(year, monthNumber, day);
        }
        
        return new Date(); // Fallback
      }
    },

    // "next week" without specific day
    {
      regex: /\b(next\s+week)\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const result = new Date();
        // Next week = 7 days from now
        result.setDate(result.getDate() + 7);
        return result;
      }
    },

    // Handle "by Friday", "by next Friday", etc.
    {
      regex: /\bby\s+(this|next|coming)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const qualifier = match[1] ? match[1].toLowerCase() : '';
        const targetDay = match[2].toLowerCase();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIndex = daysOfWeek.indexOf(targetDay);
        
        if (dayIndex !== -1) {
          const today = new Date();
          const currentDay = today.getDay();
          let daysToAdd = dayIndex - currentDay;
          
          // If qualifier is "next" or the day has already passed this week
          if (qualifier === 'next' || (daysToAdd <= 0 && !qualifier)) {
            daysToAdd += 7;
          }
          
          const result = new Date();
          result.setDate(result.getDate() + daysToAdd);
          return result;
        }
        
        return new Date(); // Fallback
      }
    },
    
    // Handle dates like "October 15", "Jan 3", etc.
    {
      regex: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      handler: (match: RegExpMatchArray): Date => {
        const monthName = match[1].toLowerCase();
        const day = parseInt(match[2]);
        
        // Map of month abbreviations to their numeric values
        const monthMap: Record<string, number> = {
          'jan': 0, 'january': 0,
          'feb': 1, 'february': 1,
          'mar': 2, 'march': 2,
          'apr': 3, 'april': 3,
          'may': 4,
          'jun': 5, 'june': 5,
          'jul': 6, 'july': 6,
          'aug': 7, 'august': 7,
          'sep': 8, 'september': 8,
          'oct': 9, 'october': 9,
          'nov': 10, 'november': 10,
          'dec': 11, 'december': 11
        };
        
        // Get current year
        let year = new Date().getFullYear();
        // If the month is before current month, assume next year
        const currentMonth = new Date().getMonth();
        const targetMonth = monthMap[monthName];
        
        if (targetMonth < currentMonth) {
          year++;
        }
        // If same month but day has passed, assume next year
        else if (targetMonth === currentMonth && day < new Date().getDate()) {
          year++;
        }
        
        if (day >= 1 && day <= 31 && targetMonth !== undefined) {
          return new Date(year, targetMonth, day);
        }
        
        return new Date(); // Fallback
      }
    }
  ];
  
  // Check each date pattern
  for (const { regex, handler } of datePatterns) {
    const match = text.match(regex);
    if (match) {
      const dueDate = handler(match);
      // Remove the date part from the text
      const cleanedText = text.replace(match[0], '').trim();
      return { text: cleanedText, dueDate };
    }
  }
  
  return { text };
};

// Near the top of the file, add this helper function
// ... existing code ...
// Helper function to safely format dates, handling undefined values
const safeFormatDate = (date: Date | undefined, formatString: string): string => {
  if (!date) return '';
  return format(date, formatString);
};

// Define a simplified interface for our task store to avoid linter errors
interface TaskStoreType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByDate: (filter: string) => Task[];
}

// Define the getCompletionResponse function
async function getCompletionResponse(message: string, mode: 'normal' | 'task', userId: string): Promise<string> {
  try {
    const taskStore = useStore.getState(); // Add this line to get the taskStore in this scope
    
    if (mode === 'normal') {
      // Get the OpenAI client
      const openai = getOpenAIClient();
      
      // Set up a system prompt that focuses on general assistance
      const systemPrompt = "You are a helpful AI assistant called MasterNote AI. You can answer questions, provide information, and help with a variety of tasks. Provide concise, accurate, and helpful responses. You are running in Normal Mode - your responses should be informative and comprehensive. Your knowledge cutoff is September 2023, but try to provide the most up-to-date information you have.";
      
      // Send the request to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      // Return the response content
      return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } else {
      // In task mode, use AI to interpret the request if it doesn't match standard patterns
      // This provides a more intelligent fallback for task commands that don't match the predefined patterns
      
      const openai = getOpenAIClient();
      
      // Create a specialized prompt for interpreting task commands
      const systemPrompt = `You are MasterNote AI's task interpreter component. Your job is to analyze the user's input and determine:
1. If they are trying to create a task, and if so, extract the task title, description (if any), due date (if any), and priority (if any)
2. If they are trying to manage existing tasks (search, list, complete, delete, etc.)

Respond in a structured JSON format only, like this:
{
  "intent": "create_task | manage_tasks | unclear",
  "taskDetails": {
    "title": "Task title here",
    "description": "Description here or null",
    "dueDate": "tomorrow | today | specific date in YYYY-MM-DD format | null",
    "priority": "high | medium | low | null"
  },
  "managementAction": "search | list | complete | delete | null",
  "filterCriteria": {
    "status": "todo | in_progress | done | null",
    "priority": "high | medium | low | null",
    "dateFilter": "today | tomorrow | this week | next week | all | null",
    "keyword": "search term or null"
  }
}

No need for explanations or conversation - just provide the structured JSON.`;
      
      try {
        // Send the request to OpenAI
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        });
        
        const jsonResponse = aiResponse.choices[0]?.message?.content || "{}";
        try {
          // Parse the AI's JSON response
          const parsedResponse = JSON.parse(jsonResponse);
          
          // Handle different intents
          if (parsedResponse.intent === "create_task" && parsedResponse.taskDetails?.title) {
            // Create a task with the AI-extracted details
            const taskTitle = parsedResponse.taskDetails.title;
            let dueDate: Date | undefined = undefined;
            
            // Process the due date
            if (parsedResponse.taskDetails.dueDate) {
              if (parsedResponse.taskDetails.dueDate === "tomorrow") {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dueDate = tomorrow;
              } else if (parsedResponse.taskDetails.dueDate === "today") {
                dueDate = new Date();
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(parsedResponse.taskDetails.dueDate)) {
                // Handle YYYY-MM-DD format
                dueDate = new Date(parsedResponse.taskDetails.dueDate);
              }
            }
            
            // Create and return the new task
            const newTask = {
              id: Date.now().toString(),
              title: taskTitle,
              description: parsedResponse.taskDetails.description || "",
              dueDate: dueDate,
              priority: (parsedResponse.taskDetails.priority || "medium") as "low" | "medium" | "high",
              status: "todo" as "todo" | "in_progress" | "done",
              createdAt: new Date(),
              updatedAt: new Date(),
              aiGenerated: true
            };
            
            console.log("Adding AI-interpreted task:", newTask);
            taskStore.addTask(newTask);
            
            // Format due date for display
            let dueDateDisplay = dueDate ? formatDateForDisplay(dueDate) : "not specified";
            
            // Return a confirmation message
            return `✅ I've created a task: "${taskTitle}"${parsedResponse.taskDetails.description ? ` (${parsedResponse.taskDetails.description})` : ""} due ${dueDateDisplay} with ${parsedResponse.taskDetails.priority || "medium"} priority.`;
          } 
          else if (parsedResponse.intent === "manage_tasks") {
            if (parsedResponse.managementAction === "list") {
              // List tasks with the extracted filters
              const dateFilter = parsedResponse.filterCriteria?.dateFilter || "all";
              const priority = parsedResponse.filterCriteria?.priority;
              const status = parsedResponse.filterCriteria?.status;
              
              if (priority) {
                return handleTaskListByPriority(priority as 'high' | 'medium' | 'low', taskStore);
              } else if (status) {
                return handleTaskListByStatus(status as 'todo' | 'in_progress' | 'done', taskStore);
              } else {
                return handleTaskListRequest(dateFilter, taskStore);
              }
            }
            else if (parsedResponse.managementAction === "search" && parsedResponse.filterCriteria?.keyword) {
              return searchTasks(parsedResponse.filterCriteria.keyword, taskStore);
            }
            else if (parsedResponse.managementAction === "complete") {
              if (parsedResponse.filterCriteria?.dateFilter && parsedResponse.filterCriteria.dateFilter !== "null") {
                return handleTaskCompletion(parsedResponse.filterCriteria.dateFilter, taskStore);
              } else {
                // Default to completing all tasks if no specific filter
                return "Please specify which tasks you want to complete (e.g., 'complete tasks for today' or 'complete high priority tasks').";
              }
            }
            else if (parsedResponse.managementAction === "delete") {
              if (parsedResponse.filterCriteria?.dateFilter && parsedResponse.filterCriteria.dateFilter !== "null") {
                return handleTaskDeletion(parsedResponse.filterCriteria.dateFilter, taskStore);
              } else {
                // Default response for deletion without specific filter
                return "Please specify which tasks you want to delete (e.g., 'delete tasks for today' or 'delete completed tasks').";
              }
            }
          }
          
          // If we reach this point, the AI couldn't properly interpret the command
          return "I couldn't understand your task request. Try using commands like 'add a task to finish report by Friday', 'show my tasks for today', or 'complete high priority tasks'.";
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          return "I'm having trouble understanding your request. Please try phrasing it differently.";
        }
      } catch (aiError) {
        console.error("Error calling AI interpreter:", aiError);
        return "I'm in task mode but couldn't understand your request as a task command. Try being more specific or use a different phrasing.";
      }
    }
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "I encountered an error processing your request. Please try again or check your API settings.";
  }
}

export async function getAIResponse(message: string, mode: 'normal' | 'task', userId: string): Promise<string> {
  const taskStore = useStore.getState();
  
  if (mode === 'task') {
    // First process the message to normalize and clean it
    const normalizedMessage = message.toLowerCase().trim();
    
    // ==========================================
    // TASK SEARCHING AND SORTING COMMANDS
    // ==========================================
    
    // Search tasks
    if (/\b(?:search|find|locate|look for)\b/i.test(normalizedMessage) && 
        /\b(?:task|tasks|to-?do|to do)\b/i.test(normalizedMessage)) {
      
      // Extract the search keyword - everything after "for" or "containing"
      let keyword = '';
      const forMatch = message.match(/\b(?:for|containing|with|has|having)\s+["']?([^"']+?)["']?(?:\s|$)/i);
      if (forMatch && forMatch[1]) {
        keyword = forMatch[1].trim();
      } else {
        // Try to extract keyword as everything after search/find
        const generalMatch = message.match(/\b(?:search|find|locate|look for)\s+(?:tasks?|to-?dos?)?(?:\s+for|containing|with)?\s+["']?([^"']+?)["']?(?:\s|$)/i);
        if (generalMatch && generalMatch[1]) {
          keyword = generalMatch[1].trim();
        }
      }
      
      if (keyword) {
        return searchTasks(keyword, taskStore);
      }
    }
    
    // Sort tasks
    if (/\b(?:sort|order|arrange|organize)\b/i.test(normalizedMessage) && 
        /\b(?:task|tasks|to-?do|to do)\b/i.test(normalizedMessage)) {
      
      let sortBy = 'duedate'; // Default sort
      
      if (/\b(?:by|on|using)\s+(?:due\s+date|date|deadline|time)\b/i.test(normalizedMessage)) {
        sortBy = 'duedate';
      } else if (/\b(?:by|on|using)\s+(?:priority|importance|urgency)\b/i.test(normalizedMessage)) {
        sortBy = 'priority';
      } else if (/\b(?:by|on|using)\s+(?:name|title|alphabetical|alphabetically)\b/i.test(normalizedMessage)) {
        sortBy = 'title';
      } else if (/\b(?:by|on|using)\s+(?:status|state|completion)\b/i.test(normalizedMessage)) {
        sortBy = 'status';
      } else if (/\b(?:by|on|using)\s+(?:created|creation|creation date|when created)\b/i.test(normalizedMessage)) {
        sortBy = 'created';
      }
      
      return sortTasks(sortBy, taskStore);
    }
    
    // ==========================================
    // TASK LISTING COMMANDS
    // ==========================================
    
    // Check if this is a task listing request
    if (/\b(?:what|show|list|tell me|get|view|display)\b/i.test(normalizedMessage) &&
        /\b(?:tasks?|to-?dos?)\b/i.test(normalizedMessage)) {
        
      // Extract date filter
      let dateFilter = 'all';
      
      if (/\btoday\b/i.test(normalizedMessage)) dateFilter = 'today';
      else if (/\btomorrow\b/i.test(normalizedMessage)) dateFilter = 'tomorrow';
      else if (/\bthis\s+week\b/i.test(normalizedMessage)) dateFilter = 'this week';
      else if (/\bnext\s+week\b/i.test(normalizedMessage)) dateFilter = 'next week';
      else if (/\bupcoming\b/i.test(normalizedMessage)) dateFilter = 'upcoming';
      else if (/\boverdue\b/i.test(normalizedMessage)) dateFilter = 'overdue';
      else if (/\bweekend\b/i.test(normalizedMessage)) dateFilter = 'weekend';
      
      // Check for priority-specific listing
      if (/\b(?:high|medium|low)\s+priority\b/i.test(normalizedMessage) || /\bpriority\s+(?:high|medium|low)\b/i.test(normalizedMessage)) {
        let priority = 'medium';
        if (/\bhigh\b/i.test(normalizedMessage)) priority = 'high';
        else if (/\blow\b/i.test(normalizedMessage)) priority = 'low';
        
        return handleTaskListByPriority(priority as 'high' | 'medium' | 'low', taskStore);
      }
      
      // Check for status-specific listing
      if (/\b(?:completed|done|finished|in progress|to do|todo|pending)\b/i.test(normalizedMessage)) {
        let status = 'todo';
        if (/\b(?:completed|done|finished)\b/i.test(normalizedMessage)) status = 'done';
        else if (/\bin progress\b/i.test(normalizedMessage)) status = 'in_progress';
        
        return handleTaskListByStatus(status as 'todo' | 'in_progress' | 'done', taskStore);
      }
      
      return handleTaskListRequest(dateFilter, taskStore);
    }
    
    // Additional simple pattern for just asking about tasks
    if (/^(?:my\s+tasks|tasks|to-?dos?|what\s+(?:tasks?|to-?dos?)\s+do\s+i\s+have)$/i.test(normalizedMessage)) {
      return handleTaskListRequest('all', taskStore);
    }
    
    // ==========================================
    // TASK STATISTICS AND RECOMMENDATIONS
    // ==========================================
    
    // Statistics about tasks
    if (/\b(?:statistics|stats|summary|overview|report|count|analyze|analyse)\b/i.test(normalizedMessage) && 
        /\b(?:task|tasks|to-?do|to do)\b/i.test(normalizedMessage)) {
      
      return getTasksStatistics(taskStore);
    }
    
    // What to do next / recommendations
    if (/\b(?:what|which|suggest|recommend|prioritize)\s+(?:should|can|to)\s+(?:i|we)?\s+(?:do|work on|focus on|tackle|start|begin)\s+(?:next|first|now|today)\b/i.test(normalizedMessage) || 
        /\b(?:next task|priority task|important task|urgent task|recommend task|suggest task)\b/i.test(normalizedMessage)) {
      
      return getNextTaskRecommendations(taskStore);
    }
    
    // ==========================================
    // TASK COMPLETION COMMANDS
    // ==========================================
    
    // Check for task completion commands
    if (/\b(?:complete|mark|finish|done|check off|tick off|check|fix)\b/i.test(normalizedMessage)) {
      // Check if completing tasks by date filter
      if (/\b(?:today|tomorrow|this week|next week|upcoming|weekend|all)\b/i.test(normalizedMessage)) {
        let dateFilter = 'all';
        if (/\btoday\b/i.test(normalizedMessage)) dateFilter = 'today';
        else if (/\btomorrow\b/i.test(normalizedMessage)) dateFilter = 'tomorrow';
        else if (/\bthis week\b/i.test(normalizedMessage)) dateFilter = 'this week';
        else if (/\bnext week\b/i.test(normalizedMessage)) dateFilter = 'next week';
        else if (/\bupcoming\b/i.test(normalizedMessage)) dateFilter = 'upcoming';
        else if (/\bweekend\b/i.test(normalizedMessage)) dateFilter = 'weekend';
        
        return handleTaskCompletion(dateFilter, taskStore);
      }
      
      // Check for completing by priority
      if (/\b(?:high|medium|low)\s+priority\b/i.test(normalizedMessage) || /\bpriority\s+(?:high|medium|low)\b/i.test(normalizedMessage)) {
        let priority = 'medium';
        if (/\bhigh\b/i.test(normalizedMessage)) priority = 'high';
        else if (/\blow\b/i.test(normalizedMessage)) priority = 'low';
        
        return handleTaskCompletionByPriority(priority as 'high' | 'medium' | 'low', taskStore);
      }
      
      // Extract the task name for individual task completion
      const possibleTaskName = message
        .replace(/^(?:complete|mark|finish|done with|check off|tick off|check|fix)\s+(?:my|the)?\s*(?:task|tasks)?\s+(?:called|named|titled)?\s*/i, "")
        .replace(/\s+(?:as|to be)?\s+(?:complete|done|finished|checked)/i, "")
        .trim();
      
      if (possibleTaskName && possibleTaskName.length > 0) {
        return completeTaskByName(possibleTaskName, taskStore);
      }
    }
    
    // ==========================================
    // TASK DELETION COMMANDS
    // ==========================================
    
    // Check for deletion commands
    if (/\b(?:delete|remove|clear|trash|bin|erase|get rid of)\b/i.test(normalizedMessage)) {
      // Check for "delete all tasks" pattern
      if (/\ball\b/i.test(normalizedMessage)) {
        if (/\b(?:confirm|yes|sure|absolutely|proceed|do it)\b/i.test(normalizedMessage)) {
          return handleTaskDeletion('all', taskStore);
        } else {
          return "Are you sure you want to delete ALL tasks? This cannot be undone. Please confirm by saying 'yes, delete all tasks'.";
        }
      }
      
      // Check for date-specific deletion
      if (/\b(?:today|tomorrow|this week|next week|upcoming|weekend)\b/i.test(normalizedMessage)) {
        let dateFilter = 'all';
        if (/\btoday\b/i.test(normalizedMessage)) dateFilter = 'today';
        else if (/\btomorrow\b/i.test(normalizedMessage)) dateFilter = 'tomorrow';
        else if (/\bthis week\b/i.test(normalizedMessage)) dateFilter = 'this week';
        else if (/\bnext week\b/i.test(normalizedMessage)) dateFilter = 'next week';
        else if (/\bupcoming\b/i.test(normalizedMessage)) dateFilter = 'upcoming';
        else if (/\bweekend\b/i.test(normalizedMessage)) dateFilter = 'weekend';
        
        return handleTaskDeletion(dateFilter, taskStore);
      }
      
      // Check for priority-specific deletion
      if (/\b(?:high|medium|low)\s+priority\b/i.test(normalizedMessage) || /\bpriority\s+(?:high|medium|low)\b/i.test(normalizedMessage)) {
        let priority = 'medium';
        if (/\bhigh\b/i.test(normalizedMessage)) priority = 'high';
        else if (/\blow\b/i.test(normalizedMessage)) priority = 'low';
        
        return handleTaskDeletionByPriority(priority as 'high' | 'medium' | 'low', taskStore);
      }
      
      // Check for status-specific deletion
      if (/\b(?:done|complete|completed|finished|in progress|todo|to do|pending)\b/i.test(normalizedMessage)) {
        let status = 'todo';
        if (/\b(?:done|complete|completed|finished)\b/i.test(normalizedMessage)) status = 'done';
        else if (/\b(?:in progress)\b/i.test(normalizedMessage)) status = 'in_progress';
        
        return handleTaskDeletionByStatus(status as 'todo' | 'in_progress' | 'done', taskStore);
      }
      
      // Extract the task name for individual task deletion
      const possibleTaskName = message
        .replace(/^(?:delete|remove|clear|trash|bin|erase|get rid of)\s+(?:my|the)?\s*(?:task|tasks)?\s+(?:called|named|titled)?\s*/i, "")
        .trim();
      
      if (possibleTaskName && possibleTaskName.length > 0) {
        return deleteTaskByName(possibleTaskName, taskStore);
      }
    }
    
    // Special handling for confirmation responses
    if (/^(?:yes|confirm|sure|absolutely|proceed|do it)(?:\s*,?\s*delete\s+all\s+tasks)?$/i.test(normalizedMessage)) {
      // This is a confirmation for deleting all tasks
      return handleTaskDeletion('all', taskStore);
    }
    
    // ==========================================
    // TASK STATUS CHANGE COMMANDS
    // ==========================================
    
    // Check for status change commands (to in-progress)
    if (/\b(?:start|begin|commence|set to in progress|move to in progress)\b/i.test(normalizedMessage)) {
      // Extract the task name
      const possibleTaskName = message
        .replace(/^(?:start|begin|commence|set to in progress|move to in progress)\s+(?:my|the|on)?\s*(?:task|tasks)?\s+(?:called|named|titled)?\s*/i, "")
        .replace(/\s+(?:to|into|as)?\s+(?:in progress|working|started)/i, "")
        .trim();
      
      if (possibleTaskName && possibleTaskName.length > 0) {
        return changeTaskStatus(possibleTaskName, 'in_progress', taskStore);
      }
    }
    
    // ==========================================
    // TASK CREATION FALLBACK
    // ==========================================
    
    // If no command matched, try to interpret as a task creation
    return createTask(message, taskStore);
  }
  
  return getCompletionResponse(message, mode, userId);
}

// Helper function to handle task completion by priority
function handleTaskCompletionByPriority(priority: 'high' | 'medium' | 'low', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const tasksToComplete = allTasks.filter(task => 
    task.priority === priority && task.status !== 'done'
  );
  
  if (tasksToComplete.length === 0) {
    return `There are no incomplete ${priority} priority tasks to mark as complete.`;
  }
  
  // Mark all matching tasks as complete
  tasksToComplete.forEach(task => {
    taskStore.updateTask(task.id, { 
      status: 'done',
      updatedAt: new Date()
    });
  });
  
  return `✅ Marked ${tasksToComplete.length} ${priority} priority ${tasksToComplete.length === 1 ? 'task' : 'tasks'} as complete:\n` +
    tasksToComplete.map(task => `• ${task.title}`).join('\n');
}

// Helper function to delete tasks by priority
function handleTaskDeletionByPriority(priority: 'high' | 'medium' | 'low', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const tasksToDelete = allTasks.filter(task => task.priority === priority);
  
  if (tasksToDelete.length === 0) {
    return `There are no ${priority} priority tasks to delete.`;
  }
  
  // Delete all matching tasks
  tasksToDelete.forEach(task => {
    taskStore.deleteTask(task.id);
  });
  
  return `🗑️ Deleted ${tasksToDelete.length} ${priority} priority ${tasksToDelete.length === 1 ? 'task' : 'tasks'}:\n` +
    tasksToDelete.map(task => `• ${task.title}`).join('\n');
}

// Helper function to delete tasks by status
function handleTaskDeletionByStatus(status: 'todo' | 'in_progress' | 'done', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const tasksToDelete = allTasks.filter(task => task.status === status);
  
  const statusDisplay = status === 'done' ? 'completed' : 
                       status === 'in_progress' ? 'in progress' : 'to-do';
  
  if (tasksToDelete.length === 0) {
    return `There are no ${statusDisplay} tasks to delete.`;
  }
  
  // Delete all matching tasks
  tasksToDelete.forEach(task => {
    taskStore.deleteTask(task.id);
  });
  
  return `🗑️ Deleted ${tasksToDelete.length} ${statusDisplay} ${tasksToDelete.length === 1 ? 'task' : 'tasks'}:\n` +
    tasksToDelete.map(task => `• ${task.title}`).join('\n');
}

// Helper function to change task status
function changeTaskStatus(taskName: string, newStatus: 'todo' | 'in_progress' | 'done', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  
  // First try to find an exact match
  let taskToUpdate = allTasks.find(t => 
    t.title.toLowerCase() === taskName.toLowerCase()
  );
  
  // If no exact match, try to find a partial match
  if (!taskToUpdate) {
    taskToUpdate = allTasks.find(t => 
      t.title.toLowerCase().includes(taskName.toLowerCase())
    );
  }
  
  if (taskToUpdate) {
    // Only update if the status is actually changing
    if (taskToUpdate.status === newStatus) {
      const statusDisplay = newStatus === 'done' ? 'completed' : 
                          newStatus === 'in_progress' ? 'in progress' : 'to-do';
      return `Task "${taskToUpdate.title}" is already ${statusDisplay}.`;
    }
    
    taskStore.updateTask(taskToUpdate.id, {
      status: newStatus,
      updatedAt: new Date()
    });
    
    const statusEmoji = newStatus === 'done' ? '✅' : 
                      newStatus === 'in_progress' ? '⏳' : '🔷';
    const statusDisplay = newStatus === 'done' ? 'completed' : 
                        newStatus === 'in_progress' ? 'in progress' : 'to-do';
    
    return `${statusEmoji} Task "${taskToUpdate.title}" is now ${statusDisplay}.`;
  } else {
    return `I couldn't find a task matching "${taskName}". Please check the task name and try again.`;
  }
}

// Helper function to list tasks by priority
function handleTaskListByPriority(priority: 'high' | 'medium' | 'low', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const filteredTasks = allTasks.filter(task => task.priority === priority);
  
  if (filteredTasks.length === 0) {
    return `You don't have any ${priority} priority tasks.`;
  }
  
  return `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Tasks\n\n` +
    filteredTasks.map(task => {
      const statusEmoji = task.status === 'done' ? '✅' : 
                         task.status === 'in_progress' ? '⏳' : '🔷';
      const dueDate = task.dueDate ? ` (Due: ${formatDateForDisplay(task.dueDate)})` : '';
      return `${statusEmoji} ${task.title}${dueDate}`;
    }).join('\n') +
    `\n\nTotal: ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
}

// Helper function to list tasks by status
function handleTaskListByStatus(status: 'todo' | 'in_progress' | 'done', taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const filteredTasks = allTasks.filter(task => task.status === status);
  
  if (filteredTasks.length === 0) {
    const statusDisplay = status === 'done' ? 'completed' : 
                         status === 'in_progress' ? 'in progress' : 'to-do';
    return `You don't have any ${statusDisplay} tasks.`;
  }
  
  const statusDisplay = status === 'done' ? 'Completed' : 
                       status === 'in_progress' ? 'In Progress' : 'To-Do';
  
  return `### ${statusDisplay} Tasks\n\n` +
    filteredTasks.map(task => {
      const priorityDot = task.priority === 'high' ? '🔴' : 
                         task.priority === 'medium' ? '🟡' : '🟢';
      const dueDate = task.dueDate ? ` (Due: ${formatDateForDisplay(task.dueDate)})` : '';
      return `${priorityDot} ${task.title}${dueDate}`;
    }).join('\n') +
    `\n\nTotal: ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
}

// Helper function to handle task listing requests
function handleTaskListRequest(dateFilter: string, taskStore: TaskStoreType): string {
  const tasks = taskStore.getTasksByDate(dateFilter);
  
  // Format the response based on the tasks found
  if (tasks.length === 0) {
    return `You don't have any tasks ${dateFilter === 'all' ? '' : `for ${dateFilter}`}.`;
  }
  
  // Format the task list neatly
  return formatTaskList(tasks, dateFilter);
}

// Helper function to format tasks as a response
function formatTaskList(tasks: Task[], dateFilter: string): string {
  // Map date filter values to friendly display values
  const dateDisplayMap: Record<string, string> = {
    'today': 'Today',
    'tomorrow': 'Tomorrow',
    'this week': 'This Week',
    'next week': 'Next Week',
    'upcoming': 'Upcoming',
    'overdue': 'Overdue',
    'weekend': 'This Weekend',
    'all': 'All'
  };
  
  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'done');
  
  // Format priority with colored dot emojis
  const getPriorityDot = (priority: string): string => {
    switch (priority) {
      case 'high': return '🔴'; // Red dot for high priority
      case 'medium': return '🟡'; // Yellow dot for medium priority
      case 'low': return '🟢'; // Green dot for low priority
      default: return '⚪'; // White dot for unknown priority
    }
  };
  
  // Format due date in a user-friendly way
  const formatDueDate = (dueDate?: Date): string => {
    if (!dueDate) return 'No due date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return format(taskDate, 'EEE, MMM d');
    }
  };
  
  // Construct the response with task groups
  let response = `### ${dateDisplayMap[dateFilter] || dateFilter} Tasks\n\n`;
  
  // To Do tasks
  if (todoTasks.length > 0) {
    response += `**To Do (${todoTasks.length})**\n`;
    todoTasks.forEach(task => {
      response += `${getPriorityDot(task.priority)} ${task.title} ${task.dueDate ? `- Due: ${formatDueDate(task.dueDate)}` : ''}\n`;
    });
    response += '\n';
  }
  
  // In Progress tasks
  if (inProgressTasks.length > 0) {
    response += `**In Progress (${inProgressTasks.length})**\n`;
    inProgressTasks.forEach(task => {
      response += `${getPriorityDot(task.priority)} ${task.title} ${task.dueDate ? `- Due: ${formatDueDate(task.dueDate)}` : ''}\n`;
    });
    response += '\n';
  }
  
  // Completed tasks
  if (completedTasks.length > 0) {
    response += `**Completed (${completedTasks.length})**\n`;
    completedTasks.forEach(task => {
      response += `✅ ${task.title}\n`;
    });
    response += '\n';
  }
  
  // Add summary at the end
  response += `---\n**Summary:** ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} ${dateFilter === 'all' ? '' : `for ${dateFilter}`}`;
  
  return response;
}

// Helper function to handle task completion (by date filter)
function handleTaskCompletion(dateFilter: string, taskStore: TaskStoreType): string {
  const tasks = taskStore.getTasksByDate(dateFilter).filter(task => task.status !== 'done');
  
  if (tasks.length === 0) {
    return `There are no incomplete tasks ${dateFilter === 'all' ? '' : `for ${dateFilter}`} to mark as complete.`;
  }
  
  // Mark all matching tasks as complete
  tasks.forEach(task => {
    taskStore.updateTask(task.id, { status: 'done' });
  });
  
  return `✅ Marked ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} as complete${dateFilter === 'all' ? '' : ` for ${dateFilter}`}:\n` +
    tasks.map(task => `• ${task.title}`).join('\n');
}

// Helper function to complete a specific task by name
function completeTaskByName(taskName: string, taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  
  // First try to find an exact match
  let taskToComplete = allTasks.find(t => 
    t.title.toLowerCase() === taskName.toLowerCase() && 
    t.status !== 'done'
  );
  
  // If no exact match, try to find a partial match
  if (!taskToComplete) {
    taskToComplete = allTasks.find(t => 
      t.title.toLowerCase().includes(taskName.toLowerCase()) && 
      t.status !== 'done'
    );
  }
  
  if (taskToComplete) {
    taskStore.updateTask(taskToComplete.id, {
      status: 'done',
      updatedAt: new Date()
    });
    return `✅ Task "${taskToComplete.title}" marked as complete.`;
  } else {
    return `I couldn't find a task matching "${taskName}" that isn't already completed. Please check the task name and try again.`;
  }
}

// Helper function to handle task deletion (by date filter)
function handleTaskDeletion(dateFilter: string, taskStore: TaskStoreType): string {
  const tasks = taskStore.getTasksByDate(dateFilter);
  
  if (tasks.length === 0) {
    return `There are no tasks ${dateFilter === 'all' ? '' : `for ${dateFilter}`} to delete.`;
  }
  
  // Delete all matching tasks
  tasks.forEach(task => {
    taskStore.deleteTask(task.id);
  });
  
  let filterDisplay = dateFilter;
  if (dateFilter === 'all') {
    filterDisplay = 'all';
  } else if (dateFilter === 'this week') {
    filterDisplay = 'this week';
  } else if (dateFilter === 'next week') {
    filterDisplay = 'next week';
  }
  
  return `🗑️ Deleted ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}${dateFilter === 'all' ? '' : ` for ${filterDisplay}`}:\n` +
    tasks.map(task => `• ${task.title}`).join('\n');
}

// Helper function to delete a specific task by name
function deleteTaskByName(taskName: string, taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  
  // First try to find an exact match
  let taskToDelete = allTasks.find(t => t.title.toLowerCase() === taskName.toLowerCase());
  
  // If no exact match, try to find a partial match
  if (!taskToDelete) {
    taskToDelete = allTasks.find(t => t.title.toLowerCase().includes(taskName.toLowerCase()));
  }
  
  if (taskToDelete) {
    taskStore.deleteTask(taskToDelete.id);
    return `🗑️ Task "${taskToDelete.title}" has been deleted.`;
  } else {
    return `I couldn't find a task matching "${taskName}". Please check the task name and try again.`;
  }
}

// Function to analyze a message and extract task components
function analyzeTaskMessage(message: string): { title: string; description: string | null; dueDate: Date | null; priority: string | null } {
  // Normalize message text
  const normalizedMessage = message.trim().toLowerCase();
  
  // Initialize extracted components
  let title: string = '';
  let description: string | null = null;
  let dueDate: Date | null = null;
  let priority: string | null = 'medium'; // Default priority
  
  // Check for common time references first
  if (/\b(?:tomorrow|tmrw|tmw|tomorow)\b/i.test(normalizedMessage)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow;
  } else if (/\b(?:today|tonite|tonight)\b/i.test(normalizedMessage)) {
    dueDate = new Date();
  } else if (/\b(?:next\s+week|coming\s+week)\b/i.test(normalizedMessage)) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    dueDate = nextWeek;
  } else if (/\b(?:this\s+week(?:end)?|weekend|on\s+the\s+weekend)\b/i.test(normalizedMessage)) {
    const thisWeekend = new Date();
    const currentDay = thisWeekend.getDay();
    // Set to next Saturday if it's not already weekend
    if (currentDay < 6) { // 6 is Saturday
      const daysToSaturday = 6 - currentDay;
      thisWeekend.setDate(thisWeekend.getDate() + daysToSaturday);
    }
    dueDate = thisWeekend;
  } else if (/\b(?:next\s+month)\b/i.test(normalizedMessage)) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    dueDate = nextMonth;
  }
  
  // SIMPLER TASK PATTERNS - match a wider range of natural expressions
  // These are ordered from most explicit to least explicit
  
  // Pattern 1: Explicit "add/create a task" commands with various formulations
  const explicitTaskPatterns = [
    // Standard task creation with to/for
    /^(?:please\s+)?(?:add|create|make)(?:\s+a(?:nother)?)?(?:\s+new)?\s+(?:task|reminder|to-do|todo)(?:\s+item)?(?:\s+to|for)?\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Colon version: "add a task: do something"
    /^(?:please\s+)?(?:add|create|make)(?:\s+a(?:nother)?)?(?:\s+new)?\s+(?:task|reminder|to-do|todo)(?:\s+item)?(?:\s*:\s*)(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // "Called/named" version: "add a task called do something"
    /^(?:please\s+)?(?:add|create|make)(?:\s+a(?:nother)?)?(?:\s+new)?\s+(?:task|reminder|to-do|todo)(?:\s+item)?(?:\s+called|\s+named|\s+titled)\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Direct form first: "add do something to my tasks"
    /^(?:please\s+)?(?:add|create|make)\s+(.+?)\s+(?:to|into|as|as\s+a)(?:\s+my|\s+the)?\s+(?:task|tasks|reminder|reminders|to-do|todo|to-dos|todos)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i
  ];
  
  // Pattern 2: "Reminder" and "Don't forget" style patterns
  const reminderPatterns = [
    // Formal reminder request: "set a reminder to call mom"
    /^(?:please\s+)?(?:set\s+(?:up|me)?|create|make)(?:\s+a)?\s+(?:reminder|note)(?:\s+for\s+me)?(?:\s+to)?\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Memory aid: "don't let me forget to buy milk"
    /^(?:don'?t\s+(?:let|allow)\s+me\s+(?:to\s+)?forget|remind\s+me)(?:\s+to)?\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Need to pattern: "i need to call mom" or "need to call mom"
    /^(?:i\s+)?(?:need|have|want|would\s+like|ought|should)(?:\s+to)?\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i
  ];
  
  // Pattern 3: Conversational forms
  const conversationalPatterns = [
    // Question forms: "can you remind me to call mom?"
    /^(?:can|could|would)(?:\s+you)?(?:\s+please)?(?:\s+help\s+me)?(?:\s+to)?(?:\s+remember|\s+remind\s+me)?\s+(?:to|about)?\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Obligation: "I have to finish report"
    /^(?:i\s+have\s+to|i've\s+got\s+to|gotta|i\s+must|must)\s+(.+?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Simple statements: "call mom on Friday" or "call mom"
    /^(.{3,}?)(?:\s+(?:on|by|for|at|in|with|due|before|after|this)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i
  ];
  
  // Try all patterns in sequence
  const allPatterns = [...explicitTaskPatterns, ...reminderPatterns, ...conversationalPatterns];
  
  // Try each pattern in order
  for (const pattern of allPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Extract the title from the first capture group
      title = match[1].trim();
      
      // If there's a time reference in the second capture group, process it
      if (match[2]) {
        const timeRef = match[2].toLowerCase();
        
        // Handle specific day references like "on Friday"
        if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(timeRef)) {
          const dayMap: Record<string, number> = {
            monday: 1, tuesday: 2, wednesday: 3, 
            thursday: 4, friday: 5, saturday: 6, sunday: 0
          };
          
          const today = new Date();
          const currentDay = today.getDay();
          const targetDay = dayMap[timeRef];
          
          // Calculate days until the target day
          let daysUntilTarget = (targetDay - currentDay + 7) % 7;
          
          // If the target day is today, assume next week
          if (daysUntilTarget === 0) {
            daysUntilTarget = 7;
          }
          
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + daysUntilTarget);
          dueDate = targetDate;
        }
        else if (timeRef === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueDate = tomorrow;
        }
        else if (timeRef === 'today') {
          dueDate = new Date();
        }
        else if (timeRef === 'next week') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          dueDate = nextWeek;
        }
        else if (timeRef === 'this week') {
          const friday = new Date();
          const currentDay = friday.getDay();
          const daysUntilFriday = (5 - currentDay + 7) % 7;
          friday.setDate(friday.getDate() + daysUntilFriday);
          dueDate = friday;
        }
        else if (timeRef === 'weekend') {
          const weekend = new Date();
          const currentDay = weekend.getDay();
          // Calculate days until Saturday (day 6)
          const daysUntilWeekend = (6 - currentDay + 7) % 7;
          weekend.setDate(weekend.getDate() + daysUntilWeekend);
          dueDate = weekend;
        }
      }
      
      // Enhanced priority detection with wider vocabulary
      if (match[3]) {
        const priorityRef = match[3].toLowerCase();
        if (['high', 'urgent', 'important', 'critical', 'crucial', 'vital', 'essential', 'top', 'highest'].includes(priorityRef)) {
          priority = 'high';
        } else if (['low', 'minor', 'trivial', 'whenever', 'eventually', 'unimportant', 'lowest'].includes(priorityRef)) {
          priority = 'low';
        }
      }
      
      // More comprehensive title cleaning to remove time and priority references
      if (title) {
        title = title
          // Remove day references
          .replace(/\s+(?:on|by|for|due|before|after|scheduled\s+for)\s+(?:this\s+)?(monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)\s*$/i, '')
          // Remove tomorrow/today references
          .replace(/\s+(?:on|by|for|due|before|after|scheduled\s+for)\s+(?:tomorrow|tmrw|tmw|tomorow)\s*$/i, '')
          .replace(/\s+(?:on|by|for|due|before|after|scheduled\s+for)\s+(?:today|tonite|tonight)\s*$/i, '')
          // Remove week/month references
          .replace(/\s+(?:on|by|for|due|before|after|scheduled\s+for)\s+(?:next|this)\s+(?:week|month|weekend)\s*$/i, '')
          // Remove priority phrases
          .replace(/\s+with\s+(?:high|urgent|important|critical|crucial|vital|essential|top|medium|normal|standard|average|low|minor|trivial)\s+priority\s*$/i, '')
          .trim();
      }
      
      // Try to extract a description if title contains separators like ":" or "-"
      if (title.includes(':')) {
        const parts = title.split(':');
        title = parts[0].trim();
        description = parts.slice(1).join(':').trim();
      } else if (title.includes(' - ')) {
        const parts = title.split(' - ');
        title = parts[0].trim();
        description = parts.slice(1).join(' - ').trim();
      }
      
      // Break after the first matching pattern
      break;
    }
  }
  
  // Fallback - try additional extraction from the message
  if (!title) {
    // Look for verbs at the beginning which often indicate actions/tasks
    const verbStartMatch = message.match(/^(call|email|text|message|contact|remind|send|buy|get|pick up|meet|write|finish|complete|review|read|edit|update|make|create|prepare|attend|visit|check|analyze|research|investigate|schedule|book|reserve|order|pay)\s+(.+)/i);
    
    if (verbStartMatch) {
      title = message.trim();
      // Process date references in this title later
    }
  }
  
  return { title, description, dueDate, priority };
}

// Function to create a task from user input
function createTask(message: string, taskStore: TaskStoreType): string {
  // Analyze message to extract task components
  const { title, description, dueDate, priority } = analyzeTaskMessage(message);
  
  if (!title) {
    return "I couldn't identify a clear task in your message. Please try using phrases like 'add a task to...', 'remind me to...', or 'I need to...'";
  }
  
  // Create a unique ID for the task
  const id = Date.now().toString();
  
  // Create the task object
  const newTask = {
    id,
    title,
    description: description || "",
    dueDate: dueDate || new Date(), // Default to today if no date was extracted
    priority: (priority || "medium") as "low" | "medium" | "high",
    status: "todo" as "todo" | "in_progress" | "done",
    createdAt: new Date(),
    updatedAt: new Date(),
    aiGenerated: true
  };
  
  // Add the task to the store
  console.log("Adding task:", newTask);
  taskStore.addTask(newTask);
  
  // Format due date for display
  let dueDateDisplay = "today";
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDateTime = new Date(dueDate);
    dueDateTime.setHours(0, 0, 0, 0);
    
    if (dueDateTime.getTime() === today.getTime()) {
      dueDateDisplay = "today";
    } else if (dueDateTime.getTime() === tomorrow.getTime()) {
      dueDateDisplay = "tomorrow";
    } else {
      dueDateDisplay = dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  }
  
  // Return a confirmation message
  return `✅ Added task: "${title}"${description ? ` (${description})` : ""}${dueDateDisplay ? ` due ${dueDateDisplay}` : ""} with ${priority || "medium"} priority.`;
}

function formatDateForDisplay(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateWithoutTime = new Date(date);
  dateWithoutTime.setHours(0, 0, 0, 0);
  
  if (dateWithoutTime.getTime() === today.getTime()) {
    return "Today";
  } else if (dateWithoutTime.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

// Helper function to search for tasks by keyword
function searchTasks(keyword: string, taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  const matchingTasks = allTasks.filter(task => 
    task.title.toLowerCase().includes(keyword.toLowerCase()) || 
    (task.description && task.description.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (matchingTasks.length === 0) {
    return `No tasks matching "${keyword}" were found.`;
  }
  
  return `### Search Results for "${keyword}"\n\n` +
    matchingTasks.map(task => {
      const statusEmoji = task.status === 'done' ? '✅' : 
                         task.status === 'in_progress' ? '⏳' : '🔷';
      const priorityDot = task.priority === 'high' ? '🔴' : 
                         task.priority === 'medium' ? '🟡' : '🟢';
      const dueDate = task.dueDate ? ` (Due: ${formatDateForDisplay(task.dueDate)})` : '';
      return `${statusEmoji} ${priorityDot} ${task.title}${dueDate}`;
    }).join('\n') +
    `\n\nFound ${matchingTasks.length} matching ${matchingTasks.length === 1 ? 'task' : 'tasks'}.`;
}

// Helper function to sort tasks
function sortTasks(sortBy: string, taskStore: TaskStoreType): string {
  const allTasks = [...taskStore.tasks]; // Create a copy to avoid modifying original
  
  // Sort the tasks based on the specified criteria
  if (sortBy === 'duedate' || sortBy === 'date') {
    allTasks.sort((a, b) => {
      if (!a.dueDate) return 1; // No date comes last
      if (!b.dueDate) return -1; // No date comes last
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  } else if (sortBy === 'priority') {
    const priorityValue = { 'high': 0, 'medium': 1, 'low': 2 };
    allTasks.sort((a, b) => 
      priorityValue[a.priority as keyof typeof priorityValue] - 
      priorityValue[b.priority as keyof typeof priorityValue]
    );
  } else if (sortBy === 'title' || sortBy === 'name') {
    allTasks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'status') {
    const statusValue = { 'todo': 0, 'in_progress': 1, 'done': 2 };
    allTasks.sort((a, b) => 
      statusValue[a.status as keyof typeof statusValue] - 
      statusValue[b.status as keyof typeof statusValue]
    );
  } else if (sortBy === 'created' || sortBy === 'creation') {
    allTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  if (allTasks.length === 0) {
    return "You don't have any tasks to sort.";
  }
  
  return `### Tasks Sorted by ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}\n\n` +
    allTasks.map((task, index) => {
      const statusEmoji = task.status === 'done' ? '✅' : 
                         task.status === 'in_progress' ? '⏳' : '🔷';
      const priorityDot = task.priority === 'high' ? '🔴' : 
                         task.priority === 'medium' ? '🟡' : '🟢';
      const dueDate = task.dueDate ? ` (Due: ${formatDateForDisplay(task.dueDate)})` : '';
      return `${index + 1}. ${statusEmoji} ${priorityDot} ${task.title}${dueDate}`;
    }).join('\n') +
    `\n\nTotal: ${allTasks.length} ${allTasks.length === 1 ? 'task' : 'tasks'}`;
}

// Helper function to get tasks statistics
function getTasksStatistics(taskStore: TaskStoreType): string {
  const allTasks = taskStore.tasks;
  
  if (allTasks.length === 0) {
    return "You don't have any tasks yet.";
  }
  
  // Count tasks by status
  const todoCount = allTasks.filter(t => t.status === 'todo').length;
  const inProgressCount = allTasks.filter(t => t.status === 'in_progress').length;
  const completedCount = allTasks.filter(t => t.status === 'done').length;
  
  // Count tasks by priority
  const highPriorityCount = allTasks.filter(t => t.priority === 'high').length;
  const mediumPriorityCount = allTasks.filter(t => t.priority === 'medium').length;
  const lowPriorityCount = allTasks.filter(t => t.priority === 'low').length;
  
  // Count tasks by due date category
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const overdue = allTasks.filter(t => 
    t.status !== 'done' && 
    t.dueDate && 
    new Date(t.dueDate).getTime() < today.getTime()
  ).length;
  
  const dueToday = allTasks.filter(t => 
    t.status !== 'done' && 
    t.dueDate && 
    new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
  ).length;
  
  const dueTomorrow = allTasks.filter(t => 
    t.status !== 'done' && 
    t.dueDate && 
    new Date(t.dueDate).setHours(0, 0, 0, 0) === tomorrow.getTime()
  ).length;
  
  const dueThisWeek = allTasks.filter(t => 
    t.status !== 'done' && 
    t.dueDate && 
    new Date(t.dueDate).getTime() > today.getTime() && 
    new Date(t.dueDate).getTime() <= nextWeek.getTime()
  ).length;
  
  // Calculate completion rate
  const completionRate = allTasks.length > 0 
    ? Math.round((completedCount / allTasks.length) * 100) 
    : 0;
  
  return `### Task Statistics Summary\n\n` +
    `**By Status**\n` +
    `- To Do: ${todoCount}\n` +
    `- In Progress: ${inProgressCount}\n` +
    `- Completed: ${completedCount}\n\n` +
    
    `**By Priority**\n` +
    `- 🔴 High: ${highPriorityCount}\n` +
    `- 🟡 Medium: ${mediumPriorityCount}\n` +
    `- 🟢 Low: ${lowPriorityCount}\n\n` +
    
    `**By Due Date**\n` +
    `- Overdue: ${overdue}\n` +
    `- Due Today: ${dueToday}\n` +
    `- Due Tomorrow: ${dueTomorrow}\n` +
    `- Due This Week: ${dueThisWeek}\n\n` +
    
    `**Overall**\n` +
    `- Total Tasks: ${allTasks.length}\n` +
    `- Completion Rate: ${completionRate}%\n`;
}

// Helper function to get next task recommendations
function getNextTaskRecommendations(taskStore: TaskStoreType): string {
  const incompleteTasks = taskStore.tasks.filter(t => t.status !== 'done');
  
  if (incompleteTasks.length === 0) {
    return "You don't have any tasks to work on. Great job! 🎉";
  }
  
  // First prioritize overdue high priority tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueHighPriority = incompleteTasks.filter(t => 
    t.priority === 'high' && 
    t.dueDate && 
    new Date(t.dueDate).getTime() < today.getTime()
  );
  
  // Then high priority tasks due today
  const highPriorityToday = incompleteTasks.filter(t => 
    t.priority === 'high' && 
    t.dueDate && 
    new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  // Then medium priority tasks due today
  const mediumPriorityToday = incompleteTasks.filter(t => 
    t.priority === 'medium' && 
    t.dueDate && 
    new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  // Then any other tasks due today
  const otherTasksToday = incompleteTasks.filter(t => 
    t.priority === 'low' && 
    t.dueDate && 
    new Date(t.dueDate).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  // Then high priority tasks regardless of date
  const otherHighPriority = incompleteTasks.filter(t => 
    t.priority === 'high' && 
    !overdueHighPriority.includes(t) && 
    !highPriorityToday.includes(t)
  );
  
  // Then in-progress tasks
  const inProgressTasks = incompleteTasks.filter(t => 
    t.status === 'in_progress' && 
    !overdueHighPriority.includes(t) && 
    !highPriorityToday.includes(t) &&
    !mediumPriorityToday.includes(t) &&
    !otherTasksToday.includes(t) &&
    !otherHighPriority.includes(t)
  );
  
  // Combine all recommendations, but limit to top 5
  const recommendations = [
    ...overdueHighPriority,
    ...highPriorityToday,
    ...mediumPriorityToday,
    ...otherTasksToday,
    ...otherHighPriority,
    ...inProgressTasks
  ].slice(0, 5);
  
  return `### Recommended Next Tasks\n\n` +
    recommendations.map((task, index) => {
      const statusEmoji = task.status === 'in_progress' ? '⏳' : '🔷';
      const priorityDot = task.priority === 'high' ? '🔴' : 
                         task.priority === 'medium' ? '🟡' : '🟢';
      const dueDate = task.dueDate ? ` (Due: ${formatDateForDisplay(task.dueDate)})` : '';
      
      let reasonLabel = '';
      if (overdueHighPriority.includes(task)) {
        reasonLabel = ' [Overdue High Priority]';
      } else if (highPriorityToday.includes(task)) {
        reasonLabel = ' [High Priority Due Today]';
      } else if (mediumPriorityToday.includes(task)) {
        reasonLabel = ' [Due Today]';
      } else if (otherTasksToday.includes(task)) {
        reasonLabel = ' [Due Today]';
      } else if (otherHighPriority.includes(task)) {
        reasonLabel = ' [High Priority]';
      } else if (inProgressTasks.includes(task)) {
        reasonLabel = ' [In Progress]';
      }
      
      return `${index + 1}. ${statusEmoji} ${priorityDot} ${task.title}${dueDate}${reasonLabel}`;
    }).join('\n') +
    `\n\nBased on priority, due dates, and current status of your tasks.`;
} 