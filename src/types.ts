export type AIModel = 'gpt4o' | 'perplexity-sonar' | 'deepseek-r1' | 'gpt-o3-mini';

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
  orderId?: number;
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