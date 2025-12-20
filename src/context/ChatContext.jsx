
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const DEFAULT_SESSION = {
    id: 'default',
    title: 'New Chat',
    messages: [{ id: 1, role: 'ai', content: "I'm ready. Switch modes to create tasks or chat with me.", timestamp: 'Now' }],
    lastUpdated: Date.now(),
    folderId: null
};

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([DEFAULT_SESSION]);
    const [folders, setFolders] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState('default');
    const [chatFolderMap, setChatFolderMap] = useState({}); // { chatId: folderId }

    const isHydrated = useRef(false);

    // Initial Fetch
    useEffect(() => {
        if (!user) {
            setSessions([DEFAULT_SESSION]);
            setFolders([]);
            return;
        }

        const fetchChats = async () => {
            try {
                // Fetch chats
                const { data: chatsData, error: chatsError } = await supabase
                    .from('chats')
                    .select('*')
                    .order('updated_at', { ascending: false });

                if (chatsError) throw chatsError;

                // Fetch folders from settings
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('preferences')
                    .eq('user_id', user.id)
                    .single();

                const prefs = settingsData?.preferences || {};
                const loadedFolders = prefs.folders || [];
                const loadedMap = prefs.chatFolderMap || {};

                setFolders(loadedFolders);
                setChatFolderMap(loadedMap);

                // Map chats to session format
                const loadedSessions = chatsData.map(c => ({
                    id: c.id,
                    title: c.title || 'New Chat',
                    messages: c.messages || [],
                    model: c.model,
                    lastUpdated: new Date(c.updated_at).getTime(),
                    folderId: loadedMap[c.id] || null
                }));

                if (loadedSessions.length > 0) {
                    setSessions(loadedSessions);
                    // Retrieve last active session from prefs or default to first
                    const lastId = prefs.lastSessionId;
                    if (lastId && loadedSessions.find(s => s.id === lastId)) {
                        setCurrentSessionId(lastId);
                    } else {
                        setCurrentSessionId(loadedSessions[0].id);
                    }
                } else {
                    setSessions([DEFAULT_SESSION]); // Keep default locally until first save? Or empty.
                    // If empty, creating a new session might be better behavior.
                    // Let's create one immediately on server? 
                    // No, let's keep local default and save it when used.
                    // Actually, for consistency, let's just create one.
                    // await createSession() ? No, let's just leave it empty logic or local default.
                    // Using local default for now.
                    setCurrentSessionId('default');
                }

                isHydrated.current = true;
            } catch (error) {
                console.error("Error loading chats:", error);
            }
        };

        fetchChats();
    }, [user]);

    // Save current session ID preference
    useEffect(() => {
        if (!user || !isHydrated.current) return;
        // Debounce or just save on change?
        // Let's skip saving every switch to DB to avoid spam.
    }, [currentSessionId, user]);

    const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

    const saveFoldersAndMap = async (newFolders, newMap) => {
        if (!user) return;
        const { data } = await supabase.from('settings').select('preferences').eq('user_id', user.id).single();
        const currentPrefs = data?.preferences || {};
        await supabase.from('settings').upsert({
            user_id: user.id,
            preferences: {
                ...currentPrefs,
                folders: newFolders,
                chatFolderMap: newMap
            }
        });
    };

    const createSession = async (folderId = null) => {
        if (!user) {
            const newSession = {
                id: Date.now().toString(),
                title: 'New Chat',
                messages: [{ id: Date.now(), role: 'ai', content: "New session started.", timestamp: 'Now' }],
                lastUpdated: Date.now(),
                folderId: folderId || null
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            return;
        }

        const newMsg = { id: Date.now(), role: 'ai', content: "New session started.", timestamp: 'Now' };

        try {
            const { data, error } = await supabase.from('chats').insert([{
                user_id: user.id,
                title: 'New Chat',
                messages: [newMsg]
            }]).select().single();

            if (error) throw error;

            const newSession = {
                id: data.id,
                title: data.title,
                messages: data.messages,
                lastUpdated: new Date(data.created_at).getTime(),
                folderId: folderId
            };

            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);

            if (folderId) {
                const newMap = { ...chatFolderMap, [data.id]: folderId };
                setChatFolderMap(newMap);
                await saveFoldersAndMap(folders, newMap);
            }

        } catch (e) {
            console.error("Error creating session:", e);
        }
    };

    const switchSession = (id) => {
        setCurrentSessionId(id);
    };

    const deleteSession = async (id) => {
        // Determine the next session ID *before* state updates
        let nextId = currentSessionId;
        const remaining = sessions.filter(s => s.id !== id);

        if (remaining.length === 0) {
            // If deleting the last session, create a new default one
            const newSession = {
                ...DEFAULT_SESSION,
                id: Date.now().toString(),
                lastUpdated: Date.now()
            };
            setSessions([newSession]);
            nextId = newSession.id;
        } else {
            setSessions(remaining);
            if (currentSessionId === id) {
                // If we deleted the active session, switch to the first available one
                nextId = remaining[0].id;
            }
        }

        setCurrentSessionId(nextId);

        if (!user) return;

        // Remove from map
        if (chatFolderMap[id]) {
            const newMap = { ...chatFolderMap };
            delete newMap[id];
            setChatFolderMap(newMap); // Update local state immediately
            // We can try to save map, but maybe await to avoid race? 
            // The function implies fire-and-forget for map, wait for delete.
            await saveFoldersAndMap(folders, newMap);
        }

        await supabase.from('chats').delete().eq('id', id);
    };

    const renameSession = async (id, newTitle) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
        if (!user) return;
        await supabase.from('chats').update({ title: newTitle }).eq('id', id);
    };

    const clearSession = async (id) => {
        const clearedMessages = [];
        setSessions(prev => prev.map(s => s.id === id ? { ...s, messages: clearedMessages } : s));
        if (!user) return;
        await supabase.from('chats').update({ messages: clearedMessages }).eq('id', id);
    };

    const addMessageToSession = async (sessionId, message) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [...s.messages, message],
                    lastUpdated: Date.now()
                };
            }
            return s;
        }));

        if (!user) return;

        // DB update
        // Need to get current messages? Or rely on state?
        // State might be slightly ahead/behind logic, but for chats sync it's OK to use updated state
        // BUT `setSessions` is async. We can't use `s` from map directly easily outside.
        // Let's update DB with the new array.
        const session = sessions.find(s => s.id === sessionId);
        const newMessages = session ? [...session.messages, message] : [message];

        await supabase.from('chats').update({
            messages: newMessages,
            updated_at: new Date().toISOString()
        }).eq('id', sessionId);
    };

    // Updates an existing message in a session (for streaming)
    // Debounce this? Streaming updates happen fast.
    const updateMessage = (sessionId, messageId, newContent, extras = null) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                const newMessages = s.messages.map(m =>
                    m.id === messageId
                        ? { ...m, content: newContent !== null ? newContent : m.content, ...(extras || {}) }
                        : m
                );

                // We typically don't await DB on every char update. 
                // Only save when streaming is "done"? 
                // The caller typically doesn't signal "done" via this function explicitly.
                // But for now let's just update local state. Persistence might lag.
                // Actually, let's create a dedicated "saveSession" function that caller can call, 
                // OR just debounce the DB save. For now, to ensure correctness, I'll NOT save on every char.
                // I'll rely on the caller to call `saveAiResponse` or I should implement a debouncer here.

                return {
                    ...s,
                    messages: newMessages,
                    lastUpdated: Date.now()
                };
            }
            return s;
        }));
    };

    // Helper to force save (can be used by UI when streaming finishes)
    const persistSession = async (sessionId) => {
        if (!user) return;
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            await supabase.from('chats').update({
                messages: session.messages,
                updated_at: new Date().toISOString()
            }).eq('id', sessionId);
        }
    }

    // --- Folder Logic ---
    const addFolder = async (name) => {
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            createdAt: Date.now()
        };
        const newFolders = [...folders, newFolder];
        setFolders(newFolders);
        if (user) await saveFoldersAndMap(newFolders, chatFolderMap);
    };

    const deleteFolder = async (id) => {
        const newFolders = folders.filter(f => f.id !== id);

        // Reset sessions in that folder to null folder locally and in map
        const newMap = { ...chatFolderMap };
        Object.keys(newMap).forEach(k => {
            if (newMap[k] === id) delete newMap[k];
        });

        setFolders(newFolders);
        setChatFolderMap(newMap);
        setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));

        if (user) await saveFoldersAndMap(newFolders, newMap);
    };

    const renameFolder = async (id, newName) => {
        const newFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
        setFolders(newFolders);
        if (user) await saveFoldersAndMap(newFolders, chatFolderMap);
    };

    const moveSessionToFolder = async (sessionId, folderId) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, folderId } : s));
        const newMap = { ...chatFolderMap, [sessionId]: folderId };
        setChatFolderMap(newMap);
        if (user) await saveFoldersAndMap(folders, newMap);
    };

    return (
        <ChatContext.Provider value={{
            sessions,
            folders,
            currentSessionId,
            currentSession,
            createSession,
            switchSession,
            deleteSession,
            renameSession,
            clearSession,
            addMessageToSession,
            updateMessage,
            addFolder,
            deleteFolder,
            renameFolder,
            moveSessionToFolder,
            persistSession
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
