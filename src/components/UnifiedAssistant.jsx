import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Plus, Trash2, Zap, MessageSquare, ArrowUp, Command, Bot, User, StopCircle, PanelLeft, Sparkles, BrainCircuit, Paperclip, X, FileText, Globe,
    FolderPlus, Folder, ChevronRight, ChevronDown, Edit3 as FolderEdit, ArrowRight, Activity, Clock, MoreVertical, Share2, Copy, CheckCircle2, Terminal, Settings
} from 'lucide-react';
import { useModel } from '../context/ModelContext';
import ModelSelector from './ModelSelector';
import { useTasks } from '../context/TaskContext';
import { useNotes } from '../context/NotesContext';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import ThinkingProcess from './ThinkingProcess';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CanvasPanel from './CanvasPanel';
import WeatherCard from './WeatherCard';
import FinanceCard from './FinanceCard';
import SportsCard from './SportsCard';

// Enhanced Custom Markdown Parser
const FormattedMessage = ({ content }) => {
    if (!content) return null;

    // 1. Split by Code Blocks (```language ... ```)
    const parts = content.split(/```(\w*)\n([\s\S]*?)```/g);

    return (
        <div className="space-y-2 text-sm leading-6">
            {parts.map((part, index) => {
                // Formatting for Code Blocks (odd indices in split result)
                if (index % 3 === 1) return null; // language
                if (index % 3 === 2) { // code content
                    const language = parts[index - 1] || 'text';
                    return (
                        <div key={index} className="my-3 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 border-b border-zinc-300 dark:border-zinc-700">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{language}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(part.trim())}
                                    className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"
                                >
                                    Copy
                                </button>
                            </div>
                            <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-300">
                                <code>{part.trim()}</code>
                            </pre>
                        </div>
                    );
                }

                // Formatting for Regular Text (even indices)
                const textPart = part;

                // 2. Check for Thinking Blocks (<think> ... </think>)
                const thinkParts = textPart.split(/(<think>[\s\S]*?<\/think>|<think>[\s\S]*?$)/g);

                return (
                    <div key={index} className="w-full">
                        {thinkParts.map((tPart, tIndex) => {
                            if (tPart.startsWith('<think>')) {
                                const content = tPart.replace(/<\/?think>/g, '');
                                const isComplete = tPart.includes('</think>');
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        key={tIndex}
                                    >
                                        <ThinkingProcess content={content} defaultExpanded={false} isComplete={isComplete} />
                                    </motion.div>
                                );
                            }

                            // Use ReactMarkdown for the rest (Tables, Lists, Bold, etc.)
                            return (
                                <ReactMarkdown
                                    key={tIndex}
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Text
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-zinc-600 dark:text-zinc-400">{children}</em>,
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center align-baseline gap-1 mx-0.5 px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 no-underline hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                {children}
                                            </a>
                                        ),

                                        // Headers
                                        h1: ({ children }) => <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-4 mb-2 pb-1 border-b border-zinc-300 dark:border-zinc-700">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-3 mb-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mt-2 mb-1">{children}</h3>,

                                        // Lists
                                        ul: ({ children }) => <ul className="list-disc list-outside space-y-1 my-2 text-zinc-800 dark:text-zinc-300 ml-5">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-outside space-y-1 my-2 text-zinc-800 dark:text-zinc-300 ml-5">{children}</ol>,
                                        li: ({ children }) => <li className="text-zinc-800 dark:text-zinc-300 pl-1">{children}</li>,

                                        // Blockquotes
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-400 dark:border-zinc-600 pl-4 italic text-zinc-600 dark:text-zinc-400 my-2">{children}</blockquote>,

                                        // Tables (The request!)
                                        table: ({ children }) => <div className="overflow-x-auto my-4 border border-zinc-300 dark:border-zinc-700 rounded-lg"><table className="min-w-full text-left text-sm">{children}</table></div>,
                                        thead: ({ children }) => <thead className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 font-semibold">{children}</thead>,
                                        tbody: ({ children }) => <tbody className="divide-y divide-zinc-300 dark:divide-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">{children}</tbody>,
                                        tr: ({ children }) => <tr className="hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors">{children}</tr>,
                                        th: ({ children }) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
                                        td: ({ children }) => <td className="px-4 py-2 text-zinc-800 dark:text-zinc-300">{children}</td>,

                                        // Code
                                        code: ({ inline, className, children, ...props }) => {
                                            return <code className="bg-zinc-200 dark:bg-zinc-800 text-red-700 dark:text-red-200 px-1 py-0.5 rounded text-xs mx-0.5 border border-zinc-300 dark:border-zinc-700/50" {...props}>{children}</code>;
                                        }
                                    }}
                                >
                                    {tPart}
                                </ReactMarkdown>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};


// Initialize clients helper
const initializeClients = () => {
    const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const xaiKey = import.meta.env.VITE_XAI_API_KEY;

    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const moonshotKey = import.meta.env.VITE_MOONSHOT_API_KEY || import.meta.env.VITE_KIMI_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    return {
        genAI: googleKey ? new GoogleGenerativeAI(googleKey) : null,
        openai: openaiKey ? new OpenAI({ apiKey: openaiKey, baseURL: window.location.origin + "/openai-api/v1", dangerouslyAllowBrowser: true }) : null,

        xai: xaiKey ? new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1", dangerouslyAllowBrowser: true }) : null,
        deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY ? new OpenAI({ apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, baseURL: window.location.origin + "/deepseek-api/v1", dangerouslyAllowBrowser: true }) : null,
        moonshot: moonshotKey ? new OpenAI({ apiKey: moonshotKey, baseURL: window.location.origin + "/moonshot-api/v1", dangerouslyAllowBrowser: true }) : null,
        openrouter: openRouterKey ? new OpenAI({ apiKey: openRouterKey, baseURL: window.location.origin + "/openrouter-api", dangerouslyAllowBrowser: true }) : null,
        scira: !!import.meta.env.VITE_SCIRA_API_KEY,

        anthropic: anthropicKey ? new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true }) : null,
        missingKeys: {
            google: !googleKey,
            openai: !openaiKey,
            xai: !xaiKey,
            deepseek: !import.meta.env.VITE_DEEPSEEK_API_KEY,
            scira: !import.meta.env.VITE_SCIRA_API_KEY,
            moonshot: !moonshotKey,
            openrouter: !openRouterKey,

            anthropic: !anthropicKey
        }
    };
};

export default function UnifiedAssistant() {
    const [mode, setMode] = useState(() => localStorage.getItem('bart_assistant_mode') || 'chat');
    const [sciraMode, setSciraMode] = useState('chat'); // 'chat' | 'x'
    const [canvasData, setCanvasData] = useState(null); // { type: 'code'|'document', title: string, content: string }

    useEffect(() => {
        localStorage.setItem('bart_assistant_mode', mode);
    }, [mode]);

    useEffect(() => {
        console.log('Bart AI v2.1 - Thinking Fix Loaded');
    }, []);

    const [canvasWidth, setCanvasWidth] = useState(60); // Percentage
    const [isResizing, setIsResizing] = useState(false);
    const isResizingRef = useRef(false);

    const handleMouseMove = (e) => {
        if (!isResizingRef.current) return;
        const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 80) {
            setCanvasWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizingRef.current = false;
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    };

    const startResizing = () => {
        isResizingRef.current = true;
        setIsResizing(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const { selectedModel, selectedOpenRouterModel } = useModel();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [input, setInput] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
    const [isSearchEnabled, setIsSearchEnabled] = useState(false);

    // Lazy init clients
    const clientsRef = useRef(initializeClients());

    // File Upload State
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + attachments.length > 4) {
            alert("Maximum 4 attachments allowed."); // Basic limit
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachments(prev => [...prev, {
                    preview: e.target.result, // Data URL
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    mimeType: file.type,
                    name: file.name
                }]);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Reset Thinking to OFF when switching models
    useEffect(() => {
        setIsThinkingEnabled(false);
    }, [selectedModel.id]);

    // Auto-scroll ref
    const scrollRef = useRef(null);

    // Contexts
    // Contexts
    const { addTask, tasks, updateTask, deleteTask, clearTasks, projects } = useTasks();
    const { notes, addNote } = useNotes();
    const { settings } = useSettings();
    const {
        sessions,
        currentSessionId,
        currentSession,
        createSession,
        switchSession,
        deleteSession,
        clearSession,
        addMessageToSession,
        updateMessage,
        folders,
        addFolder,
        deleteFolder,
        renameFolder,
        moveSessionToFolder,
        renameSession
    } = useChat();

    // --- Sidebar State ---
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [expandedFolders, setExpandedFolders] = useState({});
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // --- Sidebar Helpers ---
    const toggleFolder = (id) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const startEditingFolder = (e, folder) => {
        e.stopPropagation();
        setEditingFolderId(folder.id);
        setEditValue(folder.name);
    };

    const startEditingSession = (e, session) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditValue(session.title);
    };

    const saveFolderRename = () => {
        if (editValue.trim()) {
            renameFolder(editingFolderId, editValue.trim());
        }
        setEditingFolderId(null);
    };

    const saveSessionRename = () => {
        if (editValue.trim()) {
            renameSession(editingSessionId, editValue.trim());
        }
        setEditingSessionId(null);
    };

    const handleCreateFolder = (e) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            addFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreatingFolder(false);
        }
    };

    const renderChatItems = (folderId = null) => {
        const filtered = sessions.filter(s => s.folderId === folderId);
        if (filtered.length === 0 && folderId === null) {
            return (
                <div className="text-center text-xs text-zinc-500 dark:text-zinc-600 mt-4">No history</div>
            );
        }

        return filtered.map(session => (
            <motion.div
                key={session.id}
                layout
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={(event, info) => {
                    const elements = document.elementsFromPoint(info.point.x, info.point.y);
                    const folderEl = elements.find(el => el.dataset.folderId);
                    if (folderEl) {
                        moveSessionToFolder(session.id, folderEl.dataset.folderId);
                    } else {
                        const historyEl = elements.find(el => el.id === 'history-root');
                        if (historyEl) moveSessionToFolder(session.id, null);
                    }
                }}
                className={`group relative overflow-hidden rounded-lg mx-1 my-0.5 border-l-2 transition-all ${currentSessionId === session.id
                    ? 'border-purple-500 bg-white dark:bg-white/5 text-zinc-900 dark:text-white shadow-sm'
                    : 'border-transparent text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
            >
                <div
                    onClick={() => switchSession(session.id)}
                    className="px-3 py-3 text-sm truncate flex items-center justify-between cursor-pointer"
                >
                    {editingSessionId === session.id ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveSessionRename}
                            onKeyDown={(e) => e.key === 'Enter' && saveSessionRename()}
                            className="bg-zinc-100 dark:bg-zinc-800 text-sm py-0.5 px-1 rounded outline-none w-full"
                        />
                    ) : (
                        <span className="truncate flex-1">{session.title}</span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => startEditingSession(e, session)}
                            className="p-1 hover:text-purple-500 transition-colors"
                            title="Rename"
                        >
                            <FolderEdit size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                            className="p-1 hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </motion.div>
        ));
    };

    // Scroll to bottom effect
    useEffect(() => {
        if (scrollRef.current && currentSession?.messages) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentSession?.messages, isProcessing]);

    if (!currentSession) {
        return <div className="flex h-full w-full items-center justify-center text-zinc-500">Loading...</div>;
    }

    // --- Dynamic AI Avatar Renderer ---
    const renderAIAvatar = (msg, idx) => {
        const isLatestAI = msg.role === 'ai' && idx === currentSession.messages.length - 1;
        const showAnimation = isLatestAI && isProcessing;

        if (showAnimation) {
            return (
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                    {/* Pulsing Ambient Glow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500/30 rounded-full blur-[6px]"
                    />

                    {/* Spinning Gradient Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-xl border-[1.5px] border-transparent border-t-blue-500 border-r-purple-500/50"
                    />

                    <div className="relative w-full h-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-sm overflow-hidden">
                        <motion.div
                            animate={{
                                y: [-1, 1, -1],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Sparkles size={16} className="text-blue-500 dark:text-blue-400" />
                        </motion.div>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5">
                <Sparkles size={16} className="text-zinc-600 dark:text-zinc-400" />
            </div>
        );
    };

    // --- Search Query Refinement Helper ---
    const refineSearchQuery = async (userQuery, history) => {
        try {
            if (!clientsRef.current.genAI) return userQuery;
            if (!history || history.length === 0) return userQuery;
            const model = clientsRef.current.genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
            });
            const recentHistory = history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
            const prompt = `
            Task: Rewrite the internal User Query into a specific, standalone Google Search string.
            Context: The user might be referring to previous topics. Use the conversation history to resolve pronouns like "it", "one", "this", or "best".
            
            Conversation History:
            ${recentHistory}
            
            User Query: "${userQuery}"
            
            Output: ONLY the refined search query string. Do not add quotes or explanations.
            `;
            const result = await model.generateContent(prompt);
            return result.response.text().trim() || userQuery;
        } catch (e) {
            return userQuery;
        }
    };

    // --- Hybrid Search Helper ---
    const getWebContext = async (query) => {
        try {
            if (!clientsRef.current.genAI) return null;
            const model = clientsRef.current.genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                tools: [{ googleSearch: {} }]
            });
            const prompt = `
            Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            User Query: "${query}"
            Task: Search Google for this query and summarize search results.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                const sources = groundingMetadata.groundingChunks
                    .map(chunk => chunk.web?.uri ? `[${chunk.web.title || 'Source'}](${chunk.web.uri})` : null)
                    .filter(Boolean);
                if (sources.length > 0) {
                    text += "\n\n**Sources:**\n" + [...new Set(sources)].map(s => `- ${s}`).join("\n");
                }
            }
            return text;
        } catch (e) {
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        // Check if we should switch to canvas mode based on user intent (optional, but requested behavior implies manual switch)
        // For now, we rely on the manual mode switch or explicit user instruction handled by the LLM

        const userText = input;
        setInput('');
        setIsProcessing(true);
        setIsProcessing(true);

        // Clear canvas if starting new unrelated task? No, keep context.

        if (mode === 'chat' || mode === 'canvas') {
            const userMsg = {
                id: Date.now(),
                role: 'user',
                content: userText,
                attachments: attachments,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            addMessageToSession(currentSessionId, userMsg);
            const currentAttachments = [...attachments];
            setAttachments([]);

            const msgId = Date.now() + 1;

            // Weather Extraction Helper (Universal)
            const processWeatherUpdates = (fullText) => {
                const weatherMatch = fullText.match(/<weather_json>([\s\S]*?)(?:<\/weather_json>|$)/);
                if (weatherMatch && weatherMatch[1].includes('}')) { // Ensure we have at least closing brace before trying to parse
                    try {
                        const jsonStr = weatherMatch[1].trim();
                        const data = JSON.parse(jsonStr);
                        if (data && data.current) {
                            updateMessage(currentSessionId, msgId, null, {
                                weatherData: data,
                                weatherLocation: data.location || { name: 'Unknown' }
                            });
                        }
                    } catch (e) { /* Partial JSON */ }
                }
                return fullText.replace(/<weather_json>[\s\S]*?(?:<\/weather_json>|$)/, '');
            };

            // Finance Extraction Helper
            const processFinanceUpdates = (fullText) => {
                const financeMatch = fullText.match(/<finance_json>([\s\S]*?)(?:<\/finance_json>|$)/);
                if (financeMatch && financeMatch[1].includes('}')) {
                    try {
                        const jsonStr = financeMatch[1].trim();
                        const data = JSON.parse(jsonStr);
                        if (data) {
                            updateMessage(currentSessionId, msgId, null, {
                                financeData: data
                            });
                        }
                    } catch (e) { /* Partial JSON */ }
                }
                return fullText.replace(/<finance_json>[\s\S]*?(?:<\/finance_json>|$)/, '');
            };

            // Sports Extraction Helper
            const processSportsUpdates = (fullText) => {
                const sportsMatch = fullText.match(/<sports_json>([\s\S]*?)(?:<\/sports_json>|$)/);
                if (sportsMatch && sportsMatch[1].includes('}')) {
                    try {
                        const jsonStr = sportsMatch[1].trim();
                        const data = JSON.parse(jsonStr);
                        if (data) {
                            updateMessage(currentSessionId, msgId, null, {
                                sportsData: data
                            });
                        }
                    } catch (e) { /* Partial JSON */ }
                }
                return fullText.replace(/<sports_json>[\s\S]*?(?:<\/sports_json>|$)/, '');
            };

            addMessageToSession(currentSessionId, {
                id: msgId,
                role: 'ai',
                content: '',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });


            try {
                const historyForModel = [
                    ...currentSession.messages.map(m => {
                        if (m.role === 'ai') return { role: 'assistant', content: m.content };
                        if (m.role === 'user') return { role: 'user', content: m.content };
                        return null;
                    }).filter(Boolean),
                    { role: 'user', content: userText }
                ];

                const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                const userProfileBlock = settings.userProfile.name || settings.userProfile.age || settings.userProfile.about
                    ? `\n\nUSER PROFILE:\nName: ${settings.userProfile.name}\nAge: ${settings.userProfile.age}\nAbout: ${settings.userProfile.about}`
                    : '';

                const aiPreferencesBlock = settings.aiPreferences.customInstructions || settings.aiPreferences.tone
                    ? `\n\nCUSTOM INSTRUCTIONS:\nTone: ${settings.aiPreferences.tone}\nInstructions: ${settings.aiPreferences.customInstructions}`
                    : '';

                const baseSystemPrompt = `You are Bart AI. Current Date: ${currentDate}. Current Time: ${currentTime}. Use Google Search ONLY for real-time information. For all other queries, use your internal knowledge. You are encouraged to use Emojis 🚀 and Markdown formatting.${userProfileBlock}${aiPreferencesBlock}`;

                const thinkingPrompt = ` IMPORTANT: You are in Extended Thinking Mode.
You MUST use the following format:
<think>
(Your step-by-step reasoning goes here)
</think>
(Your final answer goes here)

START YOUR RESPONSE IMMEDIATELY with <think>.`;

                const canvasPrompt = ` IMPORTANT: CANAVS MODE ACTIVE.
You are generating content for a specialized editor.
1. You MUST output ONLY the content inside valid <canvas_content> tags.
2. The tag MUST have 'type' and 'title' attributes.
3. Example: <canvas_content type="code" title="app.html">...code...</canvas_content>
4. Do not provide conversational filler before the XML.
5. If the user asks you to EDIT or ADD to the existing content, you MUST provide the FULL updated content within the tags, not just the changes.`;

                const weatherPrompt = `
IMPORTANT: WEATHER QUERIES.
If search results contain weather info, you MUST output a structured JSON block at the end of your response inside <weather_json> tags.
Follow this structure:
{
  "location": { "name": "City Name", "country": "Country", "admin1": "State/Region" },
  "current": { "temperature_2m": 20, "weather_code": 0, "is_day": 1, "relative_humidity_2m": 50, "apparent_temperature": 18, "wind_speed_10m": 10, "precipitation": 0 },
  "daily": {
    "time": ["2024-01-01", ...],
    "weather_code": [0, ...],
    "temperature_2m_max": [25, ...],
    "temperature_2m_min": [15, ...]
  }
}
    "temperature_2m_min": [15, ...]
  }
}
WMO code guide: 0=Clear, 1-3=Cloudy, 45-48=Fog, 51-67=Rain, 71-77=Snow, 95-99=Storm. Always provide a 7-day forecast if possible.`;

                const financePrompt = `
IMPORTANT: FINANCE QUERIES.
If search results contain stock/crypto info, output <finance_json>:
{
"symbol": "BTC-USD", "name": "Bitcoin", "price": "100,000", "currency": "USD", "change_percent": 5.2, "change_amount": 5000, "is_positive": true, "market_cap": "2T", "volume": "50B", "data_points": [95000, 98000, 100000]
}`;

                const sportsPrompt = `
IMPORTANT: SPORTS QUERIES.
If search results contain sports scores/results, output <sports_json>:
{
"league": "Premier League", "status": "Live 88'", "venue": "Anfield",
"home_team": { "name": "Liverpool", "score": 2, "logo_color": "from-red-700 to-red-900" },
"away_team": { "name": "Chelsea", "score": 1, "logo_color": "from-blue-700 to-blue-900" }
}`;

                let systemPrompt = baseSystemPrompt;
                if (mode === 'canvas') systemPrompt += canvasPrompt;
                if (isThinkingEnabled && !['anthropic'].includes(selectedModel.provider)) systemPrompt += thinkingPrompt;
                if (isSearchEnabled) {
                    systemPrompt += weatherPrompt;
                    systemPrompt += financePrompt;
                    systemPrompt += sportsPrompt;
                }

                if (selectedModel.provider === 'google') {
                    if (!clientsRef.current.genAI) throw new Error("Google API Key missing");
                    const model = clientsRef.current.genAI.getGenerativeModel({
                        model: selectedModel.id,
                        systemInstruction: systemPrompt,
                        tools: isSearchEnabled ? [{ googleSearch: {} }] : [],
                        generationConfig: (isThinkingEnabled && selectedModel.id.includes('thinking')) ? { thinkingConfig: { includeThoughts: true } } : undefined
                    });

                    const rawHistory = currentSession.messages.map(m => ({
                        role: m.role === 'ai' ? 'model' : 'user',
                        parts: [{ text: m.content }] // Google doesn't need explicit canvas reminder in history if system prompt works, but let's see.
                    }));

                    // Add Canvas Reminder to last User message for Google as well
                    if (mode === 'canvas') {
                        const lastMsg = rawHistory[rawHistory.length - 1];
                        if (lastMsg && lastMsg.role === 'user') {
                            lastMsg.parts[0].text += "\n\n(REMINDER: Output exclusively in <canvas_content> XML tags)";
                        }
                    }
                    const firstUserIndex = rawHistory.findIndex(m => m.role === 'user');
                    const validHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

                    const chatSession = model.startChat({ history: validHistory });

                    let searchThoughts = "";

                    if (isSearchEnabled) {
                        if (isThinkingEnabled) {
                            searchThoughts += "<think>🧠 Analyzing request...</think>";
                            updateMessage(currentSessionId, msgId, searchThoughts);
                        }

                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);


                        if (isThinkingEnabled) {
                            searchThoughts = searchThoughts.replace("</think>", `\n🔍 Searching Google for: "${refinedQuery}"...`);
                            updateMessage(currentSessionId, msgId, searchThoughts + "</think>");
                        }

                        if (isThinkingEnabled) {
                            searchThoughts += "\n✅ Handing off to Google Search Tool.</think>";
                            updateMessage(currentSessionId, msgId, searchThoughts);
                        }
                    }

                    const messageParts = [{ text: userText }];
                    currentAttachments.forEach(att => {
                        messageParts.push({
                            inlineData: {
                                mimeType: att.mimeType,
                                data: att.preview.split(',')[1]
                            }
                        });
                    });

                    const result = await chatSession.sendMessageStream(messageParts);
                    let textAccumulator = searchThoughts;
                    let gatheredSources = new Set();

                    // Canvas Extraction Helper (Google)

                    const processCanvasUpdates = (fullText) => {
                        const canvasMatch = fullText.match(/<canvas_content type="([^"]+)" title="([^"]+)">([\s\S]*?)(?:<\/canvas_content>|$)/);
                        if (canvasMatch) {
                            const [_, type, title, content] = canvasMatch;
                            setCanvasData({ type, title, content: content.trim() });
                            // Optional: Remove canvas tags from chat view if closed, but keeping them might be messy.
                            // Better: The FormattedMessage component can hide them or we strip them here.
                            // For stream, we strip them from the displayed message
                            return fullText.replace(/<canvas_content[\s\S]*?(?:<\/canvas_content>|$)/, '_[Updated Canvas Content]_');
                        }
                        return fullText;
                    };

                    for await (const chunk of result.stream) {
                        textAccumulator += chunk.text();
                        const metadata = chunk.candidates?.[0]?.groundingMetadata;
                        if (metadata?.groundingChunks) {
                            metadata.groundingChunks.forEach(chunk => {
                                if (chunk.web?.uri) gatheredSources.add(`[${chunk.web.title || 'Source'}](${chunk.web.uri})`);
                            });
                        }

                        let displayText = processCanvasUpdates(textAccumulator);
                        displayText = processWeatherUpdates(displayText);
                        displayText = processFinanceUpdates(displayText);
                        displayText = processSportsUpdates(displayText);
                        updateMessage(currentSessionId, msgId, displayText);
                    }

                    if (gatheredSources.size > 0) {
                        textAccumulator += "\n\n**Sources:**\n" + Array.from(gatheredSources).map(s => `- ${s}`).join("\n");
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'openai' || selectedModel.provider === 'xai' || selectedModel.provider === 'deepseek' || selectedModel.provider === 'moonshot' || selectedModel.provider === 'openrouter') {
                    const client = selectedModel.provider === 'openai' ? clientsRef.current.openai
                        : selectedModel.provider === 'xai' ? clientsRef.current.xai
                            : selectedModel.provider === 'deepseek' ? clientsRef.current.deepseek
                                : selectedModel.provider === 'moonshot' ? clientsRef.current.moonshot
                                    : clientsRef.current.openrouter;

                    if (!client) throw new Error(`${selectedModel.provider} API Key missing`);

                    let targetModelId = selectedModel.id;
                    if (selectedModel.provider === 'deepseek' && isThinkingEnabled) targetModelId = 'deepseek-reasoner';
                    else if (selectedModel.provider === 'xai' && isThinkingEnabled) targetModelId = 'grok-4-1-fast-reasoning';
                    else if (selectedModel.provider === 'openai' && isThinkingEnabled) targetModelId = 'gpt-5.2';
                    else if (selectedModel.provider === 'moonshot' && isThinkingEnabled) targetModelId = 'kimi-k2-thinking';
                    else if (selectedModel.provider === 'openrouter') {
                        if (!selectedOpenRouterModel) throw new Error("Please select an OpenRouter model");
                        targetModelId = selectedOpenRouterModel.id;
                    }


                    let searchThoughts = "";
                    let finalSystemPrompt = systemPrompt;
                    let skippedFilesWarning = "";

                    // Filter attachments and build warning
                    const validAttachments = currentAttachments.filter(att => {
                        const isImage = att.type === 'image';
                        if (!isImage) {
                            skippedFilesWarning += `\n⚠️ **skipped ${att.name}**: This model only supports images. For PDFs/Docs, please use **Google Gemini** models.`;
                        }
                        return isImage;
                    });

                    if (isSearchEnabled) {
                        if (isThinkingEnabled) {
                            searchThoughts += "<think>🧠 Analyzing request...</think>";
                            updateMessage(currentSessionId, msgId, searchThoughts);
                        }

                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);


                        if (isThinkingEnabled) {
                            searchThoughts = searchThoughts.replace("</think>", `\n🔍 Searching Google for: "${refinedQuery}"...`);
                            updateMessage(currentSessionId, msgId, searchThoughts + "</think>");
                        }

                        const webContext = await getWebContext(refinedQuery);
                        if (webContext) {
                            if (isThinkingEnabled) {
                                searchThoughts += "\n✅ Found relevant search results.</think>";
                                updateMessage(currentSessionId, msgId, searchThoughts);
                            }

                            finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT:\n${webContext}\n\nCite sources INLINE: [Domain](URL).`;
                        } else {
                            if (isThinkingEnabled) {
                                searchThoughts += "\n❌ No specific results found.</think>";
                                updateMessage(currentSessionId, msgId, searchThoughts);
                            }
                        }
                    }

                    const stream = await client.chat.completions.create({
                        messages: [
                            { role: "system", content: finalSystemPrompt },
                            ...historyForModel,
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: userText + (mode === 'canvas' ? `\n\n(REMINDER: Output exclusively in <canvas_content> XML tags)` : "") + (canvasData ? `\n\nCURRENT CANVAS CONTENT (${canvasData.type}):\n${canvasData.content}` : "") },
                                    ...validAttachments.map(att => ({
                                        type: "image_url",
                                        image_url: { url: att.preview }
                                    }))
                                ]
                            }
                        ],
                        model: targetModelId,
                        stream: true,
                        reasoning_effort: (selectedModel.provider === 'openai' && isThinkingEnabled) ? "high" : undefined,
                    });

                    let textAccumulator = searchThoughts + (skippedFilesWarning ? skippedFilesWarning + "\n\n" : "");
                    // Initial update if we have a warning
                    if (skippedFilesWarning) updateMessage(currentSessionId, msgId, textAccumulator);

                    let isThinking = false;

                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta;
                        const reasoningChunk = delta?.reasoning_content || delta?.reasoning;
                        const contentChunk = delta?.content;

                        if (reasoningChunk) {
                            // Skip manual reasoning extraction for Moonshot (Kimi) as it handles tags natively in content
                            // or sends duplicate reasoning. For others, wrap in <think>.
                            if (selectedModel.provider !== 'moonshot') {
                                if (!isThinking) {
                                    isThinking = true;
                                    // Ensure newline if there is preceding text
                                    if (textAccumulator.length > 0 && !textAccumulator.endsWith('\n')) {
                                        textAccumulator += "\n";
                                    }
                                    textAccumulator += "<think>";
                                }
                                // Strip tags from reasoning chunk to prevent doubling
                                textAccumulator += reasoningChunk.replace(/<\/?think>/g, '');
                                updateMessage(currentSessionId, msgId, textAccumulator);
                            }
                        }
                        if (contentChunk) {
                            if (isThinking) {
                                isThinking = false;
                                if (!textAccumulator.trim().endsWith('</think>')) {
                                    textAccumulator += "</think>";
                                }
                            }

                            // Strip raw thinking tags from content only for DeepSeek (to prevent duplicates)
                            // Moonshot (Kimi) is allowed to pass tags through as we ignored its reasoning field
                            if (selectedModel.provider === 'deepseek') {
                                textAccumulator += contentChunk.replace(/<\/?think>/g, '');
                            } else {
                                textAccumulator += contentChunk;
                            }

                            // Canvas Extraction (OpenAI/xAI/Deepseek)
                            const canvasMatch = textAccumulator.match(/<canvas_content\s+(?:type="([^"]+)"\s+title="([^"]+)"|title="([^"]+)"\s+type="([^"]+)")>([\s\S]*?)(?:<\/canvas_content>|$)/);
                            if (canvasMatch) {
                                const type = canvasMatch[1] || canvasMatch[4];
                                const title = canvasMatch[2] || canvasMatch[3];
                                const content = canvasMatch[5];
                                setCanvasData({ type, title, content: content.trim() });
                                let displayText = textAccumulator.replace(/<canvas_content[\s\S]*?(?:<\/canvas_content>|$)/, '_[Updated Canvas Content]_');
                                displayText = processWeatherUpdates(displayText);
                                displayText = processFinanceUpdates(displayText);
                                displayText = processSportsUpdates(displayText);
                                updateMessage(currentSessionId, msgId, displayText.replace(/(<\/think>\s*)+/g, "<\/think>"));
                            } else {
                                let displayText = processWeatherUpdates(textAccumulator);
                                displayText = processFinanceUpdates(displayText);
                                displayText = processSportsUpdates(displayText);
                                updateMessage(currentSessionId, msgId, displayText.replace(/(<\/think>\s*)+/g, "<\/think>"));
                            }
                        }
                    }
                    if (isThinking) {
                        textAccumulator += "</think>";
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'anthropic') {
                    if (!clientsRef.current.anthropic) throw new Error("Anthropic API Key missing");

                    let searchThoughts = "";
                    let finalSystemPrompt = systemPrompt;
                    let skippedFilesWarning = "";

                    const validAttachments = currentAttachments.filter(att => {
                        const isImage = att.type === 'image';
                        const isPdf = att.mimeType === 'application/pdf';
                        if (!isImage && !isPdf) {
                            skippedFilesWarning += `\n⚠️ **skipped ${att.name}**: Claude supports Images and PDFs. For other docs, please use **Google Gemini**.`;
                        }
                        return isImage || isPdf;
                    });

                    if (isSearchEnabled) {
                        if (isThinkingEnabled) {
                            searchThoughts += "<think>🧠 Analyzing request...</think>";
                            updateMessage(currentSessionId, msgId, searchThoughts);
                        }

                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);


                        if (isThinkingEnabled) {
                            searchThoughts = searchThoughts.replace("</think>", `\n🔍 Searching Google for: "${refinedQuery}"...`);
                            updateMessage(currentSessionId, msgId, searchThoughts + "</think>");
                        }

                        const webContext = await getWebContext(refinedQuery);
                        if (webContext) {
                            if (isThinkingEnabled) {
                                searchThoughts += "\n✅ Found relevant search results.</think>";
                                updateMessage(currentSessionId, msgId, searchThoughts);
                            }

                            finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT:\n${webContext}\n\nCite sources INLINE.`;
                        } else {
                            if (isThinkingEnabled) {
                                searchThoughts += "\n❌ No specific results found.</think>";
                                updateMessage(currentSessionId, msgId, searchThoughts);
                            }
                        }
                    }

                    const stream = await clientsRef.current.anthropic.messages.create({
                        model: selectedModel.id,
                        max_tokens: 40000,
                        system: finalSystemPrompt,
                        messages: [
                            ...historyForModel,
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: userText + (mode === 'canvas' ? "\n\n(REMINDER: Output exclusively in <canvas_content> XML tags)" : "") },
                                    ...validAttachments.map(att => {
                                        if (att.mimeType === 'application/pdf') {
                                            return {
                                                type: "document",
                                                source: {
                                                    type: "base64",
                                                    media_type: "application/pdf",
                                                    data: att.preview.split(',')[1]
                                                }
                                            };
                                        }
                                        return {
                                            type: "image",
                                            source: {
                                                type: "base64",
                                                media_type: att.mimeType,
                                                data: att.preview.split(',')[1]
                                            }
                                        };
                                    })
                                ]
                            }
                        ],
                        stream: true,
                        thinking: isThinkingEnabled ? { type: "enabled", budget_tokens: 16000 } : undefined
                    });



                    let textAccumulator = searchThoughts + (skippedFilesWarning ? skippedFilesWarning + "\n\n" : "");
                    if (skippedFilesWarning) updateMessage(currentSessionId, msgId, textAccumulator);

                    let inThinkingBlock = false;
                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_start' && chunk.content_block.type === 'thinking') {
                            inThinkingBlock = true;
                            textAccumulator += "<think>";
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'thinking_delta') {
                            textAccumulator += chunk.delta.thinking;
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        } else if (chunk.type === 'content_block_stop' && inThinkingBlock) {
                            inThinkingBlock = false;
                            textAccumulator += "</think>";
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            textAccumulator += chunk.delta.text;
                            // Canvas Extraction (Anthropic)
                            const canvasMatch = textAccumulator.match(/<canvas_content\s+(?:type="([^"]+)"\s+title="([^"]+)"|title="([^"]+)"\s+type="([^"]+)")>([\s\S]*?)(?:<\/canvas_content>|$)/);
                            if (canvasMatch) {
                                const type = canvasMatch[1] || canvasMatch[4];
                                const title = canvasMatch[2] || canvasMatch[3];
                                const content = canvasMatch[5];
                                setCanvasData({ type, title, content: content.trim() });
                                const displayText = textAccumulator.replace(/<canvas_content[\s\S]*?(?:<\/canvas_content>|$)/, '_[Updated Canvas Content]_');
                                updateMessage(currentSessionId, msgId, displayText);
                            } else {
                                let displayText = processWeatherUpdates(textAccumulator);
                                displayText = processFinanceUpdates(displayText);
                                displayText = processSportsUpdates(displayText);
                                if (displayText !== textAccumulator) {
                                    updateMessage(currentSessionId, msgId, displayText);
                                } else {
                                    updateMessage(currentSessionId, msgId, textAccumulator);
                                }
                            }
                        }
                    }
                } else if (selectedModel.provider === 'scira') {
                    if (!import.meta.env.VITE_SCIRA_API_KEY) throw new Error("Scira API Key missing");
                    let endpoint = "/scira-api/api/search";
                    let body = {};
                    if (sciraMode === 'x') {
                        endpoint = "/scira-api/api/xsearch";
                        // Refine query with history for X search to support follow-up questions
                        let refinedQuery = userText;
                        if (isThinkingEnabled) {
                            updateMessage(currentSessionId, msgId, "<think>🧠 Refining search query...</think>");
                            refinedQuery = await refineSearchQuery(userText, currentSession.messages);
                            updateMessage(currentSessionId, msgId, `<think>🔍 Searching X for: "${refinedQuery}"...</think>`);
                        } else {
                            // Silent refinement if thinking is off
                            refinedQuery = await refineSearchQuery(userText, currentSession.messages);
                        }
                        body = { query: refinedQuery };
                    } else {
                        body = { messages: [{ role: "user", content: userText }] };
                    }

                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SCIRA_API_KEY}` },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        const errorText = await response.text().catch(() => 'Unknown error');
                        throw new Error(`Scira API Error (${response.status}): ${errorText}`);
                    }

                    const textData = await response.text();
                    if (!textData) throw new Error("Received empty response from Scira API");

                    let data;
                    try {
                        data = JSON.parse(textData);
                    } catch (e) {
                        throw new Error("Failed to parse Scira API response: " + textData.substring(0, 100));
                    }

                    let text = data.text || "";
                    if (data.sources) text += "\n\n**Sources:**\n" + data.sources.map(s => `- [${s}](${s})`).join("\n");
                    updateMessage(currentSessionId, msgId, text);
                }
            } catch (error) {
                updateMessage(currentSessionId, msgId, `Error: ${error.message}`);
            }
        } else if (mode === 'agent') {
            // --- AGENT MODE LOGIC ---
            const userMsg = {
                id: Date.now(),
                role: 'user',
                content: userText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            addMessageToSession(currentSessionId, userMsg);

            const msgId = Date.now() + 1;
            addMessageToSession(currentSessionId, {
                id: msgId,
                role: 'ai',
                content: 'Processing task request...',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            try {
                // Construct logic to parse task
                // We provide a simplified task list to the LLM so it can identify which task to update/delete
                const simplifiedTasks = tasks.map(t => ({ id: t.id, title: t.title, status: t.status }));

                // Get recent conversation history (last 5 messages) to provide context for pronouns like "it"
                const recentHistory = currentSession.messages
                    .slice(-5)
                    .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
                    .join('\n');

                const prompt = `
                You are a smart task management agent.
                Analyze the following user request and determine the user's intent:
                1. "create_task": Add a new task.
                2. "list_tasks": Query existing tasks.
                3. "update_task": Modify existing task(s) (mark done, change priority, rename, etc.).
                4. "delete_task": Remove task(s).

                User Request: "${userText}"
                
                Context:
                - Available Projects: ${projects.map(p => `${p.id} (${p.name})`).join(', ')}. 
                - Current Tasks (ID: Title [Status]): 
                ${JSON.stringify(simplifiedTasks).slice(0, 3000)} ${/* Limit context size */ ""}
                - Conversation History (Use this to resolve pronouns like "it", "that task", etc.):
                ${recentHistory}

                IMPORTANT for Update/Delete: 
                - If the user says "ALL" or "Everything", set "taskIds": ["ALL"].
                - If specific tasks, find their IDs based on the user's description. YOU MUST use intelligent semantic matching (e.g., "coding task" matches "Fix login bug").
                - If the user implies a task from context (e.g., "delete it", "move the last one"), use the Conversation History to identify the task.
                - Return "taskIds": ["id1", "id2"].
                - Only assign a projectId if explicitly mentioned.
                
                Required JSON Structure:
                {
                    "action": "create_task" | "list_tasks" | "update_task" | "delete_task",
                    "taskIds": ["id1", "id2"] OR ["ALL"] (REQUIRED for update/delete),
                    "taskDetails": {
                        "title": "Task title",
                        "priority": "High" | "Medium" | "Low",
                        "date": "Today" | "Tomorrow" | "Next Week" | "No Date",
                        "tags": ["Tag1", "Tag2"],
                        "projectId": "project_id_or_null",
                        "status": "pending" | "completed" (if marking as done),
                        "confirmation": "A short, friendly confirmation message."
                    },
                    "listQuery": {
                        "filter": "all" | "today" | "pending" | "completed",
                        "projectFilter": "project_id_or_null"
                    }
                }
                
                Output ONLY the JSON object.
                `;

                let responseText = "";

                // Use "Smartest" available model for this logic task
                if (clientsRef.current.openai) {
                    const completion = await clientsRef.current.openai.chat.completions.create({
                        messages: [{ role: "system", content: prompt }],
                        model: "gpt-4o",
                        response_format: { type: "json_object" }
                    });
                    responseText = completion.choices[0].message.content;
                } else if (clientsRef.current.genAI) {
                    const model = clientsRef.current.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", generationConfig: { responseMimeType: "application/json" } });
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text();
                } else if (clientsRef.current.anthropic) {
                    // Fallback for Anthropic
                    const msg = await clientsRef.current.anthropic.messages.create({
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1024,
                        messages: [{ role: "user", content: prompt }]
                    });
                    responseText = msg.content[0].text;
                } else {
                    throw new Error("No capable AI model available for Agent tasks.");
                }

                const data = JSON.parse(responseText);

                if (data.action === 'create_task') {
                    const taskData = data.taskDetails;
                    addTask({
                        title: taskData.title,
                        priority: taskData.priority,
                        date: taskData.date,
                        tags: taskData.tags || [],
                        projectId: taskData.projectId
                    });

                    const projectObj = projects.find(p => p.id === taskData.projectId);
                    const projectName = projectObj ? projectObj.name : "Inbox";

                    updateMessage(currentSessionId, msgId, `✅ ${taskData.confirmation}\n\n**Task Created in ${projectName}:**\n*${taskData.title}* (${taskData.priority}) - ${taskData.date}`);

                } else if (data.action === 'list_tasks') {
                    // Implement listing logic
                    let filteredTasks = tasks;

                    // Simple filtering based on AI response
                    if (data.listQuery.filter === 'today') {
                        filteredTasks = tasks.filter(t => t.date === 'Today');
                    } else if (data.listQuery.filter === 'pending') {
                        filteredTasks = tasks.filter(t => t.status === 'pending');
                    } else if (data.listQuery.filter === 'completed') {
                        filteredTasks = tasks.filter(t => t.status === 'completed');
                    }

                    if (data.listQuery.projectFilter) {
                        filteredTasks = filteredTasks.filter(t => t.projectId === data.listQuery.projectFilter);
                    }

                    if (filteredTasks.length === 0) {
                        updateMessage(currentSessionId, msgId, `You have no matching tasks.`);
                    } else {
                        const taskList = filteredTasks.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] **${t.title}** (${t.priority}) ${t.date ? `- ${t.date}` : ''}`).join('\n');
                        updateMessage(currentSessionId, msgId, `Here are your tasks:\n\n${taskList}`);
                    }

                } else if (data.action === 'update_task') {
                    if (!data.taskIds || data.taskIds.length === 0) throw new Error("Could not identify tasks to update.");

                    const updateDetails = {};
                    if (data.taskDetails.title) updateDetails.title = data.taskDetails.title;
                    if (data.taskDetails.priority) updateDetails.priority = data.taskDetails.priority;
                    if (data.taskDetails.date) updateDetails.date = data.taskDetails.date;
                    // Ensure status is normalized if provided
                    if (data.taskDetails.status) updateDetails.status = data.taskDetails.status.toLowerCase();
                    if (data.taskDetails.projectId !== undefined) updateDetails.projectId = data.taskDetails.projectId;

                    let count = 0;
                    if (data.taskIds.includes("ALL")) {
                        tasks.forEach(t => updateTask(t.id, updateDetails));
                        count = tasks.length;
                    } else {
                        data.taskIds.forEach(rawId => {
                            // Resolve ID: Handle type mismatch (String vs Number)
                            const task = tasks.find(t => t.id == rawId);
                            if (task) {
                                updateTask(task.id, updateDetails);
                            }
                        });
                        count = data.taskIds.length;
                    }

                    updateMessage(currentSessionId, msgId, `✅ ${data.taskDetails.confirmation || `${count} task(s) updated.`}`);

                } else if (data.action === 'delete_task') {
                    if (!data.taskIds || data.taskIds.length === 0) throw new Error("Could not identify tasks to delete.");

                    if (data.taskIds.includes("ALL")) {
                        clearTasks();
                        updateMessage(currentSessionId, msgId, `🗑️ ${data.taskDetails.confirmation || "All tasks deleted."}`);
                    } else {
                        data.taskIds.forEach(rawId => {
                            // Resolve ID: Handle type mismatch
                            const task = tasks.find(t => t.id == rawId);
                            if (task) {
                                deleteTask(task.id);
                            }
                        });
                        updateMessage(currentSessionId, msgId, `🗑️ ${data.taskDetails.confirmation || `${data.taskIds.length} task(s) deleted.`}`);
                    }
                }

            } catch (error) {
                console.error("Agent Error:", error);
                updateMessage(currentSessionId, msgId, `❌ Failed to process request. Error: ${error.message}`);
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
        <div className="flex h-screen w-full bg-transparent font-sans text-zinc-900 dark:text-white relative overflow-hidden">
            {isSidebarOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 256, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="border-r border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden"
                >
                    <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-black/20 h-[57px]">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 tracking-wider uppercase">Folders & History</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsCreatingFolder(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors" title="New Folder">
                                <FolderPlus size={16} />
                            </button>
                            <button onClick={() => createSession()} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors" title="New Chat">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div id="history-root" className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {isCreatingFolder && (
                            <form onSubmit={handleCreateFolder} className="px-2 mb-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Folder Name..."
                                    onBlur={() => setIsCreatingFolder(false)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-purple-500"
                                />
                            </form>
                        )}

                        <div className="space-y-1 mb-4">
                            {folders.map(folder => (
                                <div key={folder.id} className="space-y-1">
                                    <div
                                        data-folder-id={folder.id}
                                        onClick={() => toggleFolder(folder.id)}
                                        className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${expandedFolders[folder.id] ? 'bg-zinc-100 dark:bg-white/5' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {expandedFolders[folder.id] ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                                            <Folder size={14} className="text-purple-500 shrink-0" />
                                            {editingFolderId === folder.id ? (
                                                <input
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={saveFolderRename}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveFolderRename()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-transparent text-sm outline-none w-full border-b border-purple-500"
                                                />
                                            ) : (
                                                <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">{folder.name}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => startEditingFolder(e, folder)} className="p-1 hover:text-purple-500"><FolderEdit size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedFolders[folder.id] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                                                {renderChatItems(folder.id)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            {folders.length > 0 && <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Uncategorized</div>}
                            {renderChatItems(null)}
                        </div>
                    </div>
                </motion.aside>
            )}

            <main className="flex-1 flex flex-col relative bg-transparent h-screen overflow-hidden">
                <header className="h-[60px] border-b border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-xl transition-all duration-200 ${isSidebarOpen ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                        >
                            <PanelLeft size={20} />
                        </motion.button>

                        <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/5 shadow-inner">
                            <button
                                onClick={() => setMode('chat')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${mode === 'chat' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                Chat
                            </button>
                            <button
                                onClick={() => setMode('agent')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${mode === 'agent' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                Agent
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                createSession();
                                setCanvasData(null); // Reset Canvas on New Chat
                            }}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-black/20 hover:shadow-black/30 transition-shadow"
                        >
                            <Plus size={16} /> New Chat
                        </motion.button>

                        <button
                            onClick={() => deleteSession(currentSessionId)}
                            className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete Chat"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Chat Area - Resizes when Canvas is open and has content */}
                    <div
                        className={`flex-1 overflow-y-auto custom-scrollbar p-6 transition-all duration-300 ${mode === 'canvas' && canvasData ? 'border-r border-zinc-200 dark:border-white/5' : 'max-w-full'}`}
                        style={{ maxWidth: mode === 'canvas' && canvasData ? `${100 - canvasWidth}%` : '100%' }}
                        ref={scrollRef}
                    >
                        <div className={`mx-auto space-y-8 pb-4 ${mode === 'canvas' ? 'max-w-full' : 'max-w-5xl'}`}>
                            {/* Show Hero/Empty State ONLY if we just have the initial AI greeting and NOT in canvas mode */}
                            {currentSession.messages.length <= 1 && currentSession.messages[0]?.role === 'ai' && mode !== 'canvas' && (
                                <div className="flex flex-col items-center justify-center mt-20">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                                        className="text-center space-y-8 w-full max-w-2xl"
                                    >
                                        {/* Premium Nebula Orb Logo */}
                                        <div className="relative inline-flex items-center justify-center group py-8">
                                            {/* Ambient Glow */}
                                            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>

                                            <div className="relative">
                                                {/* Rotating Ring */}
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-30 blur-sm"
                                                />

                                                {/* Core Container */}
                                                <div className="relative w-24 h-24 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center border border-zinc-200 dark:border-white/10 shadow-2xl shadow-black/80">
                                                    {/* Inner Gradient */}
                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10"></div>

                                                    {/* Icon */}
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                    >
                                                        <Sparkles size={40} className="text-zinc-900 dark:text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="text-3xl md:text-4xl font-light text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-white/40 tracking-tight pb-2">
                                            How can I help you, Master?
                                        </h2>

                                        {/* Suggestion Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4 pt-8">
                                            {[
                                                { icon: <MessageSquare size={20} />, label: "Draft an email", desc: "Professional correspondence", query: "Draft a professional email about..." },
                                                { icon: <Zap size={20} />, label: "Analyze code", desc: "Debug & optimize snippets", query: "Review this code for bugs..." },
                                                { icon: <BrainCircuit size={20} />, label: "Brainstorm ideas", desc: "Unlock creativity", query: "Give me 5 creative ideas for..." },
                                                { icon: <Bot size={20} />, label: "Task planning", desc: "Organize your workflow", query: "Create a plan to launch..." },
                                            ].map((item, idx) => (
                                                <motion.button
                                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    key={idx}
                                                    onClick={() => setInput(item.query)}
                                                    className="flex flex-col gap-2 p-5 text-left bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm group shadow-sm hover:shadow-md dark:shadow-none"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 group-hover:from-blue-500/10 group-hover:to-purple-500/10 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-all duration-300">
                                                            {item.icon}
                                                        </span>
                                                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.label}</span>
                                                    </div>
                                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 pl-[3.25rem] transition-colors">
                                                        {item.desc}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Canvas Mode Empty State */}
                            {mode === 'canvas' && currentSession.messages.length <= 1 && currentSession.messages[0]?.role === 'ai' && (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                                    <Sparkles size={48} className="mb-4 opacity-20" />
                                    <p>Ask Bart to draft a document or write code to see it here.</p>
                                </div>
                            )}

                            {currentSession.messages.map((msg, idx) => {
                                // Suppress the initial AI greeting from the chat list to favor the Hero state
                                if (msg.role === 'ai' && idx === 0) return null;

                                return (
                                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role !== 'user' && renderAIAvatar(msg, idx)}
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-zinc-300'}`}>
                                            {msg.weatherData && <WeatherCard data={msg.weatherData} location={msg.weatherLocation} />}
                                            {msg.financeData && <FinanceCard data={msg.financeData} />}
                                            {msg.sportsData && <SportsCard data={msg.sportsData} />}
                                            <FormattedMessage content={msg.content} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Canvas Panel */}
                    {/* Canvas Panel */}
                    <AnimatePresence>
                        {mode === 'canvas' && canvasData && (
                            <>
                                {/* Resize Handle */}
                                <div
                                    onMouseDown={startResizing}
                                    className="w-1 hover:w-2 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-50 transition-all absolute right-0 top-0 bottom-0"
                                    style={{ right: `${canvasWidth}%`, transform: 'translateX(50%)' }}
                                />
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: `${canvasWidth}%`, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex-1 h-full"
                                >
                                    <CanvasPanel
                                        content={canvasData.content}
                                        type={canvasData.type}
                                        title={canvasData.title}
                                        isStreaming={isProcessing}
                                        onClose={() => setMode('chat')}
                                        onUpdate={(newContent) => setCanvasData(prev => ({ ...prev, content: newContent }))}
                                        onSaveToNotes={(content) => addNote('inbox', content)}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2 shrink-0">
                    <div className="max-w-4xl mx-auto relative group">
                        {/* Animated Glow Border */}
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-[22px] blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                        <div className="relative bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[21px] flex flex-col p-2 transition-all duration-300 shadow-2xl shadow-black/20 group-focus-within:ring-1 group-focus-within:ring-blue-500/20">
                            {/* Toolbar */}
                            <div className="px-2 pb-1 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 mb-1">
                                <div className="flex items-center gap-1 py-1">
                                    <ModelSelector />
                                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-white/10 mx-1 shrink-0" />

                                    <button
                                        onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                        className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${isThinkingEnabled ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                        title="Deep Thinking"
                                    >
                                        <BrainCircuit size={16} />
                                        <span className="hidden sm:inline">Thinking</span>
                                    </button>

                                    <button
                                        onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                                        className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${isSearchEnabled ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                        title="Web Search"
                                    >
                                        <Globe size={16} />
                                        <span className="hidden sm:inline">Search</span>
                                    </button>

                                    {/* Scira X Button */}
                                    {selectedModel?.provider === 'scira' && (
                                        <button
                                            onClick={() => setSciraMode(sciraMode === 'x' ? 'chat' : 'x')}
                                            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${sciraMode === 'x' ? 'bg-zinc-900/10 text-zinc-900 dark:bg-white/10 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                            title="Search X (Twitter)"
                                        >
                                            <span className="font-bold font-mono text-sm leading-none">𝕏</span>
                                            <span className="hidden sm:inline">Search X</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setMode(mode === 'canvas' ? 'chat' : 'canvas')}
                                        className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${mode === 'canvas' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                        title="Toggle Canvas"
                                    >
                                        <PanelLeft size={16} />
                                        <span className="hidden sm:inline">Canvas</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
                                        title="Attach file"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Textarea Area */}
                            <div className="flex items-end gap-2 px-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    multiple
                                    className="hidden"
                                />

                                <div className="flex-1 flex flex-col">
                                    {/* Attachments Preview */}
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 py-2">
                                            {attachments.map((att, idx) => (
                                                <div key={idx} className="relative group/att">
                                                    {att.type === 'image' ? (
                                                        <img src={att.preview} className="h-12 w-12 object-cover rounded-lg border border-zinc-200 dark:border-white/10" />
                                                    ) : (
                                                        <div className="h-12 px-3 flex items-center gap-2 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10 text-[10px] text-zinc-500">
                                                            <FileText size={14} />
                                                            <span className="max-w-[80px] truncate">{att.name}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => removeAttachment(idx)}
                                                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover/att:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 text-sm py-4 w-full resize-none min-h-[44px] max-h-[300px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                        rows={1}
                                        placeholder="Message Bart..."
                                        style={{ height: 'auto' }}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSend}
                                    disabled={!input.trim() || isProcessing}
                                    className={`mb-3 p-2.5 rounded-xl transition-all duration-300 shadow-xl ${input.trim()
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-black/20'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ArrowUp size={20} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Resize Overlay - Prevents iframe interference */}
                {isResizing && (
                    <div className="fixed inset-0 z-[100] cursor-col-resize bg-transparent" />
                )}
            </main>
        </div>
    );
}
