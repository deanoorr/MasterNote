import axios from 'axios'
import { AISettings, Task, TaskPriority } from '@/types'
import { AIProvider } from '@features/aiSettings/aiSettingsSlice'

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface AIAnalysisResponse {
  success: boolean;
  error?: string;
  data?: {
    tags?: string[] | string;
    priority?: TaskPriority;
    deadline?: string;
    reasoning?: string;
  };
}

// Function to categorize task using OpenAI
export const categorizeTaskOpenAI = async (
  task: Task,
  settings: AISettings
): Promise<AIResponse> => {
  if (!settings.apiKey) {
    return { success: false, error: 'API key not provided' }
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: settings.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes tasks and suggests categories/tags. Respond with 2-3 relevant categories for the task, separated by commas.'
          },
          {
            role: 'user',
            content: `Task Title: ${task.title}\nTask Description: ${task.description}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        }
      }
    )

    if (response.data?.choices?.[0]?.message?.content) {
      return {
        success: true,
        data: response.data.choices[0].message.content.split(',').map(tag => tag.trim())
      }
    }

    return { success: false, error: 'No valid response from AI' }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Unknown error'
    }
  }
}

// Function to suggest priority using OpenAI
export const suggestPriorityOpenAI = async (
  task: Task,
  settings: AISettings
): Promise<AIResponse> => {
  if (!settings.apiKey) {
    return { success: false, error: 'API key not provided' }
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: settings.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes tasks and suggests priority levels. 
            Respond only with one of these priority levels: ${Object.values(TaskPriority).join(', ')}`
          },
          {
            role: 'user',
            content: `Task Title: ${task.title}\nTask Description: ${task.description}\nDue Date: ${task.dueDate || 'Not specified'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        }
      }
    )

    if (response.data?.choices?.[0]?.message?.content) {
      const priority = response.data.choices[0].message.content.trim().toLowerCase()
      if (Object.values(TaskPriority).includes(priority as TaskPriority)) {
        return {
          success: true,
          data: priority
        }
      }
      return { success: false, error: 'Invalid priority response from AI' }
    }

    return { success: false, error: 'No valid response from AI' }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Unknown error'
    }
  }
}

// Function to analyze a task using Anthropic's Claude
export const analyzeTaskWithClaude = async (
  task: Task,
  settings: AISettings
): Promise<AIResponse> => {
  if (!settings.apiKey) {
    return { success: false, error: 'API key not provided' }
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: settings.model || 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze this task and provide:
            1. 2-3 suggested tags/categories (comma separated)
            2. A suggested priority level (low, medium, high, or urgent)
            3. A reasonable deadline if none is specified
            4. One specific suggestion for breaking down this task
            
            Task Title: ${task.title}
            Task Description: ${task.description}
            Current Due Date: ${task.dueDate || 'Not specified'}
            
            Format your response as a JSON object with keys: tags, priority, deadline, breakdown`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': settings.apiKey
        }
      }
    )

    if (response.data?.content?.[0]?.text) {
      const text = response.data.content[0].text
      try {
        // Find the JSON part in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0])
          return {
            success: true,
            data: jsonData
          }
        }
      } catch (e) {
        // If JSON parsing fails, return the raw text
        return {
          success: true,
          data: { rawResponse: text }
        }
      }
    }

    return { success: false, error: 'No valid response from Claude' }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Unknown error'
    }
  }
}

/**
 * Analyzes a task with AI to provide suggestions for tags, priority, etc.
 */
export const analyzeTaskWithAI = async (
  task: Task,
  aiSettings: {
    apiKey: string;
    provider: string;
    model: string;
    features: {
      taskCategorization: boolean;
      prioritization: boolean;
      suggestions: boolean;
      reminders: boolean;
      reasoning: boolean;
    };
  }
): Promise<AIAnalysisResponse> => {
  const { apiKey, provider, model, features } = aiSettings;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required'
    };
  }

  try {
    const featuresRequested: string[] = [];
    
    if (features.taskCategorization) featuresRequested.push('tags');
    if (features.prioritization) featuresRequested.push('priority');
    if (features.suggestions) featuresRequested.push('deadline');
    if (features.reasoning) featuresRequested.push('reasoning');
    
    if (featuresRequested.length === 0) {
      return {
        success: false,
        error: 'No AI features enabled'
      };
    }
    
    let endpoint = '';
    let modelToUse = '';
    let requestBody = {};
    
    switch (provider) {
      case AIProvider.OPENAI:
        endpoint = 'https://api.openai.com/v1/chat/completions';
        modelToUse = model || 'gpt-4o';
        requestBody = {
          model: modelToUse,
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that specializes in task management. Analyze the given task and provide the following information: ${featuresRequested.join(', ')}.
              
              For tags, provide up to 3 relevant tags as an array.
              For priority, provide one of the following values: "low", "medium", "high", "urgent".
              For deadline, suggest a reasonable deadline as an ISO string.
              For reasoning, provide a brief explanation of your analysis and suggestions.
              
              Return your response as a JSON object with the requested fields.`
            },
            {
              role: 'user',
              content: `Task: ${task.title}
              Description: ${task.description || 'No description provided'}
              Current priority: ${task.priority}
              Current due date: ${task.dueDate || 'None'}`
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        };
        break;
        
      case AIProvider.ANTHROPIC:
        endpoint = 'https://api.anthropic.com/v1/messages';
        modelToUse = model || 'claude-3-haiku';
        requestBody = {
          model: modelToUse,
          messages: [
            {
              role: 'user',
              content: `You are an AI assistant that specializes in task management. Analyze the given task and provide the following information: ${featuresRequested.join(', ')}.
              
              For tags, provide up to 3 relevant tags as an array.
              For priority, provide one of the following values: "low", "medium", "high", "urgent".
              For deadline, suggest a reasonable deadline as an ISO string.
              For reasoning, provide a brief explanation of your analysis and suggestions.
              
              Task: ${task.title}
              Description: ${task.description || 'No description provided'}
              Current priority: ${task.priority}
              Current due date: ${task.dueDate || 'None'}
              
              Return your response as a JSON object with the requested fields.`
            }
          ],
          max_tokens: 1000
        };
        break;
        
      case AIProvider.GOOGLE:
        endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        modelToUse = model || 'gemini-pro';
        requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `You are an AI assistant that specializes in task management. Analyze the given task and provide the following information: ${featuresRequested.join(', ')}.
                  
                  For tags, provide up to 3 relevant tags as an array.
                  For priority, provide one of the following values: "low", "medium", "high", "urgent".
                  For deadline, suggest a reasonable deadline as an ISO string.
                  For reasoning, provide a brief explanation of your analysis and suggestions.
                  
                  Task: ${task.title}
                  Description: ${task.description || 'No description provided'}
                  Current priority: ${task.priority}
                  Current due date: ${task.dueDate || 'None'}
                  
                  Return your response as a JSON object with the requested fields.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3
          }
        };
        endpoint = `${endpoint}?key=${apiKey}`;
        break;
        
      default:
        return {
          success: false,
          error: 'Unsupported AI provider'
        };
    }
    
    let headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (provider === AIProvider.OPENAI) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === AIProvider.ANTHROPIC) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    const responseData = await response.json();
    
    let result: any;
    
    // Extract the content based on provider
    if (provider === AIProvider.OPENAI) {
      try {
        const content = responseData.choices[0].message.content;
        result = JSON.parse(content);
      } catch (e) {
        throw new Error('Failed to parse OpenAI response');
      }
    } else if (provider === AIProvider.ANTHROPIC) {
      try {
        const content = responseData.content[0].text;
        // Extract JSON from the content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/({[\s\S]*})/);
        if (jsonMatch && jsonMatch[1]) {
          result = JSON.parse(jsonMatch[1]);
        } else {
          result = JSON.parse(content);
        }
      } catch (e) {
        throw new Error('Failed to parse Anthropic response');
      }
    } else if (provider === AIProvider.GOOGLE) {
      try {
        const content = responseData.candidates[0].content.parts[0].text;
        // Extract JSON from the content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/({[\s\S]*})/);
        if (jsonMatch && jsonMatch[1]) {
          result = JSON.parse(jsonMatch[1]);
        } else {
          result = JSON.parse(content);
        }
      } catch (e) {
        throw new Error('Failed to parse Google AI response');
      }
    }
    
    return {
      success: true,
      data: {
        tags: result.tags,
        priority: result.priority,
        deadline: result.deadline,
        reasoning: result.reasoning
      }
    };
  } catch (error) {
    console.error('Error analyzing task with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Convert natural language to a task
 * This is a stub function for now - in production, you would likely use
 * AI to parse natural language into task details
 */
export const naturalLanguageToTask = async (
  input: string,
  aiSettings: {
    apiKey: string;
    provider: string;
    model: string;
  }
): Promise<{
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
}> => {
  // In a real app, you would send the input to an AI service
  // For now, return a simple parsing as a placeholder
  return {
    title: input,
    priority: TaskPriority.MEDIUM
  };
}; 