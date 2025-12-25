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
    const sessionsRef = useRef(sessions);
    const currentSessionIdRef = useRef(currentSessionId);

    // Keep refs synced
    useEffect(() => {
        sessionsRef.current = sessions;
    }, [sessions]);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);


    // Initial Fetch (Local Storage for Chats, Supabase for Settings)
    useEffect(() => {
        const fetchData = async () => {
            console.log('DEBUG: fetchData (Local-Only Chats) running...');
            try {
                // 1. Load Chats from LocalStorage
                let loadedSessions = [];
                try {
                    const saved = localStorage.getItem('bart_chats_backup');
                    if (saved) {
                        loadedSessions = JSON.parse(saved);
                        // Ensure dates are parsed correctly if needed, or just trust the structure
                        // Sort by lastUpdated
                        loadedSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
                    }
                } catch (err) {
                    console.error('Error loading local chats:', err);
                }

                if (loadedSessions.length === 0) {
                    loadedSessions = [DEFAULT_SESSION];
                }

                setSessions(loadedSessions);

                // 2. Load Folders/Settings from Supabase (if user exists)
                // We keep this responsive to the user state for folder sync
                let loadedFolders = [];
                let loadedMap = {};

                if (user) {
                    try {
                        const { data: settingsData } = await supabase
                            .from('settings')
                            .select('preferences')
                            .eq('user_id', user.id)
                            .single();

                        const prefs = settingsData?.preferences || {};
                        loadedFolders = prefs.folders || [];
                        loadedMap = prefs.chatFolderMap || {};

                        // Check for saved lastSessionId
                        if (prefs.lastSessionId) {
                            // Verify it exists in our local sessions
                            if (loadedSessions.find(s => s.id === prefs.lastSessionId)) {
                                setCurrentSessionId(prefs.lastSessionId);
                            } else {
                                setCurrentSessionId(loadedSessions[0].id);
                            }
                        } else {
                            setCurrentSessionId(loadedSessions[0].id);
                        }

                    } catch (e) {
                        console.warn("Settings fetch failed, using defaults", e);
                        setCurrentSessionId(loadedSessions[0].id);
                    }
                } else {
                    // No user, just default to first session
                    setCurrentSessionId(loadedSessions[0].id);
                }

                setFolders(loadedFolders);
                setChatFolderMap(loadedMap);
                isHydrated.current = true;

            } catch (error) {
                console.error("Error initializing context:", error);
            }
        };

        fetchData();
    }, [user?.id]); // Re-run if user changes (mostly for settings)

    // Save Last Session ID Preference (Supabase)
    useEffect(() => {
        if (!user || !isHydrated.current || currentSessionId === 'default') return;

        const saveLastSession = async () => {
            // We only save the PREFERENCE of where they were, not the chats themselves.
            const { data } = await supabase.from('settings').select('preferences').eq('user_id', user.id).single();
            const currentPrefs = data?.preferences || {};
            if (currentPrefs.lastSessionId === currentSessionId) return;

            await supabase.from('settings').upsert({
                user_id: user.id,
                preferences: { ...currentPrefs, lastSessionId: currentSessionId }
            });
        };
        const timer = setTimeout(saveLastSession, 1000);
        return () => clearTimeout(timer);
    }, [currentSessionId, user]);


    // Helper: Save Sessions to LocalStorage
    const saveToLocalStorage = (newSessions) => {
        try {
            localStorage.setItem('bart_chats_backup', JSON.stringify(newSessions));
        } catch (e) {
            console.error("Failed to save chats locally:", e);
        }
    };

    const createSession = async (folderId = null) => {
        // purely local creation
        const newSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [{ id: Date.now(), role: 'ai', content: "New session started.", timestamp: 'Now' }],
            lastUpdated: Date.now(),
            folderId: folderId || null
        };

        setSessions(prev => {
            const updated = [newSession, ...prev];
            saveToLocalStorage(updated);
            return updated;
        });
        setCurrentSessionId(newSession.id);

        if (folderId && user) {
            const newMap = { ...chatFolderMap, [newSession.id]: folderId };
            setChatFolderMap(newMap);
            await saveFoldersAndMap(folders, newMap);
        }
    };

    const switchSession = (id) => {
        setCurrentSessionId(id);
    };

    const deleteSession = async (id) => {
        // Use ref to get latest state synchronously
        const currentSessions = sessionsRef.current;
        const remaining = currentSessions.filter(s => s.id !== id);

        let updatedSessions = [];
        let nextId = currentSessionId;

        if (remaining.length === 0) {
            const newDefault = { ...DEFAULT_SESSION, id: Date.now().toString(), lastUpdated: Date.now() };
            updatedSessions = [newDefault];
            nextId = newDefault.id;
        } else {
            updatedSessions = remaining;
            if (currentSessionId === id || currentSessionId === 'default' || !remaining.find(s => s.id === currentSessionId)) {
                nextId = remaining[0].id;
            }
        }

        setSessions(updatedSessions);
        saveToLocalStorage(updatedSessions);
        setCurrentSessionId(nextId);

        // Clean up folder map
        if (chatFolderMap[id]) {
            const newMap = { ...chatFolderMap };
            delete newMap[id];
            setChatFolderMap(newMap);
            if (user) await saveFoldersAndMap(folders, newMap);
        }
    };

    const renameSession = async (id, newTitle) => {
        setSessions(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, title: newTitle } : s);
            saveToLocalStorage(updated);
            return updated;
        });
        // NO Supabase update
    };

    const clearSession = async (id) => {
        setSessions(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, messages: [] } : s);
            saveToLocalStorage(updated);
            return updated;
        });
        // NO Supabase update
    };

    const addMessageToSession = async (sessionId, message) => {
        let activeSessionId = sessionId;

        // 1. Handle "default" session promotion -> Just make it a real local session
        if (activeSessionId === 'default') {
            const newId = Date.now().toString();
            const newSession = {
                id: newId,
                title: 'New Chat',
                messages: [message],
                lastUpdated: Date.now(),
                folderId: null
            };

            setSessions(prev => {
                const updated = prev.map(s => s.id === 'default' ? newSession : s);
                saveToLocalStorage(updated);
                return updated;
            });
            setCurrentSessionId(newId);
            return newId;
        }

        // 2. Standard Update (Existing Session)
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: [...s.messages, message],
                        lastUpdated: Date.now()
                    };
                }
                return s;
            });
            saveToLocalStorage(updated);
            return updated;
        });

        // NO Supabase Update
        return activeSessionId;
    };

    // Throttled saver to avoid hammering LocalStorage during streaming
    // WE MUST USE REFS to track pending data, otherwise the closure captures STALE data (the first chunk)
    const throttledSaveTimer = useRef(null);
    const pendingSaveData = useRef(null);

    const saveToLocalStorageThrottled = (newSessions) => {
        // Always update the pending data to the LATEST state
        pendingSaveData.current = newSessions;

        if (throttledSaveTimer.current) return;

        throttledSaveTimer.current = setTimeout(() => {
            if (pendingSaveData.current) {
                saveToLocalStorage(pendingSaveData.current);
                pendingSaveData.current = null;
            }
            throttledSaveTimer.current = null;
        }, 1000); // Save max once per second
    };

    const updateMessage = (sessionId, messageId, newContent, extras = null) => {
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id === sessionId) {
                    const newMessages = s.messages.map(m =>
                        m.id === messageId
                            ? { ...m, content: newContent !== null ? newContent : m.content, ...(extras || {}) }
                            : m
                    );
                    return { ...s, messages: newMessages, lastUpdated: Date.now() };
                }
                return s;
            });

            // Save periodically during stream
            saveToLocalStorageThrottled(updated);

            return updated;
        });
    };

    // Helper to force save (Called when streaming finishes)
    const persistSession = async (sessionId) => {
        // Trigger a save of the current state ref
        // We use the Ref ensuring we capture the latest state from updateMessage
        const session = sessionsRef.current.find(s => s.id === sessionId);
        if (session) {
            console.log(`DEBUG: Persisting messages count: ${session.messages.length}`);
            saveToLocalStorage(sessionsRef.current);
        }
    };

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

    // --- Folder Logic ---
    const addFolder = async (name) => {
        const newFolder = { id: 'folder_' + Date.now(), name: name, createdAt: Date.now() };
        const newFolders = [...folders, newFolder];
        setFolders(newFolders);
        if (user) await saveFoldersAndMap(newFolders, chatFolderMap);
    };

    const deleteFolder = async (id) => {
        const newFolders = folders.filter(f => f.id !== id);
        const newMap = { ...chatFolderMap };
        Object.keys(newMap).forEach(k => { if (newMap[k] === id) delete newMap[k]; });

        setFolders(newFolders);
        setChatFolderMap(newMap);
        setSessions(prev => {
            const updated = prev.map(s => s.folderId === id ? { ...s, folderId: null } : s);
            saveToLocalStorage(updated);
            return updated;
        });

        if (user) await saveFoldersAndMap(newFolders, newMap);
    };

    const renameFolder = async (id, newName) => {
        const newFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
        setFolders(newFolders);
        if (user) await saveFoldersAndMap(newFolders, chatFolderMap);
    };

    const moveSessionToFolder = async (sessionId, folderId) => {
        setSessions(prev => {
            const updated = prev.map(s => s.id === sessionId ? { ...s, folderId } : s);
            saveToLocalStorage(updated);
            return updated;
        });
        const newMap = { ...chatFolderMap, [sessionId]: folderId };
        setChatFolderMap(newMap);
        if (user) await saveFoldersAndMap(folders, newMap);
    };

    return (
        <ChatContext.Provider value={{
            sessions,
            folders,
            currentSessionId,
            currentSession: sessions.find(s => s.id === currentSessionId) || sessions[0] || DEFAULT_SESSION,
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
