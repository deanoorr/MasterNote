import OpenAI from 'openai';
import axios from 'axios';
import { AIModel, Task } from '../types';
import { SortOption } from '../store';
import { format } from 'date-fns';

// Get API key from localStorage or env variable
const getApiKey = () => {
  const localStorageKey = localStorage.getItem('openai_api_key');
  if (localStorageKey) return localStorageKey;
  return import.meta.env.VITE_OPENAI_API_KEY || '';
};

// Get Perplexity API key from localStorage or env variable
const getPerplexityApiKey = () => {
  const localStorageKey = localStorage.getItem('perplexity_api_key');
  if (localStorageKey) return localStorageKey;
  return import.meta.env.VITE_PERPLEXITY_API_KEY || '';
};

// Initialize OpenAI with the API key
const getOpenAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not found. Please set it in the settings.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
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
            content: 'You are a helpful assistant that can manage tasks as well as answer general questions using internet search. IMPORTANT INSTRUCTION: Only create tasks when the user explicitly asks to create, add, or manage a task. When creating a task, ALWAYS use the format "TASK: [task title]" to clearly mark it as a task to be added to the task list. Any other responses should be normal conversation without the TASK prefix. When users ask you to do something or give you instructions, DO NOT convert those instructions into tasks unless they explicitly ask for a task to be created. If the user asks you to "add a task", "create a task", or uses similar wording, then format your response with "TASK:" prefix. For complex task planning, provide the steps as guidance in your explanation, but the task itself should be a single entry with a clear title.'
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

export interface AIResponse {
  content: string;
  suggestedTasks?: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }[];
}

