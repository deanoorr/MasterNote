import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Task, SubTask, AISuggestion, TaskPriority } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const getInitialState = (): TasksState => {
  const savedTasks = localStorage.getItem('tasks')
  return {
    tasks: savedTasks ? JSON.parse(savedTasks) : [],
    loading: false,
    error: null
  }
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: getInitialState(),
  reducers: {
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'position'>>) => {
      const newTask: Task = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        position: state.tasks.length
      }
      state.tasks.push(newTask)
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id)
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload }
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload)
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    toggleTaskCompleted: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(task => task.id === action.payload)
      if (task) {
        task.completed = !task.completed
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    },
    addSubtask: (state, action: PayloadAction<{ taskId: string; title: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId)
      if (task) {
        const newSubtask: SubTask = {
          id: uuidv4(),
          title: action.payload.title,
          completed: false
        }
        task.subtasks.push(newSubtask)
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    },
    updateSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string; title?: string; completed?: boolean }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId)
      if (task) {
        const subtask = task.subtasks.find(st => st.id === action.payload.subtaskId)
        if (subtask) {
          if (action.payload.title !== undefined) subtask.title = action.payload.title
          if (action.payload.completed !== undefined) subtask.completed = action.payload.completed
          localStorage.setItem('tasks', JSON.stringify(state.tasks))
        }
      }
    },
    deleteSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId)
      if (task) {
        task.subtasks = task.subtasks.filter(st => st.id !== action.payload.subtaskId)
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    },
    addAISuggestion: (state, action: PayloadAction<{ taskId: string; type: AISuggestion['type']; content: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId)
      if (task) {
        if (!task.aiSuggestions) task.aiSuggestions = []
        
        const newSuggestion: AISuggestion = {
          id: uuidv4(),
          type: action.payload.type,
          content: action.payload.content,
          applied: false,
          createdAt: new Date().toISOString()
        }
        
        task.aiSuggestions.push(newSuggestion)
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    },
    applyAISuggestion: (state, action: PayloadAction<{ taskId: string; suggestionId: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId)
      if (task && task.aiSuggestions) {
        const suggestion = task.aiSuggestions.find(s => s.id === action.payload.suggestionId)
        if (suggestion) {
          suggestion.applied = true
          
          // Apply the suggestion based on its type
          switch (suggestion.type) {
            case 'priority':
              if (Object.values(TaskPriority).includes(suggestion.content as TaskPriority)) {
                task.priority = suggestion.content as TaskPriority
              }
              break
            case 'category':
              // Add to task tags if it's a category suggestion
              if (!task.tags.includes(suggestion.content)) {
                task.tags.push(suggestion.content)
              }
              break
            case 'deadline':
              try {
                const date = new Date(suggestion.content)
                if (!isNaN(date.getTime())) {
                  task.dueDate = date.toISOString()
                }
              } catch (e) {
                // Invalid date format
              }
              break
          }
          
          localStorage.setItem('tasks', JSON.stringify(state.tasks))
        }
      }
    },
    reorderTasks: (state, action: PayloadAction<{ taskId: string; newPosition: number }>) => {
      const { taskId, newPosition } = action.payload
      const taskIndex = state.tasks.findIndex(t => t.id === taskId)
      
      if (taskIndex !== -1 && newPosition >= 0 && newPosition < state.tasks.length) {
        const task = state.tasks[taskIndex]
        const oldPosition = task.position
        
        // Remove the task from its current position
        state.tasks.splice(taskIndex, 1)
        
        // Insert the task at the new position
        state.tasks.splice(newPosition, 0, task)
        
        // Update positions for all tasks
        state.tasks.forEach((t, index) => {
          t.position = index
        })
        
        localStorage.setItem('tasks', JSON.stringify(state.tasks))
      }
    }
  }
})

export const { 
  addTask, 
  updateTask, 
  deleteTask, 
  toggleTaskCompleted, 
  addSubtask, 
  updateSubtask, 
  deleteSubtask,
  addAISuggestion,
  applyAISuggestion,
  reorderTasks
} = tasksSlice.actions

export default tasksSlice.reducer 