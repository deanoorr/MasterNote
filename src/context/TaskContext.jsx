import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext();

// Initial dummy data to make the app look populated
const INITIAL_TASKS = [
    { id: 1, title: 'Finalize Q4 Report', tags: ['Work', 'Urgent'], date: 'Today', priority: 'High', status: 'pending', projectId: 'work' },
    { id: 2, title: 'Email Sarah re: Design Specs', tags: ['Work'], date: 'Tomorrow', priority: 'Medium', status: 'pending', projectId: 'work' },
    { id: 3, title: 'Book dentist appointment', tags: ['Personal'], date: 'Fri 24th', priority: 'Low', status: 'pending', projectId: 'personal' },
];

const INITIAL_PROJECTS = [
    { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' },
    { id: 'personal', name: 'Personal', color: 'green', icon: 'user' },
];

export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('masternote_tasks');
        return saved ? JSON.parse(saved) : INITIAL_TASKS;
    });

    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('masternote_projects');
        return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    });

    useEffect(() => {
        localStorage.setItem('masternote_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('masternote_projects', JSON.stringify(projects));
    }, [projects]);

    const addTask = (task) => {
        setTasks(prev => [{ ...task, id: Date.now(), status: 'pending', projectId: task.projectId || null }, ...prev]);
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const clearTasks = () => {
        setTasks([]);
    };

    // --- Project Actions ---
    const addProject = (project) => {
        setProjects(prev => [...prev, { ...project, id: Date.now().toString() }]);
    };

    const updateProject = (id, updates) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = (id) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        // Optional: Also delete tasks in this project? Or move to inbox?
        // For now, let's keep them and set their projectId to null (move to Inbox)
        setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: null } : t));
    };

    return (
        <TaskContext.Provider value={{
            tasks, addTask, updateTask, deleteTask, clearTasks,
            projects, addProject, updateProject, deleteProject
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    return useContext(TaskContext);
}
