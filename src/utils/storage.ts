import { Task, Project, AISettings, ThemeMode } from '@/types'

// Tasks storage
export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

export const getTasks = (): Task[] => {
  try {
    const tasks = localStorage.getItem('tasks')
    return tasks ? JSON.parse(tasks) : []
  } catch (error) {
    console.error('Error retrieving tasks from localStorage:', error)
    return []
  }
}

export const getTaskById = (id: string): Task | undefined => {
  const tasks = getTasks()
  return tasks.find(task => task.id === id)
}

// Projects storage
export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem('projects', JSON.stringify(projects))
}

export const getProjects = (): Project[] => {
  try {
    const projects = localStorage.getItem('projects')
    return projects ? JSON.parse(projects) : []
  } catch (error) {
    console.error('Error retrieving projects from localStorage:', error)
    return []
  }
}

export const getProjectById = (id: string): Project | undefined => {
  const projects = getProjects()
  return projects.find(project => project.id === id)
}

// AI Settings storage
export const saveAISettings = (settings: AISettings): void => {
  localStorage.setItem('aiSettings', JSON.stringify(settings))
}

export const getAISettings = (): AISettings | null => {
  try {
    const settings = localStorage.getItem('aiSettings')
    return settings ? JSON.parse(settings) : null
  } catch (error) {
    console.error('Error retrieving AI settings from localStorage:', error)
    return null
  }
}

// Theme settings storage
export const saveThemeMode = (mode: ThemeMode): void => {
  localStorage.setItem('themeMode', mode)
}

export const getThemeMode = (): ThemeMode => {
  const mode = localStorage.getItem('themeMode') as ThemeMode | null
  return mode || 'system'
}

export const saveThemeColor = (color: string): void => {
  localStorage.setItem('themeColor', color)
}

export const getThemeColor = (): string => {
  return localStorage.getItem('themeColor') || 'blue'
}

// Clear all data (for testing/development)
export const clearAllData = (): void => {
  localStorage.removeItem('tasks')
  localStorage.removeItem('projects')
  localStorage.removeItem('aiSettings')
  localStorage.removeItem('themeMode')
  localStorage.removeItem('themeColor')
}

// Import/Export data (for backup/restore)
export const exportData = (): string => {
  const data = {
    tasks: getTasks(),
    projects: getProjects(),
    aiSettings: getAISettings(),
    themeMode: getThemeMode(),
    themeColor: getThemeColor()
  }
  
  return JSON.stringify(data)
}

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData)
    
    // Validate data structure
    if (data.tasks && Array.isArray(data.tasks)) {
      saveTasks(data.tasks)
    }
    
    if (data.projects && Array.isArray(data.projects)) {
      saveProjects(data.projects)
    }
    
    if (data.aiSettings) {
      saveAISettings(data.aiSettings)
    }
    
    if (data.themeMode) {
      saveThemeMode(data.themeMode as ThemeMode)
    }
    
    if (data.themeColor) {
      saveThemeColor(data.themeColor)
    }
    
    return true
  } catch (error) {
    console.error('Error importing data:', error)
    return false
  }
} 