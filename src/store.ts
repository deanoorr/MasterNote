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
            // Add a retry mechanism for Supabase updates
            const saveToSupabase = async (retries = 3) => {
              try {
                const { error, data } = await supabase.from('tasks').upsert({
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
                });
                
                if (error) {
                  console.error("Error storing task in Supabase:", error);
                  if (retries > 0) {
                    console.log(`Retrying Supabase add, ${retries} attempts left`);
                    setTimeout(() => saveToSupabase(retries - 1), 1000);
                  }
                } else {
                  console.log("Task successfully added to Supabase:", data);
                }
              } catch (err) {
                console.error("Exception during Supabase add:", err);
                if (retries > 0) {
                  console.log(`Retrying after exception, ${retries} attempts left`);
                  setTimeout(() => saveToSupabase(retries - 1), 1000);
                }
              }
            };
            
            // Start the save process
            saveToSupabase();
          }
          
          return {
            tasks: [...state.tasks, cleanedTask],
          };
        }),
        
      updateTask: (taskId, updates) =>
        set((state) => {
          console.log("Updating task", taskId, "with updates:", updates);
          
          // Always include the updated timestamp
          const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date()
          };
          
          const updatedTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updatesWithTimestamp } : task
          );
          
          // Find the updated task
          const updatedTask = updatedTasks.find(task => task.id === taskId);
          console.log("Updated task:", updatedTask);
          
          // Store in Supabase if configured
          const userId = get().userId;
          if (isSupabaseConfigured() && userId && updatedTask) {
            const dueDateForDB = updatedTask.dueDate ? new Date(updatedTask.dueDate).toISOString() : null;
            console.log("Saving to Supabase with due_date:", dueDateForDB);
            
            // Add a retry mechanism for Supabase updates
            const saveToSupabase = async (retries = 3) => {
              try {
                const { error, data } = await supabase.from('tasks').upsert({
                  id: updatedTask.id,
                  user_id: userId,
                  title: updatedTask.title,
                  description: updatedTask.description || '',
                  priority: updatedTask.priority,
                  status: updatedTask.status,
                  due_date: dueDateForDB,
                  updated_at: new Date().toISOString(),
                  created_at: updatedTask.createdAt ? new Date(updatedTask.createdAt).toISOString() : new Date().toISOString(),
                  ai_generated: updatedTask.aiGenerated || false,
                  notes: updatedTask.notes || ''
                });
                
                if (error) {
                  console.error("Error updating task in Supabase:", error);
                  if (retries > 0) {
                    console.log(`Retrying Supabase update, ${retries} attempts left`);
                    setTimeout(() => saveToSupabase(retries - 1), 1000);
                  }
                } else {
                  console.log("Supabase update successful:", data);
                }
              } catch (err) {
                console.error("Exception during Supabase update:", err);
                if (retries > 0) {
                  console.log(`Retrying after exception, ${retries} attempts left`);
                  setTimeout(() => saveToSupabase(retries - 1), 1000);
                }
              }
            };
            
            // Start the save process
            saveToSupabase();
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
          console.log("Syncing with Supabase for user:", userId);
          // Get current local tasks
          const currentTasks = get().tasks;
          console.log("Current local tasks:", currentTasks.length);
          
          // Fetch tasks from Supabase
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
            
          if (tasksError) throw tasksError;
          
          if (tasksData) {
            console.log("Received tasks from Supabase:", tasksData.length);
            
            // Convert from Supabase format to app format
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
            
            // STEP 1: Check for recently modified local tasks (within the last 5 minutes)
            // and push them to Supabase to ensure they're available to other browsers
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentlyModifiedTasks = currentTasks.filter(task => 
              task.updatedAt && new Date(task.updatedAt) > fiveMinutesAgo
            );
            
            if (recentlyModifiedTasks.length > 0) {
              console.log(`Pushing ${recentlyModifiedTasks.length} recently modified tasks to Supabase`);
              
              for (const localTask of recentlyModifiedTasks) {
                console.log(`Pushing local task "${localTask.title}" to Supabase`);
                
                // Update Supabase with the local task
                await supabase.from('tasks').upsert({
                  id: localTask.id,
                  user_id: userId,
                  title: localTask.title,
                  description: localTask.description || '',
                  priority: localTask.priority,
                  status: localTask.status,
                  due_date: localTask.dueDate ? new Date(localTask.dueDate).toISOString() : null,
                  updated_at: new Date(localTask.updatedAt).toISOString(),
                  created_at: new Date(localTask.createdAt).toISOString(),
                  ai_generated: localTask.aiGenerated || false,
                  notes: localTask.notes || ''
                });
              }
            }
            
            // STEP 2: Create a merged task list
            // For each remote task, check if it exists locally
            const mergedTasks: Task[] = [];
            const processedIds = new Set<string>();
            
            // Process Supabase tasks
            for (const remoteTask of formattedTasks) {
              processedIds.add(remoteTask.id);
              const localTask = currentTasks.find(t => t.id === remoteTask.id);
              
              if (!localTask) {
                // Task only exists in Supabase, add it
                console.log(`Adding remote-only task "${remoteTask.title}" to local store`);
                mergedTasks.push(remoteTask);
              } else {
                // Task exists in both places, use the most recently updated one
                const localUpdateTime = new Date(localTask.updatedAt).getTime();
                const remoteUpdateTime = new Date(remoteTask.updatedAt).getTime();
                
                if (localUpdateTime > remoteUpdateTime) {
                  console.log(`Task "${localTask.title}" more recent locally, keeping local version`);
                  mergedTasks.push(localTask);
                } else {
                  console.log(`Task "${remoteTask.title}" more recent in Supabase, using remote version`);
                  mergedTasks.push(remoteTask);
                }
              }
            }
            
            // Process local-only tasks (not in Supabase)
            for (const localTask of currentTasks) {
              if (!processedIds.has(localTask.id)) {
                console.log(`Adding local-only task "${localTask.title}" to merged list`);
                mergedTasks.push(localTask);
                
                // Also push to Supabase so other browsers can see it
                await supabase.from('tasks').upsert({
                  id: localTask.id,
                  user_id: userId,
                  title: localTask.title,
                  description: localTask.description || '',
                  priority: localTask.priority,
                  status: localTask.status,
                  due_date: localTask.dueDate ? new Date(localTask.dueDate).toISOString() : null,
                  updated_at: new Date(localTask.updatedAt).toISOString(),
                  created_at: new Date(localTask.createdAt).toISOString(),
                  ai_generated: localTask.aiGenerated || false,
                  notes: localTask.notes || ''
                });
              }
            }
            
            console.log(`Final merged task list contains ${mergedTasks.length} tasks`);
            
            // STEP 3: Update the local store with the merged tasks
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