import React, { createContext, useContext, useState, useEffect } from 'react';

const NotesContext = createContext();

const DEFAULT_PROJECTS = [
    { id: 'all', name: 'All Notes', color: 'bg-zinc-800' },
    { id: 'inbox', name: 'Inbox', color: 'bg-blue-500' },
    { id: 'personal', name: 'Personal', color: 'bg-green-500' },
    { id: 'work', name: 'Work', color: 'bg-purple-500' }
];

const DEFAULT_NOTE = {
    content: "Welcome to Bart Sticky Notes! 📝\n\nClick here to edit me.",
    projectId: 'inbox'
};

export function NotesProvider({ children }) {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('nexus_notes');
        return saved ? JSON.parse(saved) : [{ ...DEFAULT_NOTE, id: Date.now(), timestamp: Date.now() }];
    });

    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('nexus_projects');
        return saved ? JSON.parse(saved) : DEFAULT_PROJECTS.slice(1); // Exclude 'all' from saved list, we merge it dynamically or keep it separate
    });

    useEffect(() => {
        localStorage.setItem('nexus_notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('nexus_projects', JSON.stringify(projects));
    }, [projects]);

    const addNote = (projectId = 'inbox') => {
        const newNote = {
            id: Date.now(),
            content: '',
            projectId,
            timestamp: Date.now()
        };
        setNotes(prev => [newNote, ...prev]);
    };

    const updateNote = (id, updates) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, timestamp: Date.now() } : n));
    };

    const deleteNote = (id) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const addProject = (name, color) => {
        const newProject = {
            id: Date.now().toString(),
            name,
            color
        };
        setProjects(prev => [...prev, newProject]);
    };

    const deleteProject = (id) => {
        if (['inbox', 'personal', 'work'].includes(id)) return; // Prevent deleting defaults if desired
        setProjects(prev => prev.filter(p => p.id !== id));
        // Move notes to inbox? Or delete? Let's move to inbox for safety
        setNotes(prev => prev.map(n => n.projectId === id ? { ...n, projectId: 'inbox' } : n));
    };

    return (
        <NotesContext.Provider value={{
            notes,
            projects,
            addNote,
            updateNote,
            deleteNote,
            addProject,
            deleteProject
        }}>
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    return useContext(NotesContext);
}
