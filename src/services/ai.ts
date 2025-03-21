import axios from 'axios'
import { AISettings, Task, TaskPriority } from '@/types'
import { AIProvider } from '@features/aiSettings/aiSettingsSlice'

interface AIResponse {
  success: boolean
  data?: string
  error?: string
}

interface AIConfig {
  apiKey: string
  provider: string
  model: string
  features?: string[]
}

interface AIAnalysisResponse {
  success: boolean
  error?: string
  data?: {
    tags?: string[]
    priority?: TaskPriority
    deadline?: string
    reasoning?: string
  }
}

interface Tag {
  name: string
  color?: string
}

interface RawResponse {
  rawResponse: string
}

// Function to handle general AI conversation
const getAIResponse = async (message: string, config: AIConfig): Promise<AIResponse> => {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'API key is required'
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent AI assistant integrated into a task management application. Your primary role is to help users manage their tasks and engage in general conversation.

When users mention specific task-related commands like "create task", "show tasks", "analyze task", etc., you should recognize these as application commands and respond accordingly.

For task creation:
- Extract key details like title, priority, due date, and tags
- Format dates consistently
- Suggest appropriate priorities based on context
- Add relevant tags based on the task description

For task listing:
- Support filtering by priority, status, date range
- Provide clear, organized summaries
- Highlight urgent or overdue items

For task analysis:
- Offer insights on task complexity
- Suggest time management strategies
- Identify potential dependencies
- Recommend priority adjustments

For general conversation:
- Engage naturally while staying focused on productivity
- Provide helpful suggestions
- Answer questions about any topic
- Maintain context of the conversation`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get AI response')
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format')
    }

    return {
      success: true,
      data: data.choices[0].message.content
    }
  } catch (error) {
    console.error('Error getting AI response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
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
const analyzeTaskWithAI = async (taskDescription: string, apiKey: string): Promise<AIAnalysisResponse> => {
  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required'
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a task analysis assistant. Analyze the given task and extract or suggest:
1. Relevant tags (as an array of strings)
2. Appropriate priority level (URGENT, HIGH, MEDIUM, or LOW)
3. Suggested deadline if applicable (in ISO date format)
4. Brief reasoning for your suggestions

Format your response as a JSON object with these keys: tags, priority, deadline, reasoning`
          },
          {
            role: 'user',
            content: taskDescription
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze task')
    }

    const data = await response.json()
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format')
    }

    const analysisResult = JSON.parse(data.choices[0].message.content)
    return {
      success: true,
      data: {
        tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : [],
        priority: analysisResult.priority as TaskPriority,
        deadline: analysisResult.deadline,
        reasoning: analysisResult.reasoning
      }
    }
  } catch (error) {
    console.error('Error analyzing task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

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

const processRawResponse = (response: unknown): string => {
  if (typeof response === 'string') {
    return response
  }
  if (response && typeof response === 'object' && 'rawResponse' in response) {
    const typedResponse = response as RawResponse
    return typedResponse.rawResponse
  }
  throw new Error('Invalid response format')
}

export { getAIResponse, analyzeTaskWithAI, processRawResponse } 