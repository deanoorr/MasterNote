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
    const [currentSessionId, setCurrentSessionId] = useState(() => {
        return localStorage.getItem('nexus_current_session_id') || 'default';
    });

    useEffect(() => {
        localStorage.setItem('nexus_sessions', JSON.stringify(sessions));
        localStorage.setItem('nexus_current_session_id', currentSessionId);
    }, [sessions, currentSessionId]);

    const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

    const createSession = () => {
        const newSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [{ id: Date.now(), role: 'ai', content: "New session started.", timestamp: 'Now' }],
            lastUpdated: Date.now()
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

    const clearSession = (id) => {
        setSessions(prev => prev.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    messages: [{ id: Date.now(), role: 'system', content: "Chat history cleared.", timestamp: 'Now' }]
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

    return (
        <ChatContext.Provider value={{
            sessions,
            currentSessionId,
            currentSession,
            createSession,
            switchSession,
            deleteSession,
            clearSession,
            addMessageToSession
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