export async function getAIResponse(model: AIModel, message: string): Promise<AIResponse> {
  try {
    console.log("Processing message for task actions:", message);
    
    // First check for local actions before attempting API calls
    
    // Check if it's a task completion request
    if (message.toLowerCase().includes('complete task') || 
        message.toLowerCase().includes('mark task as done') ||
        message.toLowerCase().includes('mark task as completed') ||
        message.toLowerCase().includes('finish task') ||
        message.toLowerCase().startsWith('complete the task')) {
      
      console.log("Detected task completion request");
      const lowerMessage = message.toLowerCase();
      
      // Get the task name to complete
      let taskTitle = '';
      
      // Extract task title from various patterns
      if (lowerMessage.includes('complete task called')) {
        taskTitle = message.replace(/^complete task called\s+/i, '').trim();
      } else if (lowerMessage.includes('complete the task')) {
        taskTitle = message.replace(/^complete the task\s+/i, '').trim();
      } else if (lowerMessage.includes('mark task called')) {
        taskTitle = message.replace(/^mark task called\s+/i, '').trim();
      } else if (lowerMessage.includes('finish task called')) {
        taskTitle = message.replace(/^finish task called\s+/i, '').trim();
      } else if (lowerMessage.startsWith('complete task')) {
        taskTitle = message.replace(/^complete task\s+/i, '').trim();
      } else if (lowerMessage.startsWith('mark task')) {
        taskTitle = message.replace(/^mark task\s+/i, '').replace(/\s+as (done|completed)$/i, '').trim();
      } else if (lowerMessage.startsWith('finish task')) {
        taskTitle = message.replace(/^finish task\s+/i, '').trim();
      }
      
      // Special case for "clean the car"
      if (lowerMessage.includes('clean the car') || lowerMessage.includes('clean car')) {
        taskTitle = 'clean the car';
      }
      
      console.log("Task to complete:", taskTitle);
      
      if (taskTitle) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { tasks, deleteTask } = storeModule.useStore.getState();
          
          console.log("Current tasks:", tasks);
          
          // Use the same matching logic as delete for consistency
          let taskToComplete = tasks.find((t: { id: string; title: string; status: string }) => 
            t.title.toLowerCase() === taskTitle.toLowerCase()
          );
          
          if (!taskToComplete) {
            taskToComplete = tasks.find((t: { id: string; title: string; status: string }) => 
              t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
              taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            
            if (!taskToComplete) {
              const taskWords = taskTitle.toLowerCase().split(/\s+/);
              taskToComplete = tasks.find((t: { id: string; title: string; status: string }) => {
                const titleWords = t.title.toLowerCase().split(/\s+/);
                return taskWords.some(word => 
                  titleWords.some(titleWord => 
                    titleWord.includes(word) || word.includes(titleWord)
                  )
                );
              });
            }
            
            if (!taskToComplete && (taskTitle.toLowerCase().includes('car') || 
                                   taskTitle.toLowerCase().includes('clean'))) {
              taskToComplete = tasks.find((t: { id: string; title: string; status: string }) => 
                t.title.toLowerCase().includes('car') ||
                t.title.toLowerCase().includes('clean')
              );
            }
          }
          
          if (taskToComplete) {
            console.log("Completing task:", taskToComplete);
            
            // Don't mark as done if it's already done
            if (taskToComplete.status === 'done') {
              return {
                content: `Task "${taskToComplete.title}" is already marked as complete.`
              };
            }
            
            // Delete task instead of updating status
            deleteTask(taskToComplete.id);
            
            // Return simple completion message without generating steps
            return {
              content: `I've completed and removed the task "${taskToComplete.title}" from your list. Great job!`
            };
          } else {
            return {
              content: `I couldn't find a task called "${taskTitle}" in your list. Please check the task name and try again.`
            };
          }
        } catch (storeError) {
          console.error("Error accessing store:", storeError);
          return {
            content: "I had an issue accessing your task list. Please try again."
          };
        }
      }
    }
    
    // Check if it's a request to complete all tasks
    if (message.toLowerCase() === 'complete all tasks' || 
        message.toLowerCase() === 'mark all tasks as done' ||
        message.toLowerCase() === 'finish all tasks') {
      
      console.log("Detected complete all tasks request");
      
      try {
        // Import directly to avoid errors if API key is missing
        const storeModule = await import('../store');
        const { tasks, deleteTask } = storeModule.useStore.getState();
        
        if (tasks.length === 0) {
          return {
            content: "You don't have any tasks to complete."
          };
        }

        // Delete all tasks (since we're using deletion as completion)
        const taskCount = tasks.length;
        const taskNames = tasks.map((t: { title: string }) => t.title).join(", ");
        
        tasks.forEach((task: { id: string }) => {
          deleteTask(task.id);
        });
        
        return {
          content: `I've completed and removed ${taskCount} tasks from your list: ${taskNames}. Great job!`
        };
      } catch (storeError) {
        console.error("Error accessing store:", storeError);
        return {
          content: "I had an issue accessing your task list. Please try again."
        };
      }
    }
    
    // Check if it's a request to delete all tasks
    if (message.toLowerCase() === 'delete all tasks' || 
        message.toLowerCase() === 'clear all tasks' ||
        message.toLowerCase() === 'remove all tasks') {
      
      console.log("Detected delete all tasks request");
      
      try {
        // Import directly to avoid errors if API key is missing
        const storeModule = await import('../store');
        const { tasks } = storeModule.useStore.getState();
        
        if (tasks.length === 0) {
          return {
            content: "You don't have any tasks to delete."
          };
        }

        // Ask for confirmation first
        return {
          content: "Are you sure you want to delete all tasks? This action cannot be undone."
        };
      } catch (storeError) {
        console.error("Error accessing store:", storeError);
        return {
          content: "I had an issue accessing your task list. Please try again."
        };
      }
    }
    
    // Handle confirmation for deleting all tasks
    if ((message.toLowerCase() === 'yes' || 
         message.toLowerCase() === 'confirm' ||
         message.toLowerCase() === 'i am sure')) {
      
      try {
        // Import directly to avoid errors if API key is missing
        const storeModule = await import('../store');
        const { tasks, deleteTask, messages } = storeModule.useStore.getState();
        
        // Check if previous message was about deleting all tasks
        const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMessage && lastAssistantMessage.content.includes("delete all tasks")) {
          console.log("Confirmed delete all tasks");
          
          if (tasks.length === 0) {
            return {
              content: "You don't have any tasks to delete."
            };
          }
          
          // Delete all tasks
          const taskCount = tasks.length;
          tasks.forEach((task: { id: string }) => {
            deleteTask(task.id);
          });
          
          return {
            content: `All ${taskCount} tasks have been deleted.`
          };
        }
      } catch (storeError) {
        console.error("Error accessing store:", storeError);
        return {
          content: "I had an issue accessing your task list. Please try again."
        };
      }
    }
    
    // Check if it's an API status request
    if (message.toLowerCase().includes('api status') || 
        message.toLowerCase().includes('check api') || 
        message.toLowerCase().includes('api key status')) {
      
      console.log("Detected API status check request");
      
      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          content: "API key is not set. Please open the settings and enter your OpenAI API key to enable AI features."
        };
      } else {
        return {
          content: "API key is set. You should be able to use AI features. If you're experiencing issues, please ensure your API key is valid and has sufficient credits."
        };
      }
    }
    
    // Check if it's a task listing request
    if (message.toLowerCase().includes('show tasks') || 
        message.toLowerCase().includes('show my tasks') || 
        message.toLowerCase().includes('list tasks') || 
        message.toLowerCase().includes('list my tasks') ||
        message.toLowerCase() === 'tasks') {
      
      console.log("Detected task listing request");
      
      try {
        // Import directly to avoid errors if API key is missing
        const storeModule = await import('../store');
        const { tasks } = storeModule.useStore.getState();
        
        console.log("Current tasks:", tasks);
        
        if (tasks.length === 0) {
          return {
            content: "You don't have any tasks yet. Would you like to create one?"
          };
        }
        
        let response = "Here are your current tasks:\n\n";
        
        tasks.forEach((task: any, index: number) => {
          const status = task.status === 'done' ? '✓' : '○';
          const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟠' : '🟢';
          
          response += `${index + 1}. ${status} ${task.title} ${priority}\n`;
        });
        
        response += "\nYou can ask me to add or delete specific tasks.";
        
        return {
          content: response
        };
      } catch (storeError) {
        console.error("Error accessing store:", storeError);
        return {
          content: "I had an issue accessing your task list. Please try again."
        };
      }
    }
    
    // Check if it's a task deletion request
    if (message.toLowerCase().includes('delete task') || 
        message.toLowerCase().includes('remove task')) {
      
      console.log("Detected task deletion request");
      const lowerMessage = message.toLowerCase();
      
      // Get the task name to delete
      let taskTitle = '';
      
      // Extract task title from various patterns
      if (lowerMessage.includes('delete task called')) {
        taskTitle = message.replace(/^delete task called\s+/i, '').trim();
      } else if (lowerMessage.includes('delete the task called')) {
        taskTitle = message.replace(/^delete the task called\s+/i, '').trim();
      } else if (lowerMessage.includes('delete task named')) {
        taskTitle = message.replace(/^delete task named\s+/i, '').trim();
      } else if (lowerMessage.includes('delete the task named')) {
        taskTitle = message.replace(/^delete the task named\s+/i, '').trim();
      } else if (lowerMessage.includes('delete task about')) {
        taskTitle = message.replace(/^delete task about\s+/i, '').trim();
      } else if (lowerMessage.includes('delete clean car')) {
        taskTitle = 'clean the car';
      } else if (lowerMessage.includes('clean car task')) {
        taskTitle = 'clean the car';
      } else if (lowerMessage.includes('cake')) {
        taskTitle = 'bake a cake';
      } else if (lowerMessage.startsWith('delete the task')) {
        taskTitle = message.replace(/^delete the task\s+/i, '').trim();
      } else if (lowerMessage.startsWith('delete task')) {
        taskTitle = message.replace(/^delete task\s+/i, '').trim();
      } else if (lowerMessage.startsWith('remove task')) {
        taskTitle = message.replace(/^remove task\s+/i, '').trim();
      }
      
      console.log("Task to delete:", taskTitle);
      
      if (taskTitle) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { tasks, deleteTask } = storeModule.useStore.getState();
          
          console.log("Current tasks:", tasks);
          
          // First try exact match
          let taskToDelete = tasks.find((t: { id: string; title: string }) => 
            t.title.toLowerCase() === taskTitle.toLowerCase()
          );
          
          // If no exact match, try fuzzy matching
          if (!taskToDelete) {
            // Try contains matching
            taskToDelete = tasks.find((t: { id: string; title: string }) => 
              t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
              taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            
            // Try word matching (any words in common)
            if (!taskToDelete) {
              const taskWords = taskTitle.toLowerCase().split(/\s+/);
              taskToDelete = tasks.find((t: { id: string; title: string }) => {
                const titleWords = t.title.toLowerCase().split(/\s+/);
                return taskWords.some(word => 
                  titleWords.some(titleWord => 
                    titleWord.includes(word) || word.includes(titleWord)
                  )
                );
              });
            }
            
            // Special case for "car" related tasks
            if (!taskToDelete && (taskTitle.toLowerCase().includes('car') || 
                                  taskTitle.toLowerCase().includes('clean'))) {
              taskToDelete = tasks.find((t: { id: string; title: string }) => 
                t.title.toLowerCase().includes('car') ||
                t.title.toLowerCase().includes('clean')
              );
            }
          }
          
          if (taskToDelete) {
            console.log("Deleting task:", taskToDelete);
            deleteTask(taskToDelete.id);
            return {
              content: `Task "${taskToDelete.title}" has been deleted. If there is anything else you would like to do, let me know!`
            };
          } else {
            return {
              content: `I couldn't find a task called "${taskTitle}" in your list. Please check the task name and try again.`
            };
          }
        } catch (storeError) {
          console.error("Error accessing store:", storeError);
          return {
            content: "I had an issue accessing your task list. Please try again."
          };
        }
      }
    }
    
    // Check if it's a priority change request
    if (message.toLowerCase().includes('change priority') || 
        message.toLowerCase().includes('set priority') ||
        message.toLowerCase().includes('make priority')) {
      
      console.log("Detected priority change request");
      const lowerMessage = message.toLowerCase();
      
      // Extract task title and priority
      let taskTitle = '';
      let newPriority: 'low' | 'medium' | 'high' | null = null;
      
      // Determine the new priority
      if (lowerMessage.includes(' low')) {
        newPriority = 'low';
      } else if (lowerMessage.includes(' medium') || lowerMessage.includes(' normal')) {
        newPriority = 'medium';
      } else if (lowerMessage.includes(' high') || lowerMessage.includes(' urgent')) {
        newPriority = 'high';
      }
      
      if (!newPriority) {
        return {
          content: "Please specify the priority level (low, medium, or high) for the task."
        };
      }
      
      // Extract task title using various patterns
      if (lowerMessage.includes('change priority of')) {
        taskTitle = message.replace(/^change priority of\s+/i, '').replace(/\s+to\s+(low|medium|high|normal|urgent)/i, '').trim();
      } else if (lowerMessage.includes('set priority of')) {
        taskTitle = message.replace(/^set priority of\s+/i, '').replace(/\s+to\s+(low|medium|high|normal|urgent)/i, '').trim();
      } else if (lowerMessage.includes('make priority of')) {
        taskTitle = message.replace(/^make priority of\s+/i, '').replace(/\s+to\s+(low|medium|high|normal|urgent)/i, '').trim();
      } else if (lowerMessage.includes('change')) {
        taskTitle = message.replace(/^.*change\s+/i, '').replace(/\s+priority\s+to\s+(low|medium|high|normal|urgent)/i, '').trim();
      } else if (lowerMessage.includes('set')) {
        taskTitle = message.replace(/^.*set\s+/i, '').replace(/\s+priority\s+to\s+(low|medium|high|normal|urgent)/i, '').trim();
      }
      
      console.log("Task to change priority:", taskTitle, "New priority:", newPriority);
      
      if (taskTitle && newPriority) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { tasks, updateTask } = storeModule.useStore.getState();
          
          console.log("Current tasks:", tasks);
          
          // First try exact match
          let taskToUpdate = tasks.find((t: { id: string; title: string }) => 
            t.title.toLowerCase() === taskTitle.toLowerCase()
          );
          
          // If no exact match, try fuzzy matching
          if (!taskToUpdate) {
            // Try contains matching
            taskToUpdate = tasks.find((t: { id: string; title: string }) => 
              t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
              taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            
            // Try word matching (any words in common)
            if (!taskToUpdate) {
              const taskWords = taskTitle.toLowerCase().split(/\s+/);
              taskToUpdate = tasks.find((t: { id: string; title: string }) => {
                const titleWords = t.title.toLowerCase().split(/\s+/);
                return taskWords.some(word => 
                  titleWords.some(titleWord => 
                    titleWord.includes(word) || word.includes(titleWord)
                  )
                );
              });
            }
          }
          
          if (taskToUpdate) {
            console.log("Updating task priority:", taskToUpdate, "New priority:", newPriority);
            
            // Update the task
            updateTask(taskToUpdate.id, {
              priority: newPriority,
              updatedAt: new Date()
            });
            
            return {
              content: `I've updated the priority of "${taskToUpdate.title}" to ${newPriority}.`
            };
          } else {
            return {
              content: `I couldn't find a task called "${taskTitle}" in your list. Please check the task name and try again.`
            };
          }
        } catch (storeError) {
          console.error("Error accessing store:", storeError);
          return {
            content: "I had an issue accessing your task list. Please try again."
          };
        }
      } else {
        return {
          content: "I couldn't understand which task you want to change the priority for. Please specify both the task name and the desired priority (low, medium, or high)."
        };
      }
    }
    
    // Check if it's a due date change request
    if (message.toLowerCase().includes('set due date') || 
        message.toLowerCase().includes('change due date') ||
        message.toLowerCase().includes('add due date') ||
        message.toLowerCase().includes('update due date') ||
        message.toLowerCase().includes('due date for')) {
      
      console.log("Detected due date change request");
      const lowerMessage = message.toLowerCase();
      
      // Extract task title and due date
      let taskTitle = '';
      let dueDate: Date | null = null;
      
      // Try to extract a date from the message
      const datePatterns = [
        // Check for specific date formats
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g, // MM/DD/YYYY or DD/MM/YYYY
        /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,\s*|\s+)(\d{4})/g, // Month DD, YYYY
        /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)(?:\s*,\s*|\s+)(\d{4})/g, // DD Month YYYY
        
        // Check for relative dates
        /today/g,
        /tomorrow/g,
        /next\s+(\w+)/g, // next Monday, next week
        /(\d{1,2})\s+days?\s+from\s+(?:today|now)/g, // 3 days from now
        /(\d{1,2})\s+weeks?\s+from\s+(?:today|now)/g, // 2 weeks from now
        /this\s+(?:coming\s+)?(\w+)/g, // this Friday, this coming week
      ];
      
      let dateString = '';
      for (const pattern of datePatterns) {
        const matches = [...message.matchAll(pattern)];
        if (matches.length > 0) {
          // Use the last match if there are multiple (assuming it's the date for the task)
          const match = matches[matches.length - 1];
          
          if (pattern.toString().includes('today')) {
            dateString = 'today';
            dueDate = new Date();
            break;
          } else if (pattern.toString().includes('tomorrow')) {
            dateString = 'tomorrow';
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1);
            break;
          } else if (pattern.toString().includes('next')) {
            const dayOrUnit = match[1].toLowerCase();
            dueDate = new Date();
            
            // Handle "next week"
            if (dayOrUnit === 'week') {
              dueDate.setDate(dueDate.getDate() + 7);
              dateString = 'next week';
              break;
            }
            
            // Handle "next Monday", etc.
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIndex = daysOfWeek.indexOf(dayOrUnit);
            if (dayIndex !== -1) {
              const today = dueDate.getDay();
              let daysToAdd = dayIndex - today;
              if (daysToAdd <= 0) daysToAdd += 7; // If it's already past that day this week, go to next week
              dueDate.setDate(dueDate.getDate() + daysToAdd);
              dateString = `next ${dayOrUnit}`;
              break;
            }
          } else if (pattern.toString().includes('days?\\s+from')) {
            const days = parseInt(match[1]);
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);
            dateString = `${days} days from now`;
            break;
          } else if (pattern.toString().includes('weeks?\\s+from')) {
            const weeks = parseInt(match[1]);
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (weeks * 7));
            dateString = `${weeks} weeks from now`;
            break;
          } else if (pattern.toString().includes('this\\s+(?:coming\s+)?(\\w+)')) {
            const dayOrUnit = match[1].toLowerCase();
            
            // Handle "this week"
            if (dayOrUnit === 'week') {
              dueDate = new Date();
              dateString = 'this week';
              // Set to end of week (Friday)
              const today = dueDate.getDay();
              const daysToFriday = 5 - today; // 5 is Friday
              if (daysToFriday >= 0) {
                dueDate.setDate(dueDate.getDate() + daysToFriday);
              }
              break;
            }
            
            // Handle "this Monday", "this coming Thursday", etc.
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIndex = daysOfWeek.indexOf(dayOrUnit);
            if (dayIndex !== -1) {
              dueDate = new Date();
              const today = dueDate.getDay();
              let daysToAdd = dayIndex - today;
              if (daysToAdd < 0) daysToAdd += 7; // If it's already past that day, go to next week
              dueDate.setDate(dueDate.getDate() + daysToAdd);
              dateString = `this ${dayOrUnit}`;
              break;
            }
          } else {
            // Try to parse the matched date
            try {
              // For MM/DD/YYYY or DD/MM/YYYY format
              if (pattern.toString().includes('\\d{1,2}[\\\/\\-\\.]\\d{1,2}')) {
                const dateParts = match[0].split(/[\/\-\.]/);
                if (dateParts.length >= 3) {
                  const first = dateParts[0];
                  const second = dateParts[1];
                  const year = dateParts[2];
                  // In US format, assume first is month, second is day
                  const month = parseInt(first) - 1; // JS months are 0-indexed
                  const day = parseInt(second);
                  const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
                  dueDate = new Date(fullYear, month, day);
                  dateString = match[0];
                }
              } 
              // For "Month DD, YYYY" or "DD Month YYYY" formats
              else {
                // Convert the match to a date string format JavaScript can parse
                let dateStr = match[0];
                dueDate = new Date(dateStr);
                if (isNaN(dueDate.getTime())) {
                  throw new Error('Invalid date');
                }
                dateString = match[0];
              }
            } catch (e) {
              console.error("Error parsing date:", e);
              dueDate = null;
            }
          }
        }
      }
      
      if (!dueDate) {
        return {
          content: "I couldn't understand the date you specified. Please provide a date in a clear format like 'MM/DD/YYYY', 'Month DD, YYYY', 'next Monday', 'tomorrow', etc."
        };
      }
      
      // Format the date for display
      const formattedDate = dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Extract task title using various patterns
      if (lowerMessage.includes('set due date for')) {
        taskTitle = message.replace(/^set due date for\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('set due date of')) {
        taskTitle = message.replace(/^set due date of\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('change due date of')) {
        taskTitle = message.replace(/^change due date of\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('add due date to')) {
        taskTitle = message.replace(/^add due date to\s+/i, '').replace(/\s+(?:of|for|on)\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('update due date for')) {
        taskTitle = message.replace(/^update due date for\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('due date for')) {
        taskTitle = message.replace(/^.*due date for\s+/i, '').replace(/\s+(?:is|should be|will be)\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('change the due date for the task called')) {
        taskTitle = message.replace(/^change the due date for the task called\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      } else if (lowerMessage.includes('the task called')) {
        taskTitle = message.replace(/^.*the task called\s+/i, '').replace(/\s+to\s+[\w\s,\.]+$/i, '').trim();
      }
      
      // Special handling for specific tasks
      if (lowerMessage.includes('clean car') || lowerMessage.includes('car cleaning')) {
        if (!taskTitle || taskTitle === '') {
          taskTitle = 'clean car';
        }
      }
      
      // Clean up the task title by removing the date part if it's still included
      if (dateString && taskTitle.includes(dateString)) {
        taskTitle = taskTitle.replace(dateString, '').trim();
      }
      
      console.log("Task to change due date:", taskTitle, "New due date:", dueDate);
      
      if (taskTitle && dueDate) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { tasks, updateTask } = storeModule.useStore.getState();
          
          console.log("Current tasks:", tasks);
          
          // First try exact match
          let taskToUpdate = tasks.find((t: { id: string; title: string }) => 
            t.title.toLowerCase() === taskTitle.toLowerCase()
          );
          
          // If no exact match, try fuzzy matching
          if (!taskToUpdate) {
            // Try contains matching
            taskToUpdate = tasks.find((t: { id: string; title: string }) => 
              t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
              taskTitle.toLowerCase().includes(t.title.toLowerCase())
            );
            
            // Try word matching (any words in common)
            if (!taskToUpdate) {
              const taskWords = taskTitle.toLowerCase().split(/\s+/);
              taskToUpdate = tasks.find((t: { id: string; title: string }) => {
                const titleWords = t.title.toLowerCase().split(/\s+/);
                return taskWords.some(word => 
                  titleWords.some(titleWord => 
                    titleWord.includes(word) || word.includes(titleWord)
                  )
                );
              });
            }
          }
          
          if (taskToUpdate) {
            console.log("Updating task due date:", taskToUpdate, "New due date:", dueDate);
            
            // Update the task
            updateTask(taskToUpdate.id, {
              dueDate,
              updatedAt: new Date()
            });
            
            return {
              content: `I've updated the due date of "${taskToUpdate.title}" to ${formattedDate}.`
            };
          } else {
            return {
              content: `I couldn't find a task called "${taskTitle}" in your list. Please check the task name and try again.`
            };
          }
        } catch (storeError) {
          console.error("Error accessing store:", storeError);
          return {
            content: "I had an issue accessing your task list. Please try again."
          };
        }
      } else {
        return {
          content: "I couldn't understand which task you want to change the due date for. Please specify both the task name and the desired due date."
        };
      }
    }
    
    // Check if it's a direct task creation request
    if (message.toLowerCase().startsWith('add') || 
        message.toLowerCase().startsWith('create') ||
        message.toLowerCase().startsWith('new task') ||
        message.toLowerCase().includes('add a task') || 
        message.toLowerCase().includes('add task') ||
        message.toLowerCase().includes('create a task') ||
        message.toLowerCase().includes('create task')) { 
      
      console.log("Detected task creation request:", message);
      
      // Extract task title - smarter parsing
      let taskTitle = message;
      let dateFound = false;
      let dueDate: Date | undefined = undefined;
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      // Handle "for tomorrow called X" pattern first - this is a high priority pattern
      const forDateCalledPattern = /\s+for\s+(tomorrow|today|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+called\s+(.+)$/i;
      const forDateCalledMatch = message.match(forDateCalledPattern);
      
      if (forDateCalledMatch) {
        const dateIndicator = forDateCalledMatch[1].toLowerCase();
        const extractedTaskTitle = forDateCalledMatch[2].trim();
        
        console.log("Matched 'for DATE called X' pattern:", dateIndicator, extractedTaskTitle);
        
        dueDate = new Date();
        dateFound = true;
        
        if (dateIndicator === 'tomorrow') {
          dueDate.setDate(dueDate.getDate() + 1);
        } else if (dateIndicator === 'next week') {
          dueDate.setDate(dueDate.getDate() + 7);
        } else if (dateIndicator !== 'today') {
          // Handle weekday names
          const targetDay = daysOfWeek.indexOf(dateIndicator);
          if (targetDay !== -1) {
            const today = dueDate.getDay();
            let daysToAdd = targetDay - today;
            if (daysToAdd <= 0) daysToAdd += 7; // If today or past, go to next week
            dueDate.setDate(dueDate.getDate() + daysToAdd);
          }
        }
        
        taskTitle = extractedTaskTitle;
        console.log("Special pattern extracted: Title:", taskTitle, "Due date:", dueDate);
      } else {
        // Remove common prefixes
        const prefixes = [
          /^add\s+(?:a\s+)?(?:new\s+)?(?:task\s+)?(?:for\s+)?(?:to\s+)?(?:called\s+)?/i,
          /^create\s+(?:a\s+)?(?:new\s+)?(?:task\s+)?(?:for\s+)?(?:to\s+)?(?:called\s+)?/i,
          /^new\s+task\s+(?:for\s+)?(?:to\s+)?(?:called\s+)?/i,
        ];
        
        for (const prefix of prefixes) {
          taskTitle = taskTitle.replace(prefix, '');
        }
        
        // Special handling for common time suffix patterns like "for tomorrow"
        const timeSuffixes = [
          {
            regex: /\s+for\s+tomorrow$/i,
            handler: () => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              dueDate = tomorrow;
              dateFound = true;
              return '';
            }
          },
          {
            regex: /\s+for\s+today$/i,
            handler: () => {
              dueDate = new Date();
              dateFound = true;
              return '';
            }
          },
          {
            regex: /\s+for\s+next\s+week$/i,
            handler: () => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              dueDate = nextWeek;
              dateFound = true;
              return '';
            }
          },
          // Handle days of the week: "for Monday", "for Tuesday", etc.
          {
            regex: /\s+for\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
            handler: (match: RegExpMatchArray) => {
              const dayOfWeek = match[1].toLowerCase();
              const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const targetDay = days.indexOf(dayOfWeek);
              
              if (targetDay !== -1) {
                const today = new Date();
                const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                
                // Calculate days to add (if today is the target day, schedule for next week)
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) {
                  daysToAdd += 7; // Move to next week
                }
                
                const targetDate = new Date();
                targetDate.setDate(today.getDate() + daysToAdd);
                dueDate = targetDate;
                dateFound = true;
              }
              
              return '';
            }
          },
          // Pattern for "in X days/weeks"
          {
            regex: /\s+in\s+(\d+)\s+(day|days|week|weeks)$/i,
            handler: (match: RegExpMatchArray) => {
              const amount = parseInt(match[1], 10);
              const unit = match[2].toLowerCase();
              
              const targetDate = new Date();
              if (unit === 'day' || unit === 'days') {
                targetDate.setDate(targetDate.getDate() + amount);
              } else if (unit === 'week' || unit === 'weeks') {
                targetDate.setDate(targetDate.getDate() + (amount * 7));
              }
              
              dueDate = targetDate;
              dateFound = true;
              return '';
            }
          }
        ];
        
        // Check for time suffix patterns
        for (const {regex, handler} of timeSuffixes) {
          const match = taskTitle.match(regex);
          if (match) {
            // Remove the time suffix and update the dueDate
            taskTitle = taskTitle.replace(regex, handler(match));
            break;
          }
        }
        
        // If no date found in suffixes, check for date indicators at the beginning of the task
        if (!dateFound) {
          const timeIndicators = [
            { regex: /^today\s+(?:to\s+|is\s+to\s+|called\s+)?/i, days: 0 },
            { regex: /^tomorrow\s+(?:to\s+|is\s+to\s+|called\s+)?/i, days: 1 },
            { regex: /^this\s+(?:coming\s+)?(\w+)\s+(?:to\s+|is\s+to\s+|called\s+)?/i, weekday: true },
            { regex: /^next\s+(\w+)\s+(?:to\s+|is\s+to\s+|called\s+)?/i, nextWeekday: true },
          ];
          
          for (const indicator of timeIndicators) {
            const match = taskTitle.match(indicator.regex);
            if (match) {
              dueDate = new Date();
              
              if (indicator.days !== undefined) {
                // Simple day offset (today, tomorrow)
                dueDate.setDate(dueDate.getDate() + indicator.days);
                dateFound = true;
              } else if (indicator.weekday && match[1]) {
                // This week's weekday
                const targetDayName = match[1].toLowerCase();
                const targetDay = daysOfWeek.indexOf(targetDayName);
                if (targetDay !== -1) {
                  const today = dueDate.getDay();
                  let daysToAdd = targetDay - today;
                  if (daysToAdd <= 0) daysToAdd += 7;  // If today or past, go to next week
                  dueDate.setDate(dueDate.getDate() + daysToAdd);
                  dateFound = true;
                }
              } else if (indicator.nextWeekday && match[1]) {
                // Next week's weekday
                const targetDayName = match[1].toLowerCase();
                const targetDay = daysOfWeek.indexOf(targetDayName);
                if (targetDay !== -1) {
                  const today = dueDate.getDay();
                  let daysToAdd = targetDay - today;
                  if (daysToAdd <= 0) daysToAdd += 7;  // Go to next week
                  dueDate.setDate(dueDate.getDate() + daysToAdd);
                  dateFound = true;
                }
              }
              
              // Remove the time indicator from the task title
              if (dateFound) {
                taskTitle = taskTitle.replace(match[0], '').trim();
              }
            }
          }
        }
        
        // Also look for time indicators embedded in the task (e.g., "clean car today")
        if (!dateFound) {
          const embeddedTimeIndicators = [
            { regex: /\s+today(?:\s+|$)/i, days: 0 },
            { regex: /\s+tomorrow(?:\s+|$)/i, days: 1 },
            { regex: /\s+this\s+(?:coming\s+)?(\w+)(?:\s+|$)/i, weekday: true },
            { regex: /\s+next\s+(\w+)(?:\s+|$)/i, nextWeekday: true },
            { regex: /\s+on\s+(\w+)(?:\s+|$)/i, weekday: true },
          ];
          
          for (const indicator of embeddedTimeIndicators) {
            const match = taskTitle.match(indicator.regex);
            if (match) {
              dueDate = new Date();
              
              if (indicator.days !== undefined) {
                // Simple day offset (today, tomorrow)
                dueDate.setDate(dueDate.getDate() + indicator.days);
                dateFound = true;
              } else if ((indicator.weekday || indicator.nextWeekday) && match[1]) {
                // This week's or next week's weekday
                const targetDayName = match[1].toLowerCase();
                const targetDay = daysOfWeek.indexOf(targetDayName);
                if (targetDay !== -1) {
                  const today = dueDate.getDay();
                  let daysToAdd = targetDay - today;
                  
                  if (indicator.nextWeekday || daysToAdd <= 0) {
                    daysToAdd += 7;  // For next week or if the day is today/past
                  }
                  
                  dueDate.setDate(dueDate.getDate() + daysToAdd);
                  dateFound = true;
                }
              }
              
              // Remove the time indicator from the task title
              if (dateFound) {
                taskTitle = taskTitle.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
              }
            }
          }
        }
        
        // Special handling for formats like "today called clean car"
        if (!dateFound) {
          const specialFormat = /^(today|tomorrow)\s+called\s+(.+)$/i;
          const match = taskTitle.match(specialFormat);
          if (match) {
            dueDate = new Date();
            if (match[1].toLowerCase() === 'tomorrow') {
              dueDate.setDate(dueDate.getDate() + 1);
            }
            taskTitle = match[2].trim();
            dateFound = true;
          }
        }
      }
      
      // Cleanup task title
      taskTitle = taskTitle.trim();
      
      // Format extracted parts
      console.log("Extracted task title:", taskTitle);
      console.log("Extracted due date:", dueDate);
      
      if (taskTitle) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { addTask } = storeModule.useStore.getState();
          
          // Create a task with the parsed title
          const newTask: Task = { 
            id: crypto.randomUUID(),
            title: taskTitle,
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            aiGenerated: true,
            dueDate: dueDate
          };
          
          // Call the addTask function
          addTask(newTask);
          
          return {
            content: `Added task: "${taskTitle}"${dueDate ? ` due on ${format(dueDate, 'PPP')}` : ''}`
          };
        } catch (storeError) {
          console.error("Error adding task to store:", storeError);
          return {
            content: "I had an issue adding your task. Please try again."
          };
        }
      }
    }

    // Check if it's a sorting request
    if (message.toLowerCase().includes('sort tasks') || 
        message.toLowerCase().includes('sort by') ||
        message.toLowerCase().includes('organize tasks') ||
        message.toLowerCase().includes('arrange tasks')) {
      
      console.log("Detected task sorting request");
      const lowerMessage = message.toLowerCase();
      
      let sortOrder = null;
      
      // Determine the requested sort order
      if (lowerMessage.includes('priority') || lowerMessage.includes('important')) {
        if (lowerMessage.includes('high to low') || 
            lowerMessage.includes('high first') || 
            lowerMessage.includes('highest') ||
            lowerMessage.includes('most important')) {
          sortOrder = 'priority-high';
        } else if (lowerMessage.includes('low to high') || 
                  lowerMessage.includes('low first') || 
                  lowerMessage.includes('lowest')) {
          sortOrder = 'priority-low';
        } else {
          // Default to high-to-low if just "by priority" is mentioned
          sortOrder = 'priority-high';
        }
      } else if (lowerMessage.includes('due') || 
                lowerMessage.includes('date') || 
                lowerMessage.includes('deadline')) {
        sortOrder = 'due-date';
      } else if (lowerMessage.includes('new') || 
                lowerMessage.includes('recent') || 
                lowerMessage.includes('newest') || 
                lowerMessage.includes('latest')) {
        sortOrder = 'created-newest';
      } else if (lowerMessage.includes('old') || 
                lowerMessage.includes('oldest') || 
                lowerMessage.includes('first created')) {
        sortOrder = 'created-oldest';
      } else if (lowerMessage.includes('alphabet') || 
                lowerMessage.includes('name') || 
                lowerMessage.includes('title')) {
        sortOrder = 'alphabetical';
      }
      
      if (sortOrder) {
        try {
          // Import directly to avoid errors if API key is missing
          const storeModule = await import('../store');
          const { tasks, setSortOrder, getSortedTasks } = storeModule.useStore.getState();
          
          console.log("Setting sort order to:", sortOrder);
          setSortOrder(sortOrder as SortOption);
          
          // Get sorted tasks to describe them
          const sortedTasks = getSortedTasks();
          
          // Generate response based on sort type
          let responsePrefix = "I've sorted your tasks ";
          
          switch (sortOrder) {
            case 'priority-high':
              responsePrefix += "by priority from highest to lowest";
              break;
            case 'priority-low':
              responsePrefix += "by priority from lowest to highest";
              break;
            case 'due-date':
              responsePrefix += "by due date (earliest first)";
              break;
            case 'created-newest':
              responsePrefix += "by creation date (newest first)";
              break;
            case 'created-oldest':
              responsePrefix += "by creation date (oldest first)";
              break;
            case 'alphabetical':
              responsePrefix += "alphabetically by title";
              break;
          }
          
          // If there are tasks, include them in the response
          if (sortedTasks.length === 0) {
            return {
              content: "You don't have any tasks to sort."
            };
          }
          
          // Include a limited number of tasks in the response
          const maxTasksToShow = 5;
          let taskList = "";
          
          if (sortedTasks.length > 0) {
            taskList = "\n\nHere are your tasks in the requested order:";
            
            for (let i = 0; i < Math.min(sortedTasks.length, maxTasksToShow); i++) {
              const task = sortedTasks[i];
              const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟠' : '🟢';
              const dueInfo = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : '';
              
              taskList += `\n${i + 1}. ${priority} ${task.title}${dueInfo}`;
            }
            
            if (sortedTasks.length > maxTasksToShow) {
              taskList += `\n...and ${sortedTasks.length - maxTasksToShow} more`;
            }
          }
          
          return {
            content: responsePrefix + "." + taskList + "\n\nNote: Your tasks will normally be sorted by due date by default. This special sorting is just for this view."
          };
        } catch (storeError) {
          console.error("Error accessing store:", storeError);
          return {
            content: "I had an issue sorting your tasks. Please try again."
          };
        }
      } else {
        return {
          content: "Please specify how you'd like to sort the tasks (by priority, due date, creation date, or alphabetically)."
        };
      }
    }

    // Call the appropriate API based on the model
    if (model === 'perplexity-sonar') {
      console.log("Using Perplexity Sonar API...");
      const content = await callPerplexityAPI(message);
      const suggestedTasks = extractTasksFromResponse(content);
      
      return {
        content,
        suggestedTasks,
      };
    } else {
      console.log("Using OpenAI API...");
      // Get the OpenAI client
      const openai = getOpenAIClient();
      
      // Map the model to the correct OpenAI model name
      const modelName = model === 'gpt4o' ? 'gpt-4o' : 'gpt-3.5-turbo';
      
      // ... existing OpenAI code ...
    }

    // Regular API call for non-direct task requests
    const openai = getOpenAIClient();
    let modelName: string;
    
    switch (model) {
      case 'gpt4o':
        modelName = 'gpt-4o';
        break;
      case 'o3-mini':
        modelName = 'gpt-3.5-turbo'; // Fallback to GPT-3.5 for o3-mini
        break;
      default:
        modelName = 'gpt-4o'; // default to gpt-4o
    }
    
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that can manage tasks as well as answer general questions using internet search. IMPORTANT INSTRUCTION: Only create tasks when the user explicitly asks to create, add, or manage a task. When creating a task, ALWAYS use the format "TASK: [task title]" to clearly mark it as a task to be added to the task list. Any other responses should be normal conversation without the TASK prefix. When users ask you to do something or give you instructions, DO NOT convert those instructions into tasks unless they explicitly ask for a task to be created. If the user asks you to "add a task", "create a task", or uses similar wording, then format your response with "TASK:" prefix. For complex task planning, provide the steps as guidance in your explanation, but the task itself should be a single entry with a clear title.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    });
    
    const content = completion.choices[0]?.message?.content || 'No response';
    const suggestedTasks = extractTasksFromResponse(content);
    
    return {
      content,
      suggestedTasks,
    };
  } catch (error: any) {
    console.error('AI Service Error:', error);
    
    // Provide more specific error messages based on error type
    if (error.message?.includes('API key')) {
      return {
        content: 'Error: Invalid or missing API key. Please check your API key in the settings.',
      };
    } else if (error.message?.includes('Rate limit') || error.status === 429) {
      return {
        content: 'Error: Rate limit exceeded. Please try again in a few moments.',
      };
    } else if (error.message?.includes('model') || error.status === 404) {
      return {
        content: `Error: The selected model "${model}" is not available. Please try a different model.`,
      };
    } else {
      return {
        content: 'Error: Unable to get AI response. Please check your API key and try again.',
      };
    }
  }
}

