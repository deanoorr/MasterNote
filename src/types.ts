export type AIModel = 'gpt4o' | 'gpt-o3-mini' | 'perplexity-sonar' | 'deepseek-v3' | 'deepseek-r1';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
  dependencies?: string[];
  tags?: string[];
  notes?: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    count?: number;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  timeTracking?: {
    totalLogged: number; // in minutes
    sessions: Array<{
      start: Date;
      end?: Date;
      duration?: number; // in minutes
    }>;
  };
  progress?: number; // 0-100
  category?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface AIConfig {
  apiKey?: string;
  model: AIModel;
  personality: {
    proactiveness: number; // 0-1
    detailLevel: number; // 0-1
    creativity: number; // 0-1
  };
  integrations: {
    calendar: boolean;
    email: boolean;
  };
}
