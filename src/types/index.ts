export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
  projectId: string | null;
  tags: string[];
  subtasks: SubTask[];
  position: number;
  aiSuggestions?: AISuggestion[];
  collaborators?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  description: string;
}

export interface AISuggestion {
  id: string;
  type: 'priority' | 'category' | 'deadline' | 'workflow';
  content: string;
  applied: boolean;
  createdAt: string;
}

export interface AISettings {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  endpoint?: string;
  features: {
    taskCategorization: boolean;
    prioritization: boolean;
    suggestions: boolean;
    reminders: boolean;
    reasoning: boolean;
    taskCreation?: boolean;
  };
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppTheme {
  mode: ThemeMode;
  color: string;
} 