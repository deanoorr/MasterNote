import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, Task } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export type SortOption = 'priority-high' | 'priority-low' | 'due-date' | 'created-newest' | 'created-oldest' | 'alphabetical';

interface Store {
  messages: Message[];
  tasks: Task[];
  sortOrder: SortOption;
  userId: string | null;
  setUserId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (filter: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  deleteCompletedTasks: () => void;
  clearMessages: () => void;
  setSortOrder: (order: SortOption) => void;
  getSortedTasks: () => Task[];
  getTasksByDate: (dateFilter: string) => Task[];
  syncWithSupabase: () => Promise<void>;
}

// Custom storage for handling both localStorage and Supabase
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  }
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      messages: [],
      tasks: [],
      sortOrder: 'due-date' as SortOption,
      userId: null,
      
      setUserId: (id: string | null) => set({ userId: id }),
      
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
        
      addTask: (task) =>
        set((state) => {
          console.log("Store: Adding task to state:", task);
          
          // Ensure the task title is cleaned of any leading numbers (like "1. ", "2.", etc.)
          const cleanedTask = {
            ...task,
            title: task.title.replace(/^\d+\.\s*/, '')
          };
          
          // Store in Supabase if configured
          const userId = get().userId;
          if (isSupabaseConfigured() && userId) {
            supabase.from('tasks').upsert({
              id: cleanedTask.id,
              user_id: userId,
              title: cleanedTask.title,
              description: cleanedTask.description || '',
              priority: cleanedTask.priority,
              status: cleanedTask.status,
              due_date: cleanedTask.dueDate ? new Date(cleanedTask.dueDate).toISOString() : null,
              created_at: new Date(cleanedTask.createdAt).toISOString(),
              updated_at: new Date(cleanedTask.updatedAt).toISOString(),
              ai_generated: cleanedTask.aiGenerated || false,
              notes: cleanedTask.notes || ''
            })
            .then(({ error }) => {
              if (error) console.error("Error storing task in Supabase:", error);
            });
          }
          
          return {
            tasks: [...state.tasks, cleanedTask],
          };
        }),
        
      updateTask: (taskId, updates) =>
        set((state) => {
          console.log("Updating task", taskId, "with updates:", updates);
          
          const updatedTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
          );
          
          // Find the updated task
          const updatedTask = updatedTasks.find(task => task.id === taskId);
          console.log("Updated task:", updatedTask);
          
          // Store in Supabase if configured
          const userId = get().userId;
          if (isSupabaseConfigured() && userId && updatedTask) {
            const dueDateForDB = updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString() : null;
            console.log("Saving to Supabase with due_date:", dueDateForDB);
            
            supabase.from('tasks').upsert({
              id: updatedTask.id,
              user_id: userId,
              title: updatedTask.title,
              description: updatedTask.description || '',
              priority: updatedTask.priority,
              status: updatedTask.status,
              due_date: dueDateForDB,
              updated_at: new Date().toISOString(),
              ai_generated: updatedTask.aiGenerated || false,
              notes: updatedTask.notes || ''
            })
            .then(({ error, data }) => {
              if (error) {
                console.error("Error updating task in Supabase:", error);
              } else {
                console.log("Supabase update successful:", data);
              }
            });
          }
          
          return {
            tasks: updatedTasks,
          };
        }),
        
      deleteTask: (taskId) =>
        set((state) => {
          // Store in Supabase if configured
          const userId = get().userId;
          if (isSupabaseConfigured() && userId) {
            supabase.from('tasks')
              .delete()
              .eq('id', taskId)
              .eq('user_id', userId)
              .then(({ error }) => {
                if (error) console.error("Error deleting task in Supabase:", error);
              });
          }
          
          return {
            tasks: state.tasks.filter((task) => task.id !== taskId),
          };
        }),
        
      deleteCompletedTasks: () =>
        set((state) => {
          // Delete completed tasks in Supabase if configured
          const userId = get().userId;
          const completedTaskIds = state.tasks
            .filter(task => task.status === 'done')
            .map(task => task.id);
            
          if (isSupabaseConfigured() && userId && completedTaskIds.length > 0) {
            supabase.from('tasks')
              .delete()
              .eq('user_id', userId)
              .in('id', completedTaskIds)
              .then(({ error }) => {
                if (error) console.error("Error deleting completed tasks in Supabase:", error);
              });
          }
          
          return {
            tasks: state.tasks.filter((task) => task.status !== 'done'),
          };
        }),
        
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
      
      getTasksByDate: (dateFilter: string) => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        switch (dateFilter.toLowerCase()) {
          case 'today':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate.getTime() === today.getTime();
            });
            
          case 'tomorrow':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate.getTime() === tomorrow.getTime();
            });
            
          case 'this week':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate >= today && taskDate < nextWeek;
            });
            
          case 'overdue':
            return tasks.filter(task => {
              if (!task.dueDate) return false;
              const taskDate = new Date(task.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate < today && task.status !== 'done';
            });
            
          case 'completed':
            return tasks.filter(task => task.status === 'done');
            
          case 'no date':
          case 'undated':
            return tasks.filter(task => !task.dueDate);
            
          default:
            return tasks;
        }
      },
      
      syncWithSupabase: async () => {
        const userId = get().userId;
        if (!isSupabaseConfigured() || !userId) return;
        
        try {
          console.log("Syncing with Supabase...");
          // Get current local tasks
          const currentTasks = get().tasks;
          
          // Fetch tasks from Supabase
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
            
          if (tasksError) throw tasksError;
          
          if (tasksData) {
            console.log("Received tasks from Supabase:", tasksData.length);
            
            const formattedTasks: Task[] = tasksData.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description || '',
              priority: task.priority as 'low' | 'medium' | 'high',
              status: task.status as 'todo' | 'in_progress' | 'done',
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              createdAt: new Date(task.created_at),
              updatedAt: new Date(task.updated_at),
              aiGenerated: task.ai_generated || false,
              notes: task.notes || ''
            }));
            
            // Check if we have any tasks that were recently modified locally (especially status changes)
            // Use a 10-second threshold to consider a task "recently modified"
            const tenSecondsAgo = new Date(Date.now() - 10000);
            const recentlyModifiedTasks = currentTasks.filter(task => 
              task.updatedAt && new Date(task.updatedAt) > tenSecondsAgo
            );
            
            if (recentlyModifiedTasks.length > 0) {
              console.log(`Found ${recentlyModifiedTasks.length} recently modified tasks - prioritizing local state`);
              
              // Push these changes to Supabase instead of pulling
              for (const localTask of recentlyModifiedTasks) {
                console.log(`Updating Supabase with local task ${localTask.id} (status: ${localTask.status})`);
                
                await supabase.from('tasks').upsert({
                  id: localTask.id,
                  user_id: userId,
                  title: localTask.title,
                  description: localTask.description || '',
                  priority: localTask.priority,
                  status: localTask.status,
                  due_date: localTask.dueDate ? new Date(localTask.dueDate).toISOString() : null,
                  updated_at: new Date(localTask.updatedAt).toISOString(),
                  ai_generated: localTask.aiGenerated || false,
                  notes: localTask.notes || ''
                });
              }
            }
            
            // Merge tasks, preferring local tasks that have been updated more recently
            const mergedTasks = formattedTasks.map(remoteTask => {
              const localTask = currentTasks.find(t => t.id === remoteTask.id);
              if (!localTask) return remoteTask;
              
              // Always prefer local task status if it was modified in the last 10 seconds
              if (localTask.updatedAt && new Date(localTask.updatedAt) > tenSecondsAgo) {
                console.log(`Task ${localTask.id} was recently modified locally, keeping local version`);
                return localTask;
              }
              
              // For older modifications, compare timestamps
              if (localTask.updatedAt && remoteTask.updatedAt && 
                  new Date(localTask.updatedAt) > new Date(remoteTask.updatedAt)) {
                console.log(`Task ${localTask.id} has more recent local changes, keeping local version`);
                return localTask;
              }
              
              return remoteTask;
            });
            
            // Add any local tasks that don't exist in remote
            currentTasks.forEach(localTask => {
              if (!mergedTasks.some(t => t.id === localTask.id)) {
                console.log(`Adding local-only task ${localTask.id} to merged tasks`);
                mergedTasks.push(localTask);
              }
            });
            
            console.log(`Merged ${mergedTasks.length} tasks (${currentTasks.length} local, ${formattedTasks.length} remote)`);
            
            // Update the store with merged tasks
            set({ tasks: mergedTasks });
          }
        } catch (error) {
          console.error('Error syncing with Supabase:', error);
        }
      },
      
      bulkUpdateTasks: (filter: string, updates: Partial<Task>) =>
        set((state) => {
          let tasksToUpdate: Task[] = [];
          
          // Find tasks matching the filter
          if (filter === 'all') {
            tasksToUpdate = state.tasks;
          } else if (['today', 'tomorrow', 'this week', 'overdue', 'completed', 'no date', 'undated'].includes(filter)) {
            tasksToUpdate = get().getTasksByDate(filter);
          } else if (['high', 'medium', 'low'].includes(filter)) {
            tasksToUpdate = state.tasks.filter(task => task.priority === filter);
          }
          
          console.log(`Bulk updating ${tasksToUpdate.length} tasks matching filter "${filter}"`);
          
          // Apply updates to all matching tasks
          const updatedTasks = state.tasks.map((task) => {
            if (tasksToUpdate.some(t => t.id === task.id)) {
              const updatedTask = { ...task, ...updates, updatedAt: new Date() };
              
              // Store in Supabase if configured
              const userId = get().userId;
              if (isSupabaseConfigured() && userId) {
                supabase.from('tasks').upsert({
                  id: updatedTask.id,
                  user_id: userId,
                  title: updatedTask.title,
                  description: updatedTask.description || '',
                  priority: updatedTask.priority,
                  status: updatedTask.status,
                  due_date: updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString() : null,
                  updated_at: new Date().toISOString(),
                  ai_generated: updatedTask.aiGenerated || false,
                  notes: updatedTask.notes || ''
                })
                .then(({ error }) => {
                  if (error) console.error("Error updating task in Supabase:", error);
                });
              }
              
              return updatedTask;
            }
            return task;
          });
          
          return {
            tasks: updatedTasks,
          };
        }),
    }),
    {
      name: 'masternote-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
); 