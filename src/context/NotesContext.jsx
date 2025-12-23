
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

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
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [projects, setProjects] = useState(DEFAULT_PROJECTS.slice(1));

    useEffect(() => {
        if (!user) {
            setNotes([]);
            setProjects(DEFAULT_PROJECTS.slice(1));
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Notes
                const { data: notesData, error } = await supabase
                    .from('notes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setNotes(notesData.map(n => ({
                    id: n.id,
                    content: n.content,
                    projectId: n.folder || 'inbox',
                    timestamp: new Date(n.updated_at).getTime()
                })));

                // Fetch Projects from Settings
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('preferences')
                    .eq('user_id', user.id)
                    .single();

                const loadedProjects = settingsData?.preferences?.noteProjects;
                if (loadedProjects) {
                    setProjects(loadedProjects);
                } else {
                    await saveProjectsToSettings(DEFAULT_PROJECTS.slice(1));
                    setProjects(DEFAULT_PROJECTS.slice(1));
                }

            } catch (error) {
                console.error('Error fetching notes:', error);
            }
        };

        fetchData();
    }, [user]);

    const saveProjectsToSettings = async (newProjects) => {
        if (!user) return;
        const { data } = await supabase.from('settings').select('preferences').eq('user_id', user.id).single();
        const currentPrefs = data?.preferences || {};
        await supabase.from('settings').upsert({
            user_id: user.id,
            preferences: { ...currentPrefs, noteProjects: newProjects }
        });
    };

    const addNote = async (projectId = 'inbox', content = '') => {
        if (!user) return;

        try {
            const { data, error } = await supabase.from('notes').insert([{
                user_id: user.id,
                content: content,
                folder: projectId,
                title: 'New Note' // Default title
            }]).select().single();

            if (error) throw error;

            const newNote = {
                id: data.id,
                content: data.content,
                projectId: data.folder,
                timestamp: new Date(data.created_at).getTime()
            };
            setNotes(prev => [newNote, ...prev]);
            return newNote;
        } catch (error) {
            console.error('Error adding note:', error);
            return null;
        }
    };

    const updateNote = async (id, updates) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, timestamp: Date.now() } : n));

        if (!user) return;

        try {
            const payload = {};
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.projectId !== undefined) payload.folder = updates.projectId;
            payload.updated_at = new Date().toISOString();

            await supabase.from('notes').update(payload).eq('id', id);
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const deleteNote = async (id) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (!user) return;
        await supabase.from('notes').delete().eq('id', id);
    };

    const addProject = async (name, color) => {
        const newProject = {
            id: Date.now().toString(),
            name,
            color
        };
        const newProjects = [...projects, newProject];
        setProjects(newProjects);
        await saveProjectsToSettings(newProjects);
    };

    const deleteProject = async (id) => {
        if (['inbox', 'personal', 'work'].includes(id)) return;
        const newProjects = projects.filter(p => p.id !== id);
        setProjects(newProjects);

        // Move notes to inbox locally and remotely
        setNotes(prev => prev.map(n => n.projectId === id ? { ...n, projectId: 'inbox' } : n));

        if (!user) return;
        await saveProjectsToSettings(newProjects);
        // Batch update notes?
        await supabase.from('notes').update({ folder: 'inbox' }).eq('folder', id);
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