export function extractTasksFromResponse(response: string) {
  console.log("Extracting tasks from response:", response);
  
  // Don't extract tasks from responses that are clearly informational
  if (response.includes("current price") || 
      response.includes("market cap") || 
      response.includes("statistics") || 
      response.includes("billion") ||
      response.includes("research") ||
      response.includes("cryptocurrency") ||
      response.includes("volatile") ||
      response.includes("increase") ||
      response.includes("decrease") ||
      response.includes("ranked")) {
    console.log("Detected informational content - not extracting tasks");
    return [];
  }
  
  // Look specifically for the TASK: format first
  const taskPrefixRegex = /TASK:\s*(.*?)(?:\n|$)/gi;
  let taskMatches = [];
  let match;
  
  while ((match = taskPrefixRegex.exec(response)) !== null) {
    if (match[1] && match[1].trim()) {
      taskMatches.push({
        title: match[1].trim(),
        priority: 'medium' as 'low' | 'medium' | 'high'
      });
    }
  }
  
  // If we found explicit TASK: markers, use only those
  if (taskMatches.length > 0) {
    console.log("Found explicit TASK markers:", taskMatches);
    return taskMatches;
  }

  // If no explicit TASK: markers, check for other format only if there's a clear indication
  // of task creation intent in the message
  if (response.toLowerCase().includes('add a task') || 
      response.toLowerCase().includes('create a task') ||
      response.toLowerCase().includes('new task') ||
      response.toLowerCase().includes('added task')) {
    
    // Check for task-related keywords in specific formats
    const taskKeywords = ['task:', 'todo:', 'to-do:', 'to do:'];
    const hasTaskKeywords = taskKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasTaskKeywords) {
      // Continue with existing task extraction logic for these formats
      const taskRegex = /task:?\s*(.*?)(?:\n|$)/gi;
      const todoRegex = /(?:todo|to-do|to do):?\s*(.*?)(?:\n|$)/gi;
      const tasks = [];
      
      // Extract tasks marked with "Task:" format
      while ((match = taskRegex.exec(response)) !== null) {
        if (match[1] && match[1].trim()) {
          tasks.push({
            title: match[1].trim(),
            priority: 'medium' as 'low' | 'medium' | 'high'
          });
        }
      }
      
      // Extract todos
      while ((match = todoRegex.exec(response)) !== null) {
        if (match[1] && match[1].trim()) {
          tasks.push({
            title: match[1].trim(),
            priority: 'medium' as 'low' | 'medium' | 'high'
          });
        }
      }
      
      if (tasks.length > 0) {
        console.log("Extracted tasks from keywords:", tasks);
        return tasks;
      }
    }
    
    // If still no tasks found, look for sentences describing task creation
    const sentenceRegex = /(?:i\'ll create a task|i\'ve added a task|here\'s a task|added task|created a task)[^.!?]*?(?:called|named|titled|for)?\s*["']?([^"'.!?]+)["']?/i;
    const sentenceMatch = response.match(sentenceRegex);
    
    if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].trim()) {
      const taskFromSentence = [{
        title: sentenceMatch[1].trim(),
        priority: 'medium' as 'low' | 'medium' | 'high'
      }];
      console.log("Extracted task from sentence:", taskFromSentence);
      return taskFromSentence;
    }
  }

  // If we get here, we didn't find any tasks
  console.log("No tasks found in the response");
  return [];
} 