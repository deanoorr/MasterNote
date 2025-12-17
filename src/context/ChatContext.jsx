import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

const DEFAULT_SESSION = {
    id: 'default',
    title: 'New Chat',
    messages: [{ id: 1, role: 'ai', content: "I'm ready. Switch modes to create tasks or chat with me.", timestamp: 'Now' }],
    lastUpdated: Date.now()
};

export function ChatProvider({ children }) {
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('nexus_sessions');
        return saved ? JSON.parse(saved) : [DEFAULT_SESSION];
    });
    const [folders, setFolders] = useState(() => {
        const saved = localStorage.getItem('nexus_folders');
        return saved ? JSON.parse(saved) : [];
    });
    const [currentSessionId, setCurrentSessionId] = useState(() => {
        return localStorage.getItem('nexus_current_session_id') || 'default';
    });

    useEffect(() => {
        localStorage.setItem('nexus_sessions', JSON.stringify(sessions));
        localStorage.setItem('nexus_folders', JSON.stringify(folders));
        localStorage.setItem('nexus_current_session_id', currentSessionId);

        // Safety check: specific session ID might be stale
        if (!sessions.find(s => s.id === currentSessionId)) {
            setCurrentSessionId(sessions[0].id);
        }
    }, [sessions, folders, currentSessionId]);

    const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

    const createSession = (folderId = null) => {
        const newSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [{ id: Date.now(), role: 'ai', content: "New session started.", timestamp: 'Now' }],
            lastUpdated: Date.now(),
            folderId: folderId
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    const switchSession = (id) => {
        setCurrentSessionId(id);
    };

    const deleteSession = (id) => {
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            // If we deleted the current session, switch to the first available one
            if (id === currentSessionId && filtered.length > 0) {
                setCurrentSessionId(filtered[0].id);
            } else if (filtered.length === 0) {
                // Always keep at least one session
                return [DEFAULT_SESSION];
            }
            return filtered;
        });
    };

    const renameSession = (id, newTitle) => {
        setSessions(prev => prev.map(s =>
            s.id === id ? { ...s, title: newTitle } : s
        ));
    };

    const moveSessionToFolder = (sessionId, folderId) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, folderId } : s
        ));
    };

    const clearSession = (id) => {
        setSessions(prev => prev.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    messages: [{ id: Date.now(), role: 'ai', content: "Ready", timestamp: 'Now' }]
                };
            }
            return s;
        }));
    };

    const addMessageToSession = (sessionId, message) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                // Update title based on first user message if it's "New Chat"
                const newTitle = (s.title === 'New Chat' && message.role === 'user')
                    ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                    : s.title;

                return {
                    ...s,
                    title: newTitle,
                    messages: [...s.messages, message],
                    lastUpdated: Date.now()
                };
            }
            return s;
        }));
    };

    // Updates an existing message in a session (for streaming)
    const updateMessage = (sessionId, messageId, newContent, extras = null) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.map(m =>
                        m.id === messageId
                            ? { ...m, content: newContent !== null ? newContent : m.content, ...(extras || {}) }
                            : m
                    ),
                    lastUpdated: Date.now()
                };
            }
            return s;
        }));
    };

    // --- Folder Logic ---
    const addFolder = (name) => {
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            createdAt: Date.now()
        };
        setFolders(prev => [...prev, newFolder]);
    };

    const deleteFolder = (id) => {
        setFolders(prev => prev.filter(f => f.id !== id));
        // Reset sessions in that folder to null folder
        setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));
    };

    const renameFolder = (id, newName) => {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
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
            moveSessionToFolder
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
