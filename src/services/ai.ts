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
  getSortedTasks?: () => Task[];
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
    
    // Special case: Check if this is a request to create a task rather than running a command
    // Only apply this rule for exact match of "complete all tasks" due to its dual meaning
    if (normalizedMessage === "complete all tasks") {
      console.log("Handling 'complete all tasks' as a task creation request");
      return createTask(message, taskStore);
    }
    
    // Check for complete/delete all tasks commands
    const completeAllPattern = /^(?:complete|mark|finish)\s+all\s+tasks(?:\s+(?:for|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?))?\s*$/i;
    const deleteAllPattern = /^(?:delete|remove|clear)\s+all\s+tasks(?:\s+(?:for|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?))?\s*$/i;
    
    const completeMatch = normalizedMessage.match(completeAllPattern);
    const deleteMatch = normalizedMessage.match(deleteAllPattern);
    
    if (completeMatch) {
      console.log("Detected complete all tasks command with date filter:", completeMatch[1]);
      return completeAllTasks(taskStore, completeMatch[1]);
    }
    
    if (deleteMatch) {
      console.log("Detected delete all tasks command with date filter:", deleteMatch[1]);
      return deleteAllTasks(taskStore, deleteMatch[1]);
    }
    
    // ==========================================
    // TASK MODIFICATION COMMANDS - Prioritize these before task creation
    // ==========================================
    
    // Pattern 1: Explicit due date change commands like "change due date of task 3 to today"
    if (/\b(?:change|modify|set|update|move)\b/i.test(normalizedMessage) && 
        /\b(?:due date|date|deadline|due)\b/i.test(normalizedMessage)) {
        
      console.log("Detected explicit due date change command:", normalizedMessage);
      
      // Check for MULTIPLE task numbers (e.g., "change due date of tasks 1, 2 and 3 to tomorrow")
      const taskNumbers = extractTaskNumbers(normalizedMessage);
      if (taskNumbers.length > 0) {
        console.log("Found multiple task numbers for due date change:", taskNumbers);
        
        // Extract the new date
        let dateRef = 'today'; // Default to today if no explicit date
        
        if (/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i.test(normalizedMessage)) {
          const dateMatch = normalizedMessage.match(/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i);
          if (dateMatch && dateMatch[1]) {
            dateRef = dateMatch[1].toLowerCase();
            console.log("Date reference found for multiple tasks:", dateRef);
          }
        } else if (/\b(?:to|for|until|on)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?\b/i.test(normalizedMessage)) {
          // Extract the full date reference
          const fullDateRef = extractFullDateReference(normalizedMessage);
          if (fullDateRef.dateText) {
            dateRef = fullDateRef.dateText;
            console.log("Full date reference found for multiple tasks:", dateRef);
          }
        }
        
        return changeMultipleTasksDueDateByNumbers(taskNumbers, dateRef, taskStore);
      }
      
      // Check for SINGLE task number reference (e.g., "change due date of task 3 to today")
      const taskNumMatch = normalizedMessage.match(/\b(?:task|tasks|item|number|#)\s*#?(\d+)\b/i);
      if (taskNumMatch && taskNumMatch[1]) {
        console.log("Found task number in command:", taskNumMatch[1]);
        const taskNumber = parseInt(taskNumMatch[1], 10);
        
        // Extract the new date
        let dateRef = 'today'; // Default to today if no explicit date
        
        if (/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i.test(normalizedMessage)) {
          const dateMatch = normalizedMessage.match(/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i);
          if (dateMatch && dateMatch[1]) {
            dateRef = dateMatch[1].toLowerCase();
            console.log("Date reference found:", dateRef);
          }
        } else if (/\b(?:to|for|until|on)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?\b/i.test(normalizedMessage)) {
          // Extract the full date reference
          const fullDateRef = extractFullDateReference(normalizedMessage);
          if (fullDateRef.dateText) {
            dateRef = fullDateRef.dateText;
            console.log("Full date reference found:", dateRef);
          }
        }
        
        return changeTaskDueDateByNumber(taskNumber, dateRef, taskStore);
      }
    }
    
    // Pattern 2: Simplified date change commands like "change task 1 to today" or "change tasks 1 and 2 to tomorrow"
    if (/\b(?:change|modify|set|update|move)\b/i.test(normalizedMessage) && 
        /\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend|the\s+\d+(?:st|nd|rd|th))\b/i.test(normalizedMessage)) {
        
      console.log("Detected simplified task date change command:", normalizedMessage);
      
      // Check for MULTIPLE task numbers (e.g., "change tasks 1, 2 and 3 to tomorrow")
      const taskNumbers = extractTaskNumbers(normalizedMessage);
      if (taskNumbers.length > 0) {
        console.log("Found multiple task numbers for simplified due date change:", taskNumbers);
        
        // Extract the date reference
        let dateRef = 'today'; // Default
        
        if (/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i.test(normalizedMessage)) {
          const dateMatch = normalizedMessage.match(/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i);
          if (dateMatch && dateMatch[1]) {
            dateRef = dateMatch[1].toLowerCase();
            console.log("Simplified date reference found for multiple tasks:", dateRef);
          }
        } else if (/\b(?:to|for|until|on)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?\b/i.test(normalizedMessage)) {
          // Extract the full date reference
          const fullDateRef = extractFullDateReference(normalizedMessage);
          if (fullDateRef.dateText) {
            dateRef = fullDateRef.dateText;
            console.log("Simplified full date reference found for multiple tasks:", dateRef);
          }
        }
        
        return changeMultipleTasksDueDateByNumbers(taskNumbers, dateRef, taskStore);
      }
      
      // Extract task number for SINGLE task
      const taskNumMatch = normalizedMessage.match(/\b(?:task|tasks|item|number|#)\s*#?(\d+)\b/i);
      if (taskNumMatch && taskNumMatch[1]) {
        const taskNumber = parseInt(taskNumMatch[1], 10);
        console.log("Found task number in simplified command:", taskNumber);
        
        // Extract the date reference
        let dateRef = 'today'; // Default
        
        if (/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i.test(normalizedMessage)) {
          const dateMatch = normalizedMessage.match(/\b(?:to|for|until|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i);
          if (dateMatch && dateMatch[1]) {
            dateRef = dateMatch[1].toLowerCase();
            console.log("Simplified date reference found:", dateRef);
          }
        } else if (/\b(?:to|for|until|on)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?\b/i.test(normalizedMessage)) {
          // Extract the full date reference
          const fullDateRef = extractFullDateReference(normalizedMessage);
          if (fullDateRef.dateText) {
            dateRef = fullDateRef.dateText;
            console.log("Simplified full date reference found:", dateRef);
          }
        }
        
        return changeTaskDueDateByNumber(taskNumber, dateRef, taskStore);
      }
    }
    
    // ==========================================
    // Check for commands to change "all tasks" to a specific date
    // ==========================================
    if (/\b(?:change|modify|set|update|move)\s+all\s+tasks\s+to\b/i.test(normalizedMessage)) {
      console.log("Detected command to change all tasks to a specific date");
      
      // Extract the date
      let dateRef = 'today'; // Default
      
      if (/\b(?:to)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i.test(normalizedMessage)) {
        const dateMatch = normalizedMessage.match(/\b(?:to)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|weekend)\b/i);
        if (dateMatch && dateMatch[1]) {
          dateRef = dateMatch[1].toLowerCase();
          console.log("Date reference for all tasks:", dateRef);
        }
      } else if (/\b(?:to)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?\b/i.test(normalizedMessage)) {
        // Extract the full date reference
        const fullDateRef = extractFullDateReference(normalizedMessage);
        if (fullDateRef.dateText) {
          dateRef = fullDateRef.dateText;
          console.log("Full date reference for all tasks:", dateRef);
        }
      }
      
      // Get all active tasks
      const activeTasks = getSortedTasksFromStore(taskStore, true);
      const taskNumbers = activeTasks.map((_, index) => index + 1); // Convert to 1-based indices
      
      if (taskNumbers.length === 0) {
        return "There are no active tasks to update.";
      }
      
      return changeMultipleTasksDueDateByNumbers(taskNumbers, dateRef, taskStore);
    }
    
    // ==========================================
    // TASK SEARCH, SORTING, AND LISTING
    // ==========================================
    
    // ==========================================
    // MULTI-TASK CREATION - Check for this before regular task creation
    // ==========================================
    
    // Check if this is a request to create multiple tasks
    if (isMultiTaskCreationRequest(message)) {
      console.log("Detected multi-task creation request");
      return createMultipleTasks(message, taskStore);
    }
    
    // ==========================================
    // TASK CREATION FALLBACK
    // ==========================================
    
    // If nothing else matched, try to interpret as a task creation
    const taskComponents = analyzeTaskMessage(message);
    
    // If we have a title, create a task
    if (taskComponents.title) {
      return createTask(message, taskStore);
    }
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
  
  // Remove any starting/ending whitespace
  const cleanTaskName = taskName.trim();
  
  // Skip if task name is too short (likely to cause incorrect matches)
  if (cleanTaskName.length < 3) {
    return `Please provide a more specific task name to update.`;
  }
  
  // First try to find an exact match (case insensitive)
  let taskToUpdate = allTasks.find(t => 
    t.title.toLowerCase() === cleanTaskName.toLowerCase()
  );
  
  // If no exact match, look for tasks that start with the provided name
  if (!taskToUpdate) {
    taskToUpdate = allTasks.find(t => 
      t.title.toLowerCase().startsWith(cleanTaskName.toLowerCase())
    );
  }
  
  // If still no match, try to find a task that contains the name
  if (!taskToUpdate) {
    // Filter all tasks that contain the provided name
    const matchingTasks = allTasks.filter(t => 
      t.title.toLowerCase().includes(cleanTaskName.toLowerCase())
    );
    
    if (matchingTasks.length > 1) {
      // Multiple matches found - provide list of potential tasks
      return `I found multiple tasks matching "${cleanTaskName}". Please be more specific or use the task number:\n` +
        matchingTasks.map((task, index) => `• ${task.title}`).join('\n');
    } else if (matchingTasks.length === 1) {
      // Found exactly one match
      taskToUpdate = matchingTasks[0];
    }
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
    return `I couldn't find a task matching "${cleanTaskName}". Please check the task name and try again.`;
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
  
  // Remove any starting/ending whitespace
  const cleanTaskName = taskName.trim();
  
  // Skip if task name is too short (likely to cause incorrect matches)
  if (cleanTaskName.length < 3) {
    return `Please provide a more specific task name to complete.`;
  }
  
  // First try to find an exact match (case insensitive)
  let taskToComplete = allTasks.find(t => 
    t.title.toLowerCase() === cleanTaskName.toLowerCase() && 
    t.status !== 'done'
  );
  
  // If no exact match, look for tasks that start with the provided name
  if (!taskToComplete) {
    taskToComplete = allTasks.find(t => 
      t.title.toLowerCase().startsWith(cleanTaskName.toLowerCase()) && 
      t.status !== 'done'
    );
  }
  
  // If still no match, try to find a task that contains the name
  if (!taskToComplete) {
    // Filter all tasks that contain the provided name
    const matchingTasks = allTasks.filter(t => 
      t.title.toLowerCase().includes(cleanTaskName.toLowerCase()) && 
      t.status !== 'done'
    );
    
    if (matchingTasks.length > 1) {
      // Multiple matches found - provide list of potential tasks
      return `I found multiple tasks matching "${cleanTaskName}". Please be more specific or use the task number:\n` +
        matchingTasks.map((task, index) => `• ${task.title}`).join('\n');
    } else if (matchingTasks.length === 1) {
      // Found exactly one match
      taskToComplete = matchingTasks[0];
    }
  }
  
  if (taskToComplete) {
    taskStore.updateTask(taskToComplete.id, {
      status: 'done',
      updatedAt: new Date()
    });
    return `✅ Task "${taskToComplete.title}" marked as complete.`;
  } else {
    return `I couldn't find a task matching "${cleanTaskName}" that isn't already completed. Please check the task name and try again.`;
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
  
  // Remove any starting/ending whitespace
  const cleanTaskName = taskName.trim();
  
  // Skip if task name is too short (likely to cause incorrect matches)
  if (cleanTaskName.length < 3) {
    return `Please provide a more specific task name to delete.`;
  }
  
  // First try to find an exact match (case insensitive)
  let taskToDelete = allTasks.find(t => 
    t.title.toLowerCase() === cleanTaskName.toLowerCase()
  );
  
  // If no exact match, look for tasks that start with the provided name
  if (!taskToDelete) {
    taskToDelete = allTasks.find(t => 
      t.title.toLowerCase().startsWith(cleanTaskName.toLowerCase())
    );
  }
  
  // If still no match, try to find a task that contains the name
  if (!taskToDelete) {
    // Filter all tasks that contain the provided name
    const matchingTasks = allTasks.filter(t => 
      t.title.toLowerCase().includes(cleanTaskName.toLowerCase())
    );
    
    if (matchingTasks.length > 1) {
      // Multiple matches found - provide list of potential tasks
      return `I found multiple tasks matching "${cleanTaskName}". Please be more specific or use the task number:\n` +
        matchingTasks.map((task, index) => `• ${task.title}`).join('\n');
    } else if (matchingTasks.length === 1) {
      // Found exactly one match
      taskToDelete = matchingTasks[0];
    }
  }
  
  if (taskToDelete) {
    taskStore.deleteTask(taskToDelete.id);
    return `🗑️ Task "${taskToDelete.title}" has been deleted.`;
  } else {
    return `I couldn't find a task matching "${cleanTaskName}". Please check the task name and try again.`;
  }
}

// Function to analyze a message and extract task components
function analyzeTaskMessage(message: string): { title: string; description: string | null; dueDate: Date | null; priority: string | null } {
  // Normalize message text
  const normalizedMessage = message.trim();
  
  // Check if this is a "complete all tasks" as a task title rather than a command
  if (/^complete\s+all\s+tasks$/i.test(normalizedMessage)) {
    console.log("Detected 'complete all tasks' as a task title");
    return {
      title: normalizedMessage,
      description: null,
      dueDate: new Date(), // Default to today
      priority: 'medium'
    };
  }
  
  // Initialize return values
  let title = '';
  let description: string | null = null;
  let dueDate: Date | null = null;
  let priority: string | null = null;
  
  // Extract priority if present
  if (/\b(?:high|important|urgent|critical)\s+priority\b/i.test(normalizedMessage)) {
    priority = 'high';
  } else if (/\b(?:medium|normal|standard)\s+priority\b/i.test(normalizedMessage)) {
    priority = 'medium';
  } else if (/\b(?:low|minor)\s+priority\b/i.test(normalizedMessage)) {
    priority = 'low';
  }
  
  // Look for task creation patterns
  const taskPatterns = [
    // Pattern for "add a task for tomorrow to clean the house"
    /^add\s+a\s+task\s+for\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)\s+to\s+(.+)$/i,
    
    // Pattern for "add task for tomorrow to clean the house" (without "a")
    /^add\s+task\s+for\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)\s+to\s+(.+)$/i,
    
    // Pattern for commands that start with the date: "tomorrow remind me to buy fish"
    /^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week)\s+(?:remind|remember|tell)\s+me\s+to\s+(.+)$/i,
    
    // Pattern for "add task to [action] for the [date]" format
    /^add\s+task\s+to\s+(.*?)\s+for\s+the\s+(\d+)(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?$/i,
    
    // Explicit task creation with due date reference (including the 25th, the 25th of month)
    /^(?:.*?)\b(?:add|create|make|set up)\s+(?:a\s+)?(?:task|reminder|to-do|todo|note)\s+(?:to\s+|for\s+|about\s+|called\s+|named\s+|titled\s+)?(.*?)(?:\s+(?:on|by|for|due|before|after|this|next|the)\s+([a-z0-9]+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?|[a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // More natural language like "I need to..." with due date
    /^(?:i\s+(?:need|want|have)\s+to|don't\s+let\s+me\s+forget\s+to|remind\s+me\s+to)\s+(.*?)(?:\s+(?:on|by|for|due|before|after|this|next|the)\s+([a-z0-9]+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?|[a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    /^(?:i\s+(?:need|want|have)\s+to|don't\s+let\s+me\s+forget\s+to|remind\s+me\s+to)\s+(.*?)(?:\s+(?:on|by|for|due|before|after|this|next)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i,
    
    // Simple task description with due date
    /^(.*?)(?:\s+(?:on|by|for|due|before|after|this|next)\s+([a-z]+day|tomorrow|today|next week|this week|weekend))?(?:\s+with\s+([a-z]+)\s+priority)?$/i
  ];
  
  // Try to match one of the task patterns
  for (const pattern of taskPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Special handling for "add a task for [date] to [action]" pattern
      if (pattern.toString().includes('add\\s+a\\s+task\\s+for') || pattern.toString().includes('add\\s+task\\s+for')) {
        console.log("Matched 'add task for [date] to [action]' pattern:", match);
        const dateString = match[1];
        const taskTitle = match[2];
        
        // Get due date from date string
        let dueDate: Date | null = null;
        if (dateString) {
          dueDate = parseDateReference(dateString.toLowerCase());
        }
        
        // Process the title
        const { title: processedTitle, description } = processTaskTitle(taskTitle);
        
        return {
          title: processedTitle,
          description,
          dueDate,
          priority: determinePriority(message)
        };
      }
      
      // Special handling for "[date] remind me to [action]" pattern
      if (pattern.toString().includes('today|tomorrow|monday|tuesday|wednesday|thursday') && 
          pattern.toString().includes('remind|remember|tell')) {
        console.log("Matched '[date] remind me to [action]' pattern:", match);
        const dateString = match[1];
        const taskTitle = match[2];
        
        // Get due date from date string
        let dueDate: Date | null = null;
        if (dateString) {
          dueDate = parseDateReference(dateString.toLowerCase());
        }
        
        // Process the title
        const { title: processedTitle, description } = processTaskTitle(taskTitle);
        
        return {
          title: processedTitle,
          description,
          dueDate,
          priority: determinePriority(message)
        };
      }
      
      // Special handling for "add task to [action] for the [date]" pattern
      if (pattern.toString().includes('add\\s+task\\s+to\\s+(.*?)\\s+for\\s+the\\s+(\\d+)')) {
        console.log("Matched 'add task to [action] for the [date]' pattern:", match);
        const taskTitle = match[1];
        const dayNumber = match[2];
        
        let monthName = '';
        // Check if there's a month specified after the day number
        const monthMatch = message.match(/for\s+the\s+\d+(?:st|nd|rd|th)?\s+of\s+([a-z]+)/i);
        if (monthMatch && monthMatch[1]) {
          monthName = monthMatch[1].toLowerCase();
        }
        
        // Create a date string for parsing
        let dateString;
        if (monthName) {
          dateString = `the ${dayNumber} of ${monthName}`;
        } else {
          dateString = `the ${dayNumber}`;
        }
        
        // Get due date from date string
        let dueDate: Date | null = parseDateReference(dateString.toLowerCase());
        
        // Process the title
        const { title: processedTitle, description } = processTaskTitle(taskTitle);
        
        return {
          title: processedTitle,
          description,
          dueDate,
          priority: determinePriority(message)
        };
      }
      
      let [_, rawTitle, dateString, priority] = match;
      
      // Further process the title to handle cases where "for" is both part of the task and a date marker
      // Example: "add a task to finish cost plan for thursday" - "for thursday" should be removed from title
      if (dateString && rawTitle.toLowerCase().endsWith(` for ${dateString.toLowerCase()}`)) {
        rawTitle = rawTitle.slice(0, -(` for ${dateString}`).length);
      }
      
      // Extract time reference from title if not already matched in date group
      if (!dateString) {
        const timeRef = rawTitle.match(/\s+(?:on|by|for|due|before|after|this|next)\s+([a-z]+day|tomorrow|today|next week|this week|weekend)$/i);
        if (timeRef && timeRef[1]) {
          dateString = timeRef[1];
          rawTitle = rawTitle.replace(timeRef[0], '');
        }
      }
      
      // Clean up title
      const title = rawTitle.trim();
      
      // Get due date from date string if available
      let dueDate: Date | null = null;
      if (dateString) {
        dueDate = parseDateReference(dateString.toLowerCase());
      }
      
      // Try to split title into title and description
      const { title: processedTitle, description } = processTaskTitle(title);
      
      return {
        title: processedTitle,
        description,
        dueDate,
        priority: priority?.toLowerCase() || null
      };
    }
  }

  return {
    title: title || message.trim(), // Use full message as title if no pattern matched
    description,
    dueDate,
    priority
  };
}

// Function to create a task from user input
function createTask(message: string, taskStore: TaskStoreType): string {
  console.log("Creating task from message:", message);
  
  // First, check if this is a multi-task creation request
  if (isMultiTaskCreationRequest(message)) {
    return createMultipleTasks(message, taskStore);
  }
  
  // Special pattern to handle "create a task to finish a cost plan for the 25th of March" format
  const specificPattern = /create\s+a\s+task\s+to\s+(.*?)\s+for\s+the\s+(\d+)(?:st|nd|rd|th)\s+of\s+([a-z]+)/i;
  const specificMatch = message.match(specificPattern);
  
  if (specificMatch) {
    console.log("Matched specific pattern for date-formatted task");
    const taskTitle = specificMatch[1];
    const day = parseInt(specificMatch[2]);
    const month = specificMatch[3].toLowerCase();
    
    console.log(`Extracted: Title=${taskTitle}, Day=${day}, Month=${month}`);
    
    // Month name to number mapping
    const monthMap: Record<string, number> = {
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
    
    const monthNum = monthMap[month];
    if (monthNum !== undefined && day >= 1 && day <= 31) {
      // Create the due date
      const dueDate = new Date();
      dueDate.setMonth(monthNum);
      dueDate.setDate(day);
      
      // If the date has already passed this year, set it to next year
      const today = new Date();
      if (dueDate < today) {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
      
      console.log(`Created due date: ${dueDate.toISOString()}`);
      
      // Create a unique ID for the task
      const id = Date.now().toString();
      
      // Create the task object
      const newTask = {
        id,
        title: taskTitle,
        description: "",
        dueDate: dueDate,
        priority: "medium" as "low" | "medium" | "high",
        status: "todo" as "todo" | "in_progress" | "done",
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: true
      };
      
      // Add the task to the store
      taskStore.addTask(newTask);
      
      return `✅ Added task: "${taskTitle}" due ${dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`;
    }
  }
  
  // For other task formats, use the standard analyzer
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

// Function to check if a message is requesting to create multiple tasks
function isMultiTaskCreationRequest(message: string): boolean {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Pattern 1: "add the following tasks..."
  if (/add\s+(?:the\s+)?(?:following|these)\s+tasks/i.test(normalizedMessage)) {
    return true;
  }
  
  // Pattern 2: "create multiple tasks..."
  if (/create\s+(?:multiple|several|many|a\s+list\s+of)\s+tasks/i.test(normalizedMessage)) {
    return true;
  }
  
  // Pattern 3: Numbered list pattern with at least 2 items
  const numberedItems = message.match(/\d+\s*\.\s*[^\n\d\.]+/g);
  if (numberedItems && numberedItems.length >= 2) {
    return true;
  }
  
  // Pattern 4: Bulleted list pattern with at least 2 items
  const bulletedItems = message.match(/[-*•]\s*[^\n-*•]+/g);
  if (bulletedItems && bulletedItems.length >= 2) {
    return true;
  }
  
  return false;
}

// Function to extract due date from multi-task message
function extractDueDateFromMultiTaskMessage(message: string): Date | null {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Look for date indicators before the list starts
  const datePatterns = [
    // "for tomorrow", "for the 25th of March", etc.
    /for\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)/i,
    // "due tomorrow"
    /due\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)/i,
    // "on tomorrow"
    /on\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)/i,
    // "tasks for tomorrow" or "tasks for the 25th"
    /tasks\s+for\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)/i,
    // "tasks due tomorrow"
    /tasks\s+due\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)/i,
    // Bracketed date: (tomorrow) or (on the 25th)
    /\((?:on|for|by|due)?\s*(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|weekend|the\s+\d+(?:st|nd|rd|th)?(?:\s+of\s+[a-z]+)?)\)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = normalizedMessage.match(pattern);
    if (match && match[1]) {
      return parseDateReference(match[1]);
    }
  }
  
  // Check for date reference using our existing extraction function
  const fullDateRef = extractFullDateReference(normalizedMessage);
  if (fullDateRef.dateText) {
    return parseDateReference(fullDateRef.dateText);
  }
  
  return null; // No date found, will default to today
}

// Function to extract list items from message
function extractListItems(message: string): string[] {
  // Remove any text before the first number or bullet point to clean up the input
  // This helps with messages like "add the following tasks for tomorrow: 1. Task A..."
  let cleanedMessage = message;
  const listStartIndex = message.search(/(?:\d+\s*\.|\s[-*•])\s/);
  
  if (listStartIndex > 0) {
    cleanedMessage = message.substring(listStartIndex);
  }
  
  // Extract numbered list items (1. Item, 2. Item, etc.)
  const numberedItems = cleanedMessage.match(/\d+\s*\.\s*([^\n\d\.]+)/g);
  if (numberedItems && numberedItems.length > 0) {
    return numberedItems.map(item => {
      // Remove the number and period, and trim whitespace
      return item.replace(/^\d+\s*\.\s*/, '').trim();
    });
  }
  
  // Try to extract items separated by commas or new lines with numbers
  // This handles "1. Clean House, 2. Wash dog, 3. Finish work"
  const commaSeparatedItems = cleanedMessage.split(/,\s*(?=\d+\s*\.\s*)/);
  if (commaSeparatedItems.length > 1) {
    return commaSeparatedItems.map(item => {
      // Remove the number and period, and trim whitespace
      return item.replace(/^\d+\s*\.\s*/, '').trim();
    });
  }
  
  // Extract bulleted list items (- Item, * Item, • Item)
  const bulletedItems = cleanedMessage.match(/[-*•]\s*([^\n-*•]+)/g);
  if (bulletedItems && bulletedItems.length > 0) {
    return bulletedItems.map(item => {
      // Remove the bullet character and trim whitespace
      return item.replace(/^[-*•]\s*/, '').trim();
    });
  }
  
  // If no structured list is found, try to split by lines and clean up
  const lines = cleanedMessage.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^add\s+the\s+following|^create\s+tasks|^tasks:/i));
  
  if (lines.length > 0) {
    return lines;
  }
  
  // Last resort - try to split by commas if it looks like a list
  if (cleanedMessage.includes(',')) {
    const commaItems = cleanedMessage.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    if (commaItems.length > 1) {
      return commaItems;
    }
  }
  
  return [];
}

// Function to create multiple tasks from a single message
function createMultipleTasks(message: string, taskStore: TaskStoreType): string {
  console.log("Creating multiple tasks from message:", message);
  
  // Extract the common due date for all tasks (if specified)
  const dueDate = extractDueDateFromMultiTaskMessage(message);
  const useDefaultDate = !dueDate;
  const effectiveDueDate = dueDate || new Date(); // Default to today if not specified
  
  // Extract list items that will become individual tasks
  const taskItems = extractListItems(message);
  
  if (taskItems.length === 0) {
    return "I couldn't identify any tasks in your list. Please provide a numbered or bulleted list of tasks.";
  }
  
  console.log("Extracted task items:", taskItems);
  console.log("Common due date:", effectiveDueDate);
  
  // Create each task
  const createdTasks: Task[] = [];
  
  for (const taskText of taskItems) {
    // Analyze each task item to see if it has its own priority setting
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let taskTitle = taskText;
    
    // Check for priority indicators in the task text
    if (/\b(?:high|important|urgent|critical)\s+priority\b/i.test(taskText)) {
      priority = 'high';
      taskTitle = taskText.replace(/\s*\b(?:high|important|urgent|critical)\s+priority\b/i, '');
    } else if (/\b(?:low|minor)\s+priority\b/i.test(taskText)) {
      priority = 'low';
      taskTitle = taskText.replace(/\s*\b(?:low|minor)\s+priority\b/i, '');
    }
    
    // Process the title to potentially extract a description
    const { title, description } = processTaskTitle(taskTitle);
    
    // Create the task
    const id = Date.now().toString() + createdTasks.length; // Ensure unique IDs
    const newTask: Task = {
      id,
      title,
      description: description || "",
      dueDate: effectiveDueDate,
      priority,
      status: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGenerated: true
    };
    
    // Add to store and to our tracking array
    taskStore.addTask(newTask);
    createdTasks.push(newTask);
  }
  
  // Format due date for display
  let dueDateDisplay = useDefaultDate ? "today" : "";
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
  
  // Create a nice formatted response message
  let response = `✅ Added ${createdTasks.length} tasks`;
  if (dueDateDisplay) {
    response += ` due ${dueDateDisplay}`;
  } else {
    response += " due today (default)";
  }
  response += ":\n\n";
  
  // List the tasks in the response
  createdTasks.forEach((task, index) => {
    const priorityDot = task.priority === 'high' ? '🔴' : 
                         task.priority === 'medium' ? '🟡' : '🟢';
    response += `${index + 1}. ${priorityDot} ${task.title}`;
    if (task.description) {
      response += ` - ${task.description}`;
    }
    response += '\n';
  });
  
  return response;
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

// Helper function to complete task by number
function completeTaskByNumber(taskNumber: number, taskStore: TaskStoreType): string {
  // Get only active tasks for numbering
  const activeTasks = getSortedTasksFromStore(taskStore, true);
  
  // Convert from 1-based to 0-based index
  const index = taskNumber - 1;
  
  if (index < 0 || index >= activeTasks.length) {
    console.log(`Task #${taskNumber} not found in ${activeTasks.length} active tasks`);
    return `Task #${taskNumber} doesn't exist or is already completed. Please check the task number and try again.`;
  }
  
  const taskToComplete = activeTasks[index];
  
  // Only update if not already done
  if (taskToComplete.status === 'done') {
    return `Task #${taskNumber} "${taskToComplete.title}" is already completed.`;
  }
  
  taskStore.updateTask(taskToComplete.id, {
    status: 'done',
    updatedAt: new Date()
  });
  
  return `✅ Completed task #${taskNumber}: "${taskToComplete.title}"`;
}

// Helper function to delete task by number
function deleteTaskByNumber(taskNumber: number, taskStore: TaskStoreType): string {
  // For deletion, show all tasks including completed ones
  const sortedTasks = getSortedTasksFromStore(taskStore, false);
  
  // Convert from 1-based to 0-based index
  const index = taskNumber - 1;
  
  if (index < 0 || index >= sortedTasks.length) {
    return `Task #${taskNumber} doesn't exist. Please check the task number and try again.`;
  }
  
  const taskToDelete = sortedTasks[index];
  const taskTitle = taskToDelete.title;
  
  taskStore.deleteTask(taskToDelete.id);
  
  return `🗑️ Deleted task #${taskNumber}: "${taskTitle}"`;
}

// Helper function to get sorted tasks from store - optionally filtering by status
function getSortedTasksFromStore(taskStore: TaskStoreType, excludeCompleted: boolean = false): Task[] {
  // First get the sorted tasks
  let tasks: Task[] = [];
  
  // Use the getSortedTasks function if available
  if (typeof taskStore.getSortedTasks === 'function') {
    tasks = taskStore.getSortedTasks();
  } else {
    // Fallback - return unsorted tasks
    tasks = taskStore.tasks;
  }
  
  // Optionally filter out completed tasks
  if (excludeCompleted) {
    tasks = tasks.filter(task => task.status !== 'done');
  }
  
  // Log for debugging
  console.log("Task list for operation:", tasks.map((t, i) => `#${i+1}: ${t.title} (${t.status})`));
  
  return tasks;
}

// Helper function to change task due date by number
function changeTaskDueDateByNumber(taskNumber: number, dateRef: string, taskStore: TaskStoreType): string {
  console.log(`Attempting to update task #${taskNumber} with date ${dateRef}`);
  
  // Get tasks that aren't completed
  const activeTasks = getSortedTasksFromStore(taskStore, true);
  
  // Convert from 1-based to 0-based index
  const index = taskNumber - 1;
  
  if (index < 0 || index >= activeTasks.length) {
    console.log(`Task #${taskNumber} not found in ${activeTasks.length} active tasks`);
    return `Task #${taskNumber} doesn't exist or is already completed. Please check the task number and try again.`;
  }
  
  const taskToUpdate = activeTasks[index];
  const taskTitle = taskToUpdate.title;
  
  console.log(`Found task to update: ${taskTitle} (ID: ${taskToUpdate.id})`);
  
  // Parse the date reference
  const newDueDate = parseDateReference(dateRef.toLowerCase());
  
  if (!newDueDate) {
    return `I couldn't understand the date "${dateRef}". Please try using a clearer date format like "today", "tomorrow", "Monday", or "the 25th".`;
  }
  
  console.log(`Updating task due date to: ${newDueDate.toISOString()}`);
  
  // Update the task
  taskStore.updateTask(taskToUpdate.id, {
    dueDate: newDueDate,
    updatedAt: new Date()
  });
  
  // Format the date for display
  const formattedDate = newDueDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `📅 Updated task #${taskNumber} "${taskTitle}" - due date changed to ${formattedDate}.`;
}

// Add these helper functions before the analyzeTaskMessage function

// Function to parse date references like "tomorrow", "Friday", etc.
function parseDateReference(dateRef: string): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateRef === 'today') {
    return today;
  }
  
  if (dateRef === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  if (dateRef === 'this week' || dateRef === 'next week') {
    const date = new Date(today);
    if (dateRef === 'next week') {
      date.setDate(date.getDate() + 7);
    }
    // Set to the upcoming Monday
    const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToAdd = currentDay === 0 ? 1 : (8 - currentDay);
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }
  
  if (dateRef === 'weekend') {
    const date = new Date(today);
    const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Calculate days until Saturday
    const daysToAdd = currentDay === 6 ? 0 : (6 - currentDay);
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }
  
  // Handle day names like "monday", "tuesday", etc.
  const dayMap: Record<string, number> = {
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
    'sunday': 0, 'sun': 0
  };
  
  // Handle month names
  const monthMap: Record<string, number> = {
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
  
  // Check for patterns like "the 25th" or "25th"
  const dayMatch = dateRef.match(/(?:the\s+)?(\d+)(?:st|nd|rd|th)/i);
  if (dayMatch && dayMatch[1]) {
    const day = parseInt(dayMatch[1]);
    if (day >= 1 && day <= 31) {
      const date = new Date(today);
      // If the day has already passed this month, move to next month
      if (day < date.getDate()) {
        date.setMonth(date.getMonth() + 1);
      }
      date.setDate(day);
      return date;
    }
  }
  
  // Check for patterns like "the 25th of march" or "25th of march"
  const dayMonthMatch = dateRef.match(/(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+of\s+|\s+)([a-z]+)/i);
  if (dayMonthMatch && dayMonthMatch[1] && dayMonthMatch[2]) {
    const day = parseInt(dayMonthMatch[1]);
    const monthName = dayMonthMatch[2].toLowerCase();
    const monthNum = monthMap[monthName];
    
    if (day >= 1 && day <= 31 && monthNum !== undefined) {
      const date = new Date(today);
      date.setMonth(monthNum);
      date.setDate(day);
      
      // If the date has passed for this year, set to next year
      if (date < today) {
        date.setFullYear(date.getFullYear() + 1);
      }
      
      return date;
    }
  }
  
  const targetDay = dayMap[dateRef.toLowerCase()];
  if (targetDay !== undefined) {
    const date = new Date(today);
    const currentDay = date.getDay();
    
    // Calculate days to add to reach the target day
    // If target day is today or earlier in the week, go to next week
    let daysToAdd = (targetDay - currentDay);
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }
  
  return null;
}

// Helper function to extract full date references like "the 25th of March"
function extractFullDateReference(text: string): { dateText: string; fullMatch?: string } {
  const patterns = [
    // "the 25th of March"
    /(?:on|by|for|due|before|after|this|next)\s+(the\s+\d+(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?)/i,
    // "the 25th"
    /(?:on|by|for|due|before|after|this|next)\s+(the\s+\d+(?:st|nd|rd|th))/i,
    // "25th of March"
    /(?:on|by|for|due|before|after|this|next)\s+(\d+(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?)/i,
    // Just find any date reference without preposition
    /(the\s+\d+(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?)/i,
    /(\d+(?:st|nd|rd|th)(?:\s+of\s+[a-z]+)?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return { 
        dateText: match[1],
        fullMatch: match[0]
      };
    }
  }
  
  return { dateText: '' };
}

// Helper function to process task titles and extract descriptions
function processTaskTitle(title: string): { title: string; description: string | null } {
  // Try to extract a description if title contains separators like ":" or "-"
  if (title.includes(':')) {
    const parts = title.split(':');
    return {
      title: parts[0].trim(),
      description: parts.slice(1).join(':').trim()
    };
  } else if (title.includes(' - ')) {
    const parts = title.split(' - ');
    return {
      title: parts[0].trim(),
      description: parts.slice(1).join(' - ').trim()
    };
  }
  
  // Check if the title is very long, try to split it into a title and description
  const words = title.split(/\s+/);
  if (words.length > 8) {
    // For long titles, use the first 5-7 words as the title and the rest as the description
    const titlePart = words.slice(0, 6).join(' ');
    const descriptionPart = words.slice(6).join(' ');
    return {
      title: titlePart,
      description: descriptionPart
    };
  }
  
  // No obvious split, just return the title
  return {
    title,
    description: null
  };
}

// Helper function to complete multiple tasks by numbers
function completeMultipleTasksByNumbers(taskNumbers: number[], taskStore: TaskStoreType): string {
  const activeTasks = getSortedTasksFromStore(taskStore, true);
  
  // Keep track of completed tasks and error messages
  const completedTasks: Task[] = [];
  const errors: string[] = [];
  
  // Process each task number
  taskNumbers.forEach(taskNumber => {
    // Convert from 1-based to 0-based index
    const index = taskNumber - 1;
    
    if (index < 0 || index >= activeTasks.length) {
      errors.push(`Task #${taskNumber} doesn't exist or is already completed.`);
      return;
    }
    
    const taskToComplete = activeTasks[index];
    
    // Only mark as complete if not already done
    if (taskToComplete.status !== 'done') {
      taskStore.updateTask(taskToComplete.id, {
        status: 'done',
        updatedAt: new Date()
      });
      completedTasks.push(taskToComplete);
    } else {
      errors.push(`Task #${taskNumber} "${taskToComplete.title}" is already completed.`);
    }
  });
  
  // Prepare the response message
  if (completedTasks.length === 0) {
    return `Could not complete any tasks. ${errors.join(' ')}`;
  }
  
  let response = `✅ Completed ${completedTasks.length} ${completedTasks.length === 1 ? 'task' : 'tasks'}:\n` +
    completedTasks.map(task => `• "${task.title}"`).join('\n');
  
  if (errors.length > 0) {
    response += `\n\nNote: ${errors.join(' ')}`;
  }
  
  return response;
}

// Helper function to delete multiple tasks by numbers
function deleteMultipleTasksByNumbers(taskNumbers: number[], taskStore: TaskStoreType): string {
  const allTasks = getSortedTasksFromStore(taskStore, false);
  
  // Keep track of deleted tasks and error messages
  const deletedTasks: Task[] = [];
  const errors: string[] = [];
  
  // Process each task number
  taskNumbers.forEach(taskNumber => {
    // Convert from 1-based to 0-based index
    const index = taskNumber - 1;
    
    if (index < 0 || index >= allTasks.length) {
      errors.push(`Task #${taskNumber} doesn't exist.`);
      return;
    }
    
    const taskToDelete = allTasks[index];
    deletedTasks.push(taskToDelete);
    taskStore.deleteTask(taskToDelete.id);
  });
  
  // Prepare the response message
  if (deletedTasks.length === 0) {
    return `Could not delete any tasks. ${errors.join(' ')}`;
  }
  
  let response = `🗑️ Deleted ${deletedTasks.length} ${deletedTasks.length === 1 ? 'task' : 'tasks'}:\n` +
    deletedTasks.map(task => `• "${task.title}"`).join('\n');
  
  if (errors.length > 0) {
    response += `\n\nNote: ${errors.join(' ')}`;
  }
  
  return response;
}

// Helper function to extract multiple task numbers from a message
function extractTaskNumbers(message: string): number[] {
  console.log("Extracting task numbers from:", message);
  
  // Pattern 1: "tasks 1, 2 and 3" or "tasks 1,2, and 3" or "tasks 1 2 and 3"
  const listPattern = /\b(?:tasks?|items?|numbers?)\s+(?:#?\d+\s*(?:,\s*|and\s+|\s+)+)+(?:#?\d+)\b/i;
  
  if (listPattern.test(message)) {
    // Extract the list part "1, 2 and 3" from a message like "complete tasks 1, 2 and 3"
    const match = message.match(/\b(?:tasks?|items?|numbers?)\s+((?:#?\d+\s*(?:,\s*|and\s+|\s+)+)+(?:#?\d+))\b/i);
    
    if (match && match[1]) {
      const numbersText = match[1];
      console.log("Extracted numbers text:", numbersText);
      
      // Extract individual numbers using regex
      const numbers: number[] = [];
      const numberMatches = numbersText.match(/\d+/g);
      
      if (numberMatches) {
        numberMatches.forEach(num => {
          numbers.push(parseInt(num, 10));
        });
        console.log("Extracted numbers:", numbers);
        return numbers;
      }
    }
  }
  
  // Pattern 2: Simply numbers like "1, 2 and 3" or "1,2,3"
  const simplePattern = /\b(?:#?\d+\s*(?:,\s*|and\s+|\s+)+)+(?:#?\d+)\b/;
  
  if (simplePattern.test(message)) {
    const match = message.match(/\b((?:#?\d+\s*(?:,\s*|and\s+|\s+)+)+(?:#?\d+))\b/);
    
    if (match && match[1]) {
      const numbersText = match[1];
      console.log("Extracted simple numbers text:", numbersText);
      
      // Extract individual numbers using regex
      const numbers: number[] = [];
      const numberMatches = numbersText.match(/\d+/g);
      
      if (numberMatches) {
        numberMatches.forEach(num => {
          numbers.push(parseInt(num, 10));
        });
        console.log("Extracted simple numbers:", numbers);
        return numbers;
      }
    }
  }
  
  // If no pattern matched, return empty array
  return [];
}

// Helper function to change due dates for multiple tasks by numbers
function changeMultipleTasksDueDateByNumbers(taskNumbers: number[], dateRef: string, taskStore: TaskStoreType): string {
  const activeTasks = getSortedTasksFromStore(taskStore, true);
  
  // Parse the date reference
  const newDueDate = parseDateReference(dateRef.toLowerCase());
  
  if (!newDueDate) {
    return `I couldn't understand the date "${dateRef}". Please try using a clearer date format like "today", "tomorrow", "Monday", or "the 25th".`;
  }
  
  // Keep track of updated tasks and error messages
  const updatedTasks: Task[] = [];
  const errors: string[] = [];
  
  // Process each task number
  taskNumbers.forEach(taskNumber => {
    // Convert from 1-based to 0-based index
    const index = taskNumber - 1;
    
    if (index < 0 || index >= activeTasks.length) {
      errors.push(`Task #${taskNumber} doesn't exist or is already completed.`);
      return;
    }
    
    const taskToUpdate = activeTasks[index];
    
    // Update the task's due date
    taskStore.updateTask(taskToUpdate.id, {
      dueDate: newDueDate,
      updatedAt: new Date()
    });
    updatedTasks.push(taskToUpdate);
  });
  
  // Format the date for display
  const formattedDate = newDueDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Prepare the response message
  if (updatedTasks.length === 0) {
    return `Could not update any tasks. ${errors.join(' ')}`;
  }
  
  let response = `📅 Updated ${updatedTasks.length} ${updatedTasks.length === 1 ? 'task' : 'tasks'} - due date changed to ${formattedDate}:\n` +
    updatedTasks.map(task => `• "${task.title}"`).join('\n');
  
  if (errors.length > 0) {
    response += `\n\nNote: ${errors.join(' ')}`;
  }
  
  return response;
}


// Helper function to determine priority from message text
function determinePriority(message: string): 'high' | 'medium' | 'low' {
  const normalizedMessage = message.toLowerCase();
  
  if (/\b(?:high|important|urgent|critical)\s+priority\b/i.test(normalizedMessage)) {
    return 'high';
  } else if (/\b(?:low|minor)\s+priority\b/i.test(normalizedMessage)) {
    return 'low';
  } else {
    return 'medium'; // Default to medium priority
  }
}

// Helper function to complete all tasks
function completeAllTasks(taskStore: TaskStoreType, dateFilter?: string): string {
  console.log("Completing all tasks with date filter:", dateFilter);
  
  let tasksToComplete: Task[] = [];
  
  // Get all incomplete tasks
  const allTasks = taskStore.tasks.filter(task => task.status !== 'done');
  
  if (dateFilter) {
    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateFilter.toLowerCase() === 'today') {
      tasksToComplete = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
    } else if (dateFilter.toLowerCase() === 'tomorrow') {
      tasksToComplete = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === tomorrow.getTime();
      });
    } else {
      // Try to parse the date filter
      const dateRef = parseDateReference(dateFilter.toLowerCase());
      if (dateRef) {
        tasksToComplete = allTasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const filterDate = new Date(dateRef);
          filterDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === filterDate.getTime();
        });
      } else {
        return `I couldn't understand the date "${dateFilter}". Please try using formats like "today", "tomorrow", or specific dates.`;
      }
    }
  } else {
    // No date filter, complete all tasks
    tasksToComplete = allTasks;
  }
  
  if (tasksToComplete.length === 0) {
    if (dateFilter) {
      return `There are no incomplete tasks for ${dateFilter}.`;
    } else {
      return `There are no incomplete tasks to mark as complete.`;
    }
  }
  
  // Mark all matching tasks as complete
  tasksToComplete.forEach(task => {
    taskStore.updateTask(task.id, { 
      status: 'done',
      updatedAt: new Date()
    });
  });
  
  const dateMessage = dateFilter ? ` for ${dateFilter}` : '';
  return `✅ Marked all ${tasksToComplete.length} incomplete ${tasksToComplete.length === 1 ? 'task' : 'tasks'}${dateMessage} as complete:\n` +
    tasksToComplete.map(task => `• ${task.title}`).join('\n');
}

// Helper function to delete all tasks
function deleteAllTasks(taskStore: TaskStoreType, dateFilter?: string): string {
  console.log("Deleting all tasks with date filter:", dateFilter);
  
  let tasksToDelete: Task[] = [];
  
  // Get all tasks
  const allTasks = taskStore.tasks;
  
  if (dateFilter) {
    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateFilter.toLowerCase() === 'today') {
      tasksToDelete = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
    } else if (dateFilter.toLowerCase() === 'tomorrow') {
      tasksToDelete = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === tomorrow.getTime();
      });
    } else {
      // Try to parse the date filter
      const dateRef = parseDateReference(dateFilter.toLowerCase());
      if (dateRef) {
        tasksToDelete = allTasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const filterDate = new Date(dateRef);
          filterDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === filterDate.getTime();
        });
      } else {
        return `I couldn't understand the date "${dateFilter}". Please try using formats like "today", "tomorrow", or specific dates.`;
      }
    }
  } else {
    // No date filter, delete all tasks
    tasksToDelete = allTasks;
  }
  
  if (tasksToDelete.length === 0) {
    if (dateFilter) {
      return `There are no tasks for ${dateFilter} to delete.`;
    } else {
      return `There are no tasks to delete.`;
    }
  }
  
  // Delete all matching tasks
  tasksToDelete.forEach(task => {
    taskStore.deleteTask(task.id);
  });
  
  const dateMessage = dateFilter ? ` for ${dateFilter}` : '';
  return `🗑️ Deleted all ${tasksToDelete.length} ${tasksToDelete.length === 1 ? 'task' : 'tasks'}${dateMessage}:\n` +
    tasksToDelete.map(task => `• ${task.title}`).join('\n');
}