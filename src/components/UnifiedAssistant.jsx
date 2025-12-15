import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Trash2, Zap, MessageSquare, ArrowUp, Command, Bot, User, StopCircle, PanelLeft } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import ModelSelector from './ModelSelector';
import { useTasks } from '../context/TaskContext';
import { useChat } from '../context/ChatContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize clients helper
const initializeClients = () => {
    const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    return {
        genAI: googleKey ? new GoogleGenerativeAI(googleKey) : null,
        openai: openaiKey ? new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true }) : null,
        missingKeys: {
            google: !googleKey,
            openai: !openaiKey
        }
    };
};

export default function UnifiedAssistant() {
    const [mode, setMode] = useState('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Lazy init clients
    const clientsRef = useRef(initializeClients());

    // Auto-scroll ref
    const scrollRef = useRef(null);

    // Contexts
    const { selectedModel } = useModel();
    const { addTask, tasks, updateTask, deleteTask, clearTasks } = useTasks();
    const {
        sessions,
        currentSessionId,
        currentSession,
        createSession,
        switchSession,
        deleteSession,
        clearSession,
        addMessageToSession
    } = useChat();

    // Scroll to bottom effect
    useEffect(() => {
        if (scrollRef.current && currentSession?.messages) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentSession?.messages, isProcessing]);

    if (!currentSession) {
        return <div className="flex h-full w-full items-center justify-center text-zinc-500">Loading...</div>;
    }

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        setInput('');
        setIsProcessing(true);

        // --- 1. Chat Mode ---
        if (mode === 'chat') {
            const userMsg = { id: Date.now(), role: 'user', content: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            addMessageToSession(currentSessionId, userMsg);

            let responseContent = "";
            try {
                if (selectedModel.provider === 'google') {
                    if (!clientsRef.current.genAI) throw new Error("Google API Key missing");
                    const model = clientsRef.current.genAI.getGenerativeModel({
                        model: selectedModel.id,
                        tools: [{ googleSearch: {} }] // Keep internet access
                    });
                    const result = await model.generateContent(userText);
                    const response = await result.response;
                    responseContent = response.text();

                    if (response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent) {
                        responseContent += "\n\n**Sources Found**";
                    }

                } else if (selectedModel.provider === 'openai') {
                    if (!clientsRef.current.openai) throw new Error("OpenAI API Key missing");
                    const completion = await clientsRef.current.openai.chat.completions.create({
                        messages: [{ role: "system", content: "You are MasterNote AI." }, ...currentSession.messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })), { role: "user", content: userText }],
                        model: "gpt-4o",
                    });
                    responseContent = completion.choices[0].message.content;
                }
            } catch (error) {
                responseContent = `Error: ${error.message}`;
            }

            addMessageToSession(currentSessionId, {
                id: Date.now() + 1,
                role: 'ai',
                content: responseContent,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }

        // --- 2. Agent Mode ---
        else {
            addMessageToSession(currentSessionId, { id: Date.now(), role: 'system', content: `Command: "${userText}"`, timestamp: 'System' });

            try {
                if (!clientsRef.current.genAI) throw new Error("Google API Key missing for Agent mode");
                const model = clientsRef.current.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const taskContextJSON = JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title })));
                const prompt = `
          Current Date: ${new Date().toLocaleDateString()}
          Tasks: ${taskContextJSON}
          User Request: "${userText}"
          Analyze and return JSON: { "action": "create"|"update"|"delete"|"clear"|"invalid", "taskData": {...}, "targetId": "ID" or "all", "reason": "..." }
        `;

                const result = await model.generateContent(prompt);
                const text = (await result.response).text().replace(/```json|```/g, '').trim();
                const actionData = JSON.parse(text);

                if (actionData.action === 'create') {
                    addTask({ title: actionData.taskData.title || userText, tags: ['New'], date: 'Upcoming', priority: 'Medium' });
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Created: ${actionData.taskData.title}`, isSuccess: true });
                } else if (actionData.action === 'update') {
                    if (actionData.targetId === 'all') {
                        tasks.forEach(t => updateTask(t.id, actionData.taskData));
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Updated all tasks.`, isSuccess: true });
                    } else {
                        updateTask(actionData.targetId, actionData.taskData);
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Updated task.`, isSuccess: true });
                    }
                } else if (actionData.action === 'delete') {
                    if (actionData.targetId === 'all') {
                        clearTasks();
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Deleted all tasks.`, isSuccess: true });
                    } else {
                        deleteTask(actionData.targetId);
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Deleted task.`, isSuccess: true });
                    }
                } else if (actionData.action === 'clear') {
                    clearTasks();
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Cleared all tasks.`, isSuccess: true });
                } else if (actionData.action === 'invalid') {
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Please switch to Chat Mode.` });
                } else {
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Unknown action: ${actionData.action}`, isSuccess: false });
                }
            } catch (error) {
                console.error("AI Action Error:", error);
                addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Error executing command: ${error.message}` });
            }
        }
        setIsProcessing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full w-full bg-background font-sans text-white">

            {/* --- Left Sidebar: History --- */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-r border-zinc-900 bg-[#09090b] flex flex-col shrink-0 overflow-hidden"
                    >
                        <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-400">History</span>
                            <button
                                onClick={() => createSession()}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                title="New Chat"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => switchSession(session.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all truncate flex items-center justify-between group ${currentSessionId === session.id
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                                        }`}
                                >
                                    <span className="truncate">{session.title}</span>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={12} />
                                    </div>
                                </button>
                            ))}
                            {sessions.length === 0 && (
                                <div className="text-center text-xs text-zinc-600 mt-4">No history</div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* --- Main Chat Area --- */}
            <main className="flex-1 flex flex-col relative bg-background">

                {/* Header: Mode & Model */}
                <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors ${!isSidebarOpen ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            <PanelLeft size={18} />
                        </button>

                        <div className="flex bg-zinc-900 p-1 rounded-lg">
                            <button
                                onClick={() => setMode('chat')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'chat' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Chat
                            </button>
                            <button
                                onClick={() => setMode('agent')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'agent' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Agent
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModelSelector />
                        <button onClick={() => clearSession(currentSessionId)} className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1">
                            <Trash2 size={14} /> Clear
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6" ref={scrollRef}>
                    <div className="max-w-3xl mx-auto space-y-8 pb-4">
                        {currentSession.messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 text-zinc-500">
                                    <Bot size={24} />
                                </div>
                                <p className="text-zinc-500 text-sm">Start a conversation using {selectedModel.name}</p>
                            </div>
                        )}

                        {currentSession.messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role !== 'user' && (
                                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                                        {msg.role === 'system' ? <Command size={14} className="text-zinc-400" /> : <Bot size={16} className="text-white" />}
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'space-y-1' : ''}`}>
                                    <div className={`text-sm leading-7 ${msg.role === 'user'
                                        ? 'bg-zinc-800 text-zinc-100 px-4 py-2 rounded-2xl rounded-tr-sm border border-zinc-700'
                                        : msg.role === 'system'
                                            ? 'font-mono text-xs text-zinc-500 py-2'
                                            : 'text-zinc-300'
                                        }`}>
                                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                    </div>
                                    {msg.role === 'user' && <div className="text-[10px] text-zinc-600 text-right pr-1">{msg.timestamp}</div>}
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/0 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />
                        <div className="bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-600 rounded-xl flex items-end p-2 transition-colors overflow-hidden">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={mode === 'chat' ? "Message MasterNote..." : "Enter a task Command..."}
                                className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm px-3 py-3 w-full resize-none max-h-40"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input}
                                className={`p-2 rounded-lg mb-1 transition-all ${input.trim() ? 'bg-white text-black' : 'bg-transparent text-zinc-600'
                                    }`}
                            >
                                <ArrowUp size={18} />
                            </button>
                        </div>
                        <div className="text-center mt-2 text-[10px] text-zinc-700">
                            MasterNote may display inaccurate info, including about people, so double-check its responses.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
