import OpenAI from 'openai';
import axios from 'axios';
import { AIModel, Task, Message } from '../types';
import { SortOption } from '../store';
import { format } from 'date-fns';
import { useStore } from '../store';

// Define conversation history types
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Function to get conversation history from local storage
async function getConversationHistory(userId: string): Promise<ConversationMessage[]> {
  try {
    const historyString = localStorage.getItem(`conversation_history_${userId}`);
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
    localStorage.setItem(`conversation_history_${userId}`, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving message to history:", error);
  }
}

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

// Get Perplexity API key
const getPerplexityApiKey = () => {
  const localStorageKey = localStorage.getItem('perplexity_api_key');
  if (localStorageKey) return localStorageKey;
  
  const envKey = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
  return envKey;
};

// Get DeepSeek API key
const getDeepSeekApiKey = () => {
  const localStorageKey = localStorage.getItem('deepseek_api_key');
  if (localStorageKey) return localStorageKey;
  
  const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
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
function getOpenAIClient(): OpenAI {
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
}

// Call Perplexity API
const callPerplexityAPI = async (message: string) => {
  const apiKey = getPerplexityApiKey();
  
  if (!apiKey) {
    return "Search Mode requires a Perplexity API key. Please go to Settings and add your Perplexity API key to use this feature.";
  }
  
  try {
    // Get conversation history for context
    const userId = "user123"; // Use a consistent user ID or pass this from the caller
    const conversationHistory = await getConversationHistory(userId);
    
    // Create a more comprehensive system prompt
    const systemPrompt = 'You are a helpful assistant with search capabilities. You can provide information from the internet and have the most up-to-date knowledge. When answering questions, try to be informative and cite sources when possible. You can also help with task management, but specialized task operations are handled separately by the system.';
    
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
  const apiKey = getDeepSeekApiKey();
  
  if (!apiKey) {
    return "Reasoning Mode requires a DeepSeek API key. Please go to Settings and add your DeepSeek API key to use this feature.";
  }
  
  try {
    // Get conversation history for context
    const userId = "user123"; // Use a consistent user ID or pass this from the caller
    const conversationHistory = await getConversationHistory(userId);
    
    // Create a more comprehensive system prompt
    const systemPrompt = 'You are a helpful assistant with strong reasoning capabilities. You excel at solving complex problems through step-by-step reasoning. You can also help with task management, but specialized task operations are handled separately by the system. Provide thoughtful and detailed responses to questions that require reasoning.';
    
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

// Test OpenAI connection
export async function testOpenAIConnection() {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, are you working?" }
      ],
      max_tokens: 10
    });
    console.log("OpenAI API test response:", response);
    return {
      success: true,
      message: "Successfully connected to OpenAI API.",
      model: "gpt-4o"
    };
  } catch (error) {
    console.error("OpenAI API test error:", error);
    return {
      success: false,
      message: `Failed to connect to OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      model: "gpt-4o"
    };
  }
}

// Define task store interface
interface TaskStoreType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByDate: (filter: string) => Task[];
  getSortedTasks?: () => Task[];
}

/**
 * Process natural language task instructions using OpenAI's GPT model
 * This gives us true AI understanding of task requests without needing manual pattern matching
 */
async function processTaskWithAI(message: string, taskStore: TaskStoreType): Promise<string> {
  console.log("Processing task with OpenAI:", message);
  
  try {
    const openai = getOpenAIClient();
    
    // Check if this is a request to generate subtasks
    if (message.toLowerCase().includes("help me") || 
        message.toLowerCase().includes("add tasks that would help") ||
        message.toLowerCase().includes("add subtasks") ||
        message.toLowerCase().includes("create subtasks") ||
        message.toLowerCase().includes("what steps")) {
      return await generateSubtasksWithAI(message, taskStore);
    }
    
    // Check if this is a multi-task creation request (like an email or list conversion)
    if (message.toLowerCase().includes("turn") && 
        (message.toLowerCase().includes("into tasks") || 
         message.toLowerCase().includes("into to-dos") || 
         message.toLowerCase().includes("into todo")) ||
        message.toLowerCase().includes("create tasks from") ||
        (message.toLowerCase().includes("following") && 
         message.toLowerCase().includes("tasks")) ||
        // Detect numbered list patterns (1. Task, 2. Task, etc.)
        message.match(/\d+\s*\.\s*\w+/) !== null ||
        // Detect bullet point lists
        message.match(/[\*\-•]\s+\w+/) !== null ||
        // If message contains "finish" and multiple lines
        (message.toLowerCase().includes("finish") && message.split('\n').length > 2) ||
        // If "please" is followed by multiple action verbs that could be tasks
        (message.toLowerCase().includes("please") && 
         (countMatches(message.toLowerCase(), /\b(do|make|create|finish|complete|review|send|call|email|schedule|organize|prepare|write|update)\b/) > 1))) {
      
      console.log("Detected multi-task message pattern");
      return await processMultiTaskCreation(message, taskStore);
    }
    
    // Define a system prompt that instructs GPT how to parse task commands
    const systemPrompt = `You are a task management assistant. Your job is to analyze the user's request and extract the relevant information for task management.
Extract the following information:
1. INTENT: What does the user want to do? (add/create, delete/remove, complete/finish, list/show, modify/update)
2. TASK_TITLE: If they're creating a task, what is the title? (Extract only the core task title, not date or priority)
3. DATE: Is there a specific date or time mentioned? (exact date, today, tomorrow, next week, etc.)
4. PRIORITY: Any priority mentioned? (high, medium, low)
5. TASK_NUMBER: If referring to an existing task by number, what is it? (extract just the number)
6. DESCRIPTION: Any additional details for the task?
7. BULK_ACTION: Are they referring to "all tasks" or multiple tasks? If they say "delete all tasks" or similar, this MUST be true.
8. FILTER: If bulk action, what's the filter? (today, overdue, high priority, etc.)

IMPORTANT: For phrases like "delete all tasks" or "complete all tasks", you MUST set bulkAction to true.

Respond in JSON format:
{
  "intent": "add|delete|complete|list|modify",
  "taskTitle": "the task title",
  "date": "2023-04-26" or "today" or "tomorrow" or "next week",
  "priority": "high|medium|low",
  "taskNumber": 5,
  "description": "additional details",
  "bulkAction": true|false,
  "filter": "today|tomorrow|this week|high|medium|low|all"
}

Only include fields that you can extract from the user's message. If a field is not applicable or not mentioned, omit it entirely from the JSON.`;
    
    // Send the request to the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for best natural language understanding
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }, // Ensure we get a valid JSON response
      temperature: 0.3 // Lower temperature for more predictable extraction
    });
    
    // Extract and parse the JSON from the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Parse the JSON
    const taskData = JSON.parse(content);
    console.log("AI parsed task data:", taskData);
    
    // Check for bulk actions first
    // For a message like "delete all tasks", ensure it's treated as a bulk action
    if (taskData.bulkAction === true || 
       (message.toLowerCase().includes("all") && 
        (message.toLowerCase().includes("delete") || 
         message.toLowerCase().includes("remove") || 
         message.toLowerCase().includes("complete") || 
         message.toLowerCase().includes("finish")))) {
      
      // If it's not already set, make sure it's a bulk action
      if (!taskData.bulkAction) {
        taskData.bulkAction = true;
        
        // Set intent if not already set
        if (!taskData.intent) {
          if (message.toLowerCase().includes("delete") || message.toLowerCase().includes("remove")) {
            taskData.intent = "delete";
          } else if (message.toLowerCase().includes("complete") || message.toLowerCase().includes("finish")) {
            taskData.intent = "complete";
          }
        }
        
        // Set filter if not already set
        if (!taskData.filter && message.toLowerCase().includes("today")) {
          taskData.filter = "today";
        } else if (!taskData.filter) {
          taskData.filter = "all";
        }
      }
      
      console.log("Processing as bulk action:", taskData);
      return handleBulkAction(taskData, taskStore);
    }
    
    // Now process the request based on the extracted intent
    switch (taskData.intent?.toLowerCase()) {
      case "add":
      case "create":
        return handleAITaskCreation(taskData, taskStore);
      
      case "delete":
      case "remove":
        return handleAITaskDeletion(taskData, taskStore);
      
      case "complete":
      case "finish":
      case "mark":
        return handleAITaskCompletion(taskData, taskStore);
      
      case "list":
      case "show":
      case "display":
        if (taskData.priority) {
          return handleTaskListByPriority(taskData.priority as "high" | "medium" | "low", taskStore);
        }
        const dateFilter = taskData.date?.toLowerCase() || "all";
        return handleTaskListRequest(dateFilter, taskStore);
      
      case "modify":
      case "update":
      case "change":
        return handleAITaskModification(taskData, taskStore);
      
      default:
        return "I couldn't determine what you want to do with your task. Please try again with a clearer instruction.";
    }
  } catch (error) {
    console.error("Error processing task with AI:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
}

/**
 * Generate subtasks for a complex activity using OpenAI
 * For example: breaking down "bake a cake" into multiple prerequisite steps
 */
async function generateSubtasksWithAI(message: string, taskStore: TaskStoreType): Promise<string> {
  try {
    const openai = getOpenAIClient();
    
    // Extract the main activity from the message
    const activityMatch = message.match(/(?:help me|add tasks that would help|add subtasks|create subtasks|what steps|steps to)(?:\s+for)?\s+(.+?)(?:\s+by|\s+on|\s+due|\s+$)/i);
    const mainActivity = activityMatch ? activityMatch[1].trim() : message;
    
    const systemPrompt = `You are a task planning assistant. The user is asking for help breaking down a complex activity into subtasks.

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
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need to ${mainActivity}. What tasks should I create?` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7 // Higher temperature for more creative subtask generation
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
    const createdTasks: string[] = [];
    
    if (subtasksData.subtasks && Array.isArray(subtasksData.subtasks)) {
      for (const subtask of subtasksData.subtasks) {
        // Parse the relative due date
        let dueDate = new Date();
        
        if (subtask.dueDate === "today") {
          dueDate = new Date();
        } else if (subtask.dueDate === "tomorrow") {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);
        } else if (subtask.dueDate.startsWith("+")) {
          const daysToAdd = parseInt(subtask.dueDate.match(/\+(\d+)/)?.[1] || "0");
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + daysToAdd);
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
  
  if (!dateStr) return null;
  
  // Convert to lowercase for easier matching
  const normalizedDateStr = dateStr.toLowerCase();
  
  // Handle "today"
  if (normalizedDateStr.includes('today')) {
    return new Date();
  }
  
  // Handle "tomorrow"
  if (normalizedDateStr.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
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
      return futureDate;
    }
  }
  
  // Handle "next week"
  if (normalizedDateStr.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // Handle "X days" (e.g., "in 3 days")
  const daysMatch = normalizedDateStr.match(/in (\d+) days?/);
  if (daysMatch && daysMatch[1]) {
    const daysToAdd = parseInt(daysMatch[1]);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
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
        
        // Set the date with the current year
        const date = new Date();
        date.setMonth(month);
        date.setDate(day);
        
        // If date is in the past, use next year
        if (date < today) {
          date.setFullYear(date.getFullYear() + 1);
        }
        
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
    
    const date = new Date(year, month, day);
    return date;
  }
  
  // Handle MM/DD/YYYY format
  const usMatch = normalizedDateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const month = parseInt(usMatch[1]) - 1;
    const day = parseInt(usMatch[2]);
    const year = parseInt(usMatch[3]);
    
    const date = new Date(year, month, day);
    return date;
  }
  
  // Handle MM/DD format (assume current year)
  const shortMatch = normalizedDateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (shortMatch) {
    const month = parseInt(shortMatch[1]) - 1;
    const day = parseInt(shortMatch[2]);
    
    const date = new Date();
    date.setMonth(month);
    date.setDate(day);
    
    // If date is in the past, use next year
    if (date < today) {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date;
  }
  
  console.log("Could not parse date:", dateStr);
  return null;
}

/**
 * Handle task creation based on AI-parsed data
 */
function handleAITaskCreation(taskData: any, taskStore: TaskStoreType): string {
  let title = taskData.taskTitle;
  let description = taskData.description || "";
  let priority = (taskData.priority || "medium").toLowerCase() as "low" | "medium" | "high";
  
  // Parse the date
  let dueDate = new Date();
  
  if (taskData.date) {
    const dateStr = taskData.date.toLowerCase();
    
    if (dateStr === "today") {
      dueDate = new Date();
    } else if (dateStr === "tomorrow") {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (dateStr === "next week") {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // ISO format date (YYYY-MM-DD)
      dueDate = new Date(dateStr);
      
      // Ensure date is not in the past
      const today = new Date();
      if (dueDate < today) {
        // If it's in the past, set it to next year
        dueDate.setFullYear(today.getFullYear() + 1);
      }
    } else {
      // Try to parse natural language date
      const parsedDate = parseDateReference(dateStr);
      if (parsedDate) {
        dueDate = parsedDate;
        
        // Ensure the date is not in the past
        const today = new Date();
        if (dueDate < today && Math.abs(today.getTime() - dueDate.getTime()) > 24 * 60 * 60 * 1000) {
          // If more than a day in the past, set it to next year
          dueDate.setFullYear(today.getFullYear() + 1);
        }
      }
    }
  }
  
  // Additional check for month-specific dates - ensure they're in the future
  const today = new Date();
  if (dueDate.getFullYear() === today.getFullYear() && 
      ((dueDate.getMonth() < today.getMonth()) || 
       (dueDate.getMonth() === today.getMonth() && dueDate.getDate() < today.getDate()))) {
    // If it's in the past within the current year, set it to next year
    dueDate.setFullYear(today.getFullYear() + 1);
  }
  
  // Create a unique ID for the task
  const id = Date.now().toString();
  
  // Create the task object
  const newTask = {
    id,
    title,
    description,
    dueDate,
    priority,
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
    day: "numeric",
    year: "numeric" // Added year to display for clarity
  });
  
  return `✅ Added task: "${title}"${description ? ` (${description})` : ""} due ${dueDateString}.`;
}

/**
 * Find task by number in a list (helper function)
 */
function findTaskByNumber(taskNumber: number, taskStore: TaskStoreType): Task | null {
  const tasks = taskStore.tasks;
  if (taskNumber < 1 || taskNumber > tasks.length) {
    return null;
  }
  return tasks[taskNumber - 1] || null;
}

/**
 * Find task by title/name in a list (helper function)
 */
function findTaskByName(taskTitle: string, taskStore: TaskStoreType): Task | null {
  const tasks = taskStore.tasks;
  const normalizedTitle = taskTitle.toLowerCase().trim();
  
  // First try exact match
  let matchedTask = tasks.find(task => 
    task.title.toLowerCase() === normalizedTitle
  );
  
  // If no exact match, try contains
  if (!matchedTask) {
    matchedTask = tasks.find(task => 
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
  
  taskStore.deleteTask(task.id);
  return `✅ Deleted task: "${task.title}"`;
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
  
  taskStore.updateTask(task.id, { status: "done" });
  return `✅ Marked task "${task.title}" as complete.`;
}

/**
 * Handle task deletion based on AI-parsed data
 */
function handleAITaskDeletion(taskData: any, taskStore: TaskStoreType): string {
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
 * List tasks for a specific date or filter
 */
function handleTaskListRequest(dateFilter: string, taskStore: TaskStoreType): string {
  // Get the tasks based on the filter
  let tasks: Task[] = [];
  
  if (dateFilter === "all") {
    tasks = taskStore.tasks;
  } else {
    tasks = taskStore.getTasksByDate(dateFilter);
  }
  
  if (tasks.length === 0) {
    if (dateFilter === "all") {
      return "You don't have any tasks. Add some tasks to get started!";
    } else {
      return `You don't have any tasks ${dateFilter === "today" ? "for today" : "for " + dateFilter}.`;
    }
  }
  
  // Format the task list
  const formattedTasks = tasks.map((task, index) => {
    const dueDate = task.dueDate 
      ? task.dueDate.toLocaleDateString("en-US", { 
          weekday: "short", 
          month: "short", 
          day: "numeric" 
        })
      : "No due date";
    
    return `${index + 1}. ${task.title} (${task.priority} priority, due ${dueDate})${task.status === "done" ? " ✓" : ""}`;
  });
  
  const dateDescription = dateFilter === "all" ? "all tasks" : `tasks for ${dateFilter}`;
  return `Here are your ${dateDescription}:\n\n${formattedTasks.join("\n")}`;
}

/**
 * List tasks by priority
 */
function handleTaskListByPriority(priority: "high" | "medium" | "low", taskStore: TaskStoreType): string {
  const tasks = taskStore.tasks.filter(task => task.priority === priority);
  
  if (tasks.length === 0) {
    return `You don't have any ${priority} priority tasks.`;
  }
  
  // Format the task list
  const formattedTasks = tasks.map((task, index) => {
    const dueDate = task.dueDate 
      ? task.dueDate.toLocaleDateString("en-US", { 
          weekday: "short", 
          month: "short", 
          day: "numeric" 
        })
      : "No due date";
    
    return `${index + 1}. ${task.title} (due ${dueDate})${task.status === "done" ? " ✓" : ""}`;
  });
  
  return `Here are your ${priority} priority tasks:\n\n${formattedTasks.join("\n")}`;
}

/**
 * Change a task's due date
 */
function changeTaskDueDateByNumber(taskNumber: number, newDateStr: string, taskStore: TaskStoreType): string {
  const task = findTaskByNumber(taskNumber, taskStore);
  
  if (!task) {
    return `Task #${taskNumber} not found. Please check the task number and try again.`;
  }
  
  const newDate = parseDateReference(newDateStr);
  if (!newDate) {
    return `I couldn't understand the date "${newDateStr}". Please try a different format.`;
  }
  
  taskStore.updateTask(task.id, { dueDate: newDate });
  
  const dueDateString = newDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric",
    year: "numeric"
  });
  
  return `✅ Updated due date for task "${task.title}" to ${dueDateString}.`;
}

/**
 * Handle task modification based on AI-parsed data
 */
function handleAITaskModification(taskData: any, taskStore: TaskStoreType): string {
  // Currently only supports changing due date
  if (taskData.taskNumber !== undefined && taskData.date) {
    return changeTaskDueDateByNumber(taskData.taskNumber, taskData.date, taskStore);
  }
  
  // If task is identified by title and we have a new date
  if (taskData.taskTitle && taskData.date) {
    const task = findTaskByName(taskData.taskTitle, taskStore);
    
    if (!task) {
      return `Task "${taskData.taskTitle}" not found. Please check the task name and try again.`;
    }
    
    const newDate = parseDateReference(taskData.date);
    if (!newDate) {
      return `I couldn't understand the date "${taskData.date}". Please try a different format.`;
    }
    
    taskStore.updateTask(task.id, { dueDate: newDate });
    
    const dueDateString = newDate.toLocaleDateString("en-US", { 
      weekday: "long", 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
    
    return `✅ Updated due date for task "${task.title}" to ${dueDateString}.`;
  }
  
  // If we're changing priority
  if ((taskData.taskNumber !== undefined || taskData.taskTitle) && taskData.priority) {
    const task = taskData.taskNumber !== undefined 
      ? findTaskByNumber(taskData.taskNumber, taskStore)
      : findTaskByName(taskData.taskTitle, taskStore);
    
    if (!task) {
      return `Task ${taskData.taskNumber !== undefined ? `#${taskData.taskNumber}` : `"${taskData.taskTitle}"`} not found.`;
    }
    
    taskStore.updateTask(task.id, { 
      priority: taskData.priority.toLowerCase() as "low" | "medium" | "high" 
    });
    
    return `✅ Updated priority for task "${task.title}" to ${taskData.priority}.`;
  }
  
  return "I couldn't determine how to modify the task. Please specify what you want to change.";
}

/**
 * Handle bulk actions like "delete all tasks" or "complete all tasks for today"
 */
function handleBulkAction(taskData: any, taskStore: TaskStoreType): string {
  console.log("Handling bulk action with data:", taskData);
  
  // Ensure we have an intent
  const intent = taskData.intent?.toLowerCase() || 
               (taskData.message?.toLowerCase().includes("delete") ? "delete" : 
                taskData.message?.toLowerCase().includes("complete") ? "complete" : "unknown");
  
  // Determine filter
  let filter = taskData.filter?.toLowerCase() || "all";
  let dateFilter = taskData.date?.toLowerCase();
  
  console.log("Bulk action intent:", intent, "filter:", filter, "dateFilter:", dateFilter);
  
  // If there's a date mentioned, use it as the filter
  if (dateFilter) {
    filter = dateFilter;
  }
  
  // Get the filtered tasks
  let filteredTasks: Task[] = [];
  
  if (filter === "all") {
    filteredTasks = taskStore.tasks;
  } else if (filter === "today" || filter === "tomorrow" || filter === "this week" || filter === "next week" || filter === "overdue") {
    filteredTasks = taskStore.getTasksByDate(filter);
  } else if (filter === "high" || filter === "medium" || filter === "low") {
    filteredTasks = taskStore.tasks.filter(task => task.priority === filter);
  }
  
  console.log(`Found ${filteredTasks.length} tasks matching filter "${filter}"`);
  
  // Handle no tasks case
  if (filteredTasks.length === 0) {
    if (filter === "all") {
      return "You don't have any tasks to " + intent + ".";
    } else {
      return `You don't have any tasks for ${filter} to ${intent}.`;
    }
  }
  
  // Process based on intent
  if (intent === "delete" || intent === "remove") {
    // Delete all the filtered tasks
    const count = filteredTasks.length;
    filteredTasks.forEach(task => {
      taskStore.deleteTask(task.id);
    });
    
    return `✅ Deleted ${count} task${count !== 1 ? 's' : ''} ${filter !== "all" ? 'for ' + filter : ''}.`;
  } 
  else if (intent === "complete" || intent === "finish" || intent === "mark") {
    // Complete all the filtered tasks
    const count = filteredTasks.length;
    filteredTasks.forEach(task => {
      taskStore.updateTask(task.id, { status: "done" });
    });
    
    return `✅ Marked ${count} task${count !== 1 ? 's' : ''} as complete ${filter !== "all" ? 'for ' + filter : ''}.`;
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
    const currentModel = localStorage.getItem('selected_model') as AIModel || 'gpt4o';
    
    // Get the normalized message for logging
    const normalizedMessage = message.toLowerCase().trim();
    console.log("Processing normalized message:", normalizedMessage);
    
    // Use AI-based classification to determine if this is a task-related query
    const openai = getOpenAIClient();
    
    // Get comprehensive classification using AI understanding
    const classificationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
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
      } else {
        // For GPT-4o model, use general conversation
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
          model: "gpt-4o",
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
    const openai = getOpenAIClient();
    
    // Define a system prompt that instructs GPT how to extract tasks from text
    const systemPrompt = `You are a task extraction assistant. Extract tasks from the user's message and format them as a list of tasks.

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
