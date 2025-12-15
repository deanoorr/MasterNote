import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskContext = createContext();

// Initial dummy data to make the app look populated
const INITIAL_TASKS = [
    { id: 1, title: 'Finalize Q4 Report', tags: ['Work', 'Urgent'], date: 'Today', priority: 'High', status: 'pending' },
    { id: 2, title: 'Email Sarah re: Design Specs', tags: ['Work'], date: 'Tomorrow', priority: 'Medium', status: 'pending' },
    { id: 3, title: 'Book dentist appointment', tags: ['Personal'], date: 'Fri 24th', priority: 'Low', status: 'pending' },
];

export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);

    const addTask = (task) => {
        setTasks(prev => [{ ...task, id: Date.now(), status: 'pending' }, ...prev]);
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

    return (
        <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, clearTasks }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    return useContext(TaskContext);
}
