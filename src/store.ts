import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, Task } from './types';

export type SortOption = 'priority-high' | 'priority-low' | 'due-date' | 'created-newest' | 'created-oldest' | 'alphabetical';
export type AIModeType = 'normal' | 'task';

interface Store {
  messages: Message[];
  tasks: Task[];
  sortOrder: SortOption;
  aiMode: AIModeType;
  addMessage: (message: Message) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  clearMessages: () => void;
  setSortOrder: (order: SortOption) => void;
  getSortedTasks: () => Task[];
  getTasksByDate: (dateFilter: string) => Task[];
  setAIMode: (mode: AIModeType) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      messages: [],
      tasks: [],
      sortOrder: 'due-date' as SortOption,
      aiMode: 'normal' as AIModeType,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      addTask: (task) =>
        set((state) => {
          console.log("Store: Adding task to state:", task);
          return {
            tasks: [...state.tasks, task],
          };
        }),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        })),
      clearMessages: () => 
        set(() => ({
          messages: [],
        })),
      setSortOrder: (order: SortOption) => 
        set(() => ({
          sortOrder: order
        })),
      getSortedTasks: () => {
        const { tasks, sortOrder } = get();
        const tasksCopy = [...tasks];

        switch (sortOrder) {
          case 'priority-high':
            // Sort by priority (high to low)
            return tasksCopy.sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            });
          
          case 'priority-low':
            // Sort by priority (low to high)
            return tasksCopy.sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
            });
          
          case 'due-date':
            // Sort by due date (closest first, null dates at the end)
            return tasksCopy.sort((a, b) => {
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
          
          case 'created-newest':
            // Sort by creation date (newest first)
            return tasksCopy.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          
          case 'created-oldest':
            // Sort by creation date (oldest first)
            return tasksCopy.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          
          case 'alphabetical':
            // Sort alphabetically by title
            return tasksCopy.sort((a, b) => a.title.localeCompare(b.title));
          
          default:
            return tasksCopy;
        }
      },
      setAIMode: (mode: AIModeType) => 
        set(() => ({
          aiMode: mode
        })),
      getTasksByDate: (dateFilter: string) => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Start on Monday
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End on Sunday
        
        // Date comparison helper (checks if the date is on the same day)
        const isSameDay = (date1: Date, date2: Date) => {
          return date1.getFullYear() === date2.getFullYear() &&
                 date1.getMonth() === date2.getMonth() &&
                 date1.getDate() === date2.getDate();
        };
        
        // Filter based on the date filter parameter
        switch (dateFilter.toLowerCase()) {
          case 'today':
            return tasks.filter(task => 
              task.dueDate && isSameDay(new Date(task.dueDate), today)
            );
            
          case 'tomorrow':
            return tasks.filter(task => 
              task.dueDate && isSameDay(new Date(task.dueDate), tomorrow)
            );
            
          case 'this week':
          case 'week':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              return taskDate >= weekStart && taskDate <= weekEnd;
            });
            
          case 'overdue':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              return taskDate < today && task.status !== 'done';
            });
            
          case 'upcoming':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              return taskDate >= today;
            });
            
          case 'no date':
          case 'undated':
            return tasks.filter(task => !task.dueDate);
            
          default:
            return tasks;
        }
      },
    }),
    {
      name: 'masternote-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 