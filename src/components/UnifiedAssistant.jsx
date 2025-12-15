import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { Send, Plus, Trash2, Zap, MessageSquare, ArrowUp, Command, Bot, User, StopCircle, PanelLeft } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import ModelSelector from './ModelSelector';
import { useTasks } from '../context/TaskContext';
import { useChat } from '../context/ChatContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
// Enhanced Custom Markdown Parser
const FormattedMessage = ({ content }) => {
    if (!content) return null;

    // 1. Split by Code Blocks (```language ... ```)
    const parts = content.split(/```(\w*)\n([\s\S]*?)```/g);

    return (
        <div className="space-y-2 text-sm leading-6">
            {parts.map((part, index) => {
                // Formatting for Code Blocks (odd indices in split result)
                if (index % 3 === 1) { // language
                    // skip, handled in next iteration or merged?
                    // actually split with capturing groups returns: [text, lang, code, text, lang, code...]
                    return null;
                }
                if (index % 3 === 2) { // code content
                    const language = parts[index - 1] || 'text';
                    return (
                        <div key={index} className="my-3 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900/50">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-700">
                                <span className="text-xs text-zinc-400 font-mono">{language}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(part.trim())}
                                    className="text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    Copy
                                </button>
                            </div>
                            <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-300">
                                <code>{part.trim()}</code>
                            </pre>
                        </div>
                    );
                }

                // Formatting for Regular Text (even indices)
                // Split by newlines to handle headers and lists
                const lines = part.split('\n');
                return (
                    <div key={index} className="whitespace-pre-wrap">
                        {lines.map((line, i) => {
                            // Empty lines
                            if (!line.trim()) return <div key={i} className="h-2" />;

                            // Headers
                            if (line.trim().startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-zinc-100 mt-2 mb-1">{parseInline(line.replace('### ', ''))}</h3>;
                            if (line.trim().startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-3 mb-2">{parseInline(line.replace('## ', ''))}</h2>;
                            if (line.trim().startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-white mt-4 border-b border-zinc-700 pb-1 mb-2">{parseInline(line.replace('# ', ''))}</h1>;

                            // Lists
                            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                return (
                                    <div key={i} className="flex gap-2 ml-1 mb-1">
                                        <span className="text-zinc-500 mt-1.5 text-[6px]">•</span>
                                        <span>{parseInline(line.replace(/^[-*]\s/, ''))}</span>
                                    </div>
                                );
                            }

                            // Blockquotes
                            if (line.trim().startsWith('> ')) {
                                return (
                                    <div key={i} className="border-l-2 border-zinc-600 pl-3 italic text-zinc-400 my-1">
                                        {parseInline(line.replace(/^>\s/, ''))}
                                    </div>
                                );
                            }

                            // Regular paragraph line
                            return <div key={i}>{parseInline(line)}</div>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

// Inline Parser (Bold, Italic, Link, Inline Code)
const parseInline = (text) => {
    // 1. Links: [text](url)
    const linkRegex = /(\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(linkRegex);

    return parts.map((part, i) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            return (
                <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
                    {linkMatch[1]}
                </a>
            );
        }

        // 2. Inline Code: `text`
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((subPart, j) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return <code key={`${i}-${j}`} className="bg-zinc-800 text-red-200 px-1 py-0.5 rounded text-xs mx-0.5 border border-zinc-700/50">{subPart.slice(1, -1)}</code>;
            }

            // 3. Bold: **text**
            const boldParts = subPart.split(/(\*\*.*?\*\*)/g);
            return boldParts.map((bPart, k) => {
                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                    return <strong key={`${i}-${j}-${k}`} className="font-bold text-white">{bPart.slice(2, -2)}</strong>;
                }
                return bPart;
            });
        });
    });
};


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
    const [mode, setMode] = useState(() => localStorage.getItem('masternote_assistant_mode') || 'chat');

    useEffect(() => {
        localStorage.setItem('masternote_assistant_mode', mode);
    }, [mode]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
                        systemInstruction: "You are MasterNote AI. Use Google Search ONLY for real-time information. For all other queries, use your internal knowledge. You are encouraged to use Emojis 🚀 and Markdown formatting (bold, italics, code blocks) to make your responses engaging and clear.",
                        tools: [{ googleSearch: {} }] // Internet access (dynamic)
                    });
                    const result = await model.generateContent(userText);
                    const response = await result.response;
                    responseContent = response.text();

                    const metadata = response.candidates?.[0]?.groundingMetadata;
                    if (metadata?.groundingChunks?.length > 0) {
                        const uniqueSources = new Map();
                        metadata.groundingChunks.forEach(chunk => {
                            if (chunk.web?.uri && chunk.web?.title) {
                                uniqueSources.set(chunk.web.uri, chunk.web.title);
                            }
                        });

                        if (uniqueSources.size > 0) {
                            responseContent += "\n\n**Sources Found**\n";
                            uniqueSources.forEach((title, uri) => {
                                responseContent += `- [${title}](${uri})\n`;
                            });
                        }
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
          Existing Tasks: ${taskContextJSON}
          User Request: "${userText}"
          
          You are an intelligent task manager agent. Analyze the User Request and extract the intent.
          
          Object Mapping:
          - Match "delete task X" to a specific ID from Existing Tasks.
          - If the user refers to a task by name (e.g. "wash winnie"), find the corresponding ID.
          
          Rules:
          1. EXTRACT the core task title. Remove conversational fillers.
          2. EXTRACT metadata (date, priority, tags).
          3. ACTION determination: "create", "update", "delete", "clear".
          
          IMPORTANT: For "update" or "delete", you MUST return the exact 'id' found in Existing Tasks as 'targetId'. If you cannot match it to an ID, leave it null.
          
          Return JSON ONLY: 
          { 
            "action": "create"|"update"|"delete"|"clear"|"invalid", 
            "taskData": { "title": "...", "date": "...", "priority": "...", "tags": [...] }, 
            "targetId": "ID" (from list) or "all", 
            "reason": "explanation" 
          }
        `;

                const result = await model.generateContent(prompt);
                const text = (await result.response).text().replace(/```json|```/g, '').trim();
                const actionData = JSON.parse(text);

                // --- Helper: Smart Task Finding ---
                const findTaskId = (target) => {
                    if (!target) return null;
                    // 1. Exact ID match (string or number)
                    const exact = tasks.find(t => t.id == target);
                    if (exact) return exact.id;

                    // 2. Fuzzy Title Match (if target is a string name)
                    if (typeof target === 'string') {
                        const lowerTarget = target.toLowerCase();
                        const match = tasks.find(t => t.title.toLowerCase().includes(lowerTarget));
                        if (match) return match.id;
                    }
                    return null;
                };

                if (actionData.action === 'create') {
                    const newTask = {
                        title: actionData.taskData.title || userText,
                        tags: actionData.taskData.tags?.length ? actionData.taskData.tags : ['New'],
                        date: actionData.taskData.date || 'Upcoming',
                        priority: actionData.taskData.priority || 'Medium'
                    };
                    addTask(newTask);
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Created: ${newTask.title}`, isSuccess: true });
                } else if (actionData.action === 'update') {
                    if (actionData.targetId === 'all') {
                        tasks.forEach(t => updateTask(t.id, actionData.taskData));
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Updated all tasks.`, isSuccess: true });
                    } else {
                        const realId = findTaskId(actionData.targetId);
                        if (realId) {
                            updateTask(realId, actionData.taskData);
                            addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Updated task.`, isSuccess: true });
                        } else {
                            addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Could not find task to update: "${actionData.targetId || 'unknown'}"`, isSuccess: false });
                        }
                    }
                } else if (actionData.action === 'delete') {
                    if (actionData.targetId === 'all') {
                        clearTasks();
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Deleted all tasks.`, isSuccess: true });
                    } else {
                        const realId = findTaskId(actionData.targetId);
                        if (realId) {
                            deleteTask(realId);
                            addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Deleted task.`, isSuccess: true });
                        } else {
                            addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Could not find task to delete: "${actionData.targetId || 'unknown'}"`, isSuccess: false });
                        }
                    }
                } else if (actionData.action === 'clear') {
                    clearTasks();
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Cleared all tasks.`, isSuccess: true });
                } else if (actionData.action === 'invalid') {
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `I'm not sure how to help with that. Try asking me to create or manage tasks.` });
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
                                        {msg.content ? (
                                            <FormattedMessage content={msg.content} />
                                        ) : (
                                            <div className="animate-pulse h-4 w-4 bg-zinc-700 rounded-full" />
                                        )}

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
                        <div className="bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-600 rounded-xl flex items-end p-2 transition-colors">
                            <div className="pl-2 pb-2">
                                <ModelSelector />
                            </div>
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
