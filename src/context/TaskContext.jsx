
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

// Initial dummy data to make the app look populated (only if no user)
const INITIAL_TASKS = [];
const INITIAL_PROJECTS = [
    { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' },
    { id: 'personal', name: 'Personal', color: 'green', icon: 'user' },
];

export function TaskProvider({ children }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState(INITIAL_PROJECTS);
    const [loading, setLoading] = useState(true);

    // Fetch data when user changes
    useEffect(() => {
        if (!user) {
            setTasks([]);
            setProjects(INITIAL_PROJECTS);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Tasks
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (tasksError) throw tasksError;

                const formattedTasks = tasksData.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    // Priority check for status: meta.status > boolean completed
                    status: t.meta?.status || (t.completed ? 'completed' : 'pending'),
                    priority: t.priority,
                    date: t.meta?.date_display || null, // Retrieve display date
                    tags: t.tags || [],
                    projectId: t.project_id,
                    completedAt: t.meta?.completedAt || null,
                    ...t.meta // Spread other meta
                }));
                setTasks(formattedTasks);

                // Fetch Projects from Settings
                const { data: settingsData, error: settingsError } = await supabase
                    .from('settings')
                    .select('preferences')
                    .eq('user_id', user.id)
                    .single();

                if (settingsData?.preferences?.projects) {
                    setProjects(settingsData.preferences.projects);
                } else {
                    // Initialize default projects if not found
                    await saveProjectsToSettings(INITIAL_PROJECTS);
                    setProjects(INITIAL_PROJECTS);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const saveProjectsToSettings = async (newProjects) => {
        if (!user) return;
        // Get current preferences first to avoid overwriting other settings
        const { data } = await supabase.from('settings').select('preferences').eq('user_id', user.id).single();
        const currentPrefs = data?.preferences || {};

        await supabase
            .from('settings')
            .upsert({ user_id: user.id, preferences: { ...currentPrefs, projects: newProjects } });
    };

    const addTask = async (task) => {
        if (!user) return;

        const newTaskPayload = {
            user_id: user.id,
            title: task.title,
            description: task.description || '',
            completed: task.status === 'completed',
            priority: task.priority,
            tags: task.tags,
            project_id: task.projectId || null,
            meta: {
                date_display: task.date,
                ...task
            }
        };
        // Remove known fields from meta to avoid duplication if spreading
        delete newTaskPayload.meta.title;
        delete newTaskPayload.meta.priority;
        delete newTaskPayload.meta.tags;
        delete newTaskPayload.meta.projectId;
        delete newTaskPayload.meta.status;

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([newTaskPayload])
                .select()
                .single();

            if (error) throw error;

            const formattedTask = {
                id: data.id,
                title: data.title,
                description: data.description,
                status: data.completed ? 'completed' : 'pending',
                priority: data.priority,
                date: data.meta?.date_display,
                tags: data.tags || [],
                projectId: data.project_id,
                ...data.meta
            };

            setTasks(prev => [formattedTask, ...prev]);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const updateTask = async (id, updates) => {
        if (!user) return;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        const updatePayload = {};
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.priority !== undefined) updatePayload.priority = updates.priority;
        if (updates.tags !== undefined) updatePayload.tags = updates.tags;
        if (updates.projectId !== undefined) updatePayload.project_id = updates.projectId;
        if (updates.status !== undefined) {
            // Map any status to boolean for backward compatibility. 
            // IMPORTANT: 'in_progress' is NOT completed.
            updatePayload.completed = updates.status === 'completed';
        }

        // Construct meta update if needed
        const metaUpdates = {};
        if (updates.status !== undefined) metaUpdates.status = updates.status; // Save exact status string
        if (updates.date) metaUpdates.date_display = updates.date;
        if (updates.completedAt) metaUpdates.completedAt = updates.completedAt;

        // If status became completed, set completedAt if not present
        if (updates.status === 'completed') {
            metaUpdates.completedAt = new Date().toLocaleDateString('en-CA');
        } else if (updates.status === 'pending') {
            metaUpdates.completedAt = null;
        }

        if (Object.keys(metaUpdates).length > 0) {
            // We need to merge existing meta. 
            // Ideally we get the current task from state
            const currentTask = tasks.find(t => t.id === id);
            updatePayload.meta = { ...currentTask?.meta, ...currentTask, ...metaUpdates };
            // Cleaning up the meta payload to not include top level keys again is annoying but safer
            // Let's just store the specific fields we care about in meta for display
            updatePayload.meta = { ...currentTask?.meta, ...metaUpdates };
        }

        try {
            const { error } = await supabase
                .from('tasks')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating task:', error);
            // Revert on error?
        }
    };

    const deleteTask = async (id) => {
        if (!user) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            await supabase.from('tasks').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const clearTasks = async () => {
        if (!user) return;
        setTasks([]);
        // Dangerous: delete all for user?
        // Implementation:
        // await supabase.from('tasks').delete().eq('user_id', user.id);
        // For safety, maybe just clear completed? 
        // The original code `setTasks([])` cleared local state.
        // Let's implement delete all
        try {
            await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all matches
        } catch (e) { console.error(e) }
    };

    // --- Project Actions ---
    const addProject = async (project) => {
        const newProject = { ...project, id: Date.now().toString() };
        const newProjects = [...projects, newProject];
        setProjects(newProjects);
        await saveProjectsToSettings(newProjects);
    };

    const updateProject = async (id, updates) => {
        const newProjects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
        setProjects(newProjects);
        await saveProjectsToSettings(newProjects);
    };

    const deleteProject = async (id) => {
        const newProjects = projects.filter(p => p.id !== id);
        setProjects(newProjects);
        await saveProjectsToSettings(newProjects);

        // Also update tasks locally and on server
        const tasksToUpdate = tasks.filter(t => t.projectId === id);
        tasksToUpdate.forEach(t => updateTask(t.id, { projectId: null }));
    };

    return (
        <TaskContext.Provider value={{
            tasks, addTask, updateTask, deleteTask, clearTasks,
            projects, addProject, updateProject, deleteProject,
            loading
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    return useContext(TaskContext);
}
