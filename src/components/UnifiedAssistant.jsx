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
import VisualSearchCarousel from './VisualSearchCarousel';
import { searchImages } from '../services/searchService';

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
                                        <ThinkingProcess content={content} defaultExpanded={true} isComplete={isComplete} />
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
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-800 dark:text-zinc-300 ml-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-800 dark:text-zinc-300 ml-2">{children}</ol>,
                                        li: ({ children }) => <li className="text-zinc-800 dark:text-zinc-300 [&>p]:mb-1">{children}</li>,

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

    return {
        genAI: googleKey ? new GoogleGenerativeAI(googleKey) : null,
        openai: openaiKey ? new OpenAI({ apiKey: openaiKey, baseURL: window.location.origin + "/openai-api/v1", dangerouslyAllowBrowser: true }) : null,

        xai: xaiKey ? new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1", dangerouslyAllowBrowser: true }) : null,
        deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY ? new OpenAI({ apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, baseURL: window.location.origin + "/deepseek-api/v1", dangerouslyAllowBrowser: true }) : null,
        scira: !!import.meta.env.VITE_SCIRA_API_KEY,

        anthropic: anthropicKey ? new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true }) : null,
        missingKeys: {
            google: !googleKey,
            openai: !openaiKey,
            xai: !xaiKey,
            deepseek: !import.meta.env.VITE_DEEPSEEK_API_KEY,
            scira: !import.meta.env.VITE_SCIRA_API_KEY,

            anthropic: !anthropicKey
        }
    };
};

export default function UnifiedAssistant() {
    const [mode, setMode] = useState(() => localStorage.getItem('bart_assistant_mode') || 'chat');
    const [sciraMode, setSciraMode] = useState('chat'); // 'chat' | 'x'

    useEffect(() => {
        localStorage.setItem('bart_assistant_mode', mode);
    }, [mode]);

    const { selectedModel } = useModel();
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
    const { addTask, tasks, updateTask, deleteTask, clearTasks, projects } = useTasks();
    const { notes } = useNotes();
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
        const userText = input;
        setInput('');
        setIsProcessing(true);

        if (mode === 'chat') {
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
                const thinkingPrompt = " IMPORTANT: Before answering, ALWAYS explicitly think about your response step-by-step inside <think>...</think> tags. This is required for the user to see your internal reasoning.";

                const systemPrompt = (isThinkingEnabled && !['anthropic', 'google', 'xai', 'openai'].includes(selectedModel.provider))
                    ? baseSystemPrompt + thinkingPrompt
                    : baseSystemPrompt;

                if (selectedModel.provider === 'google') {
                    if (!clientsRef.current.genAI) throw new Error("Google API Key missing");
                    const model = clientsRef.current.genAI.getGenerativeModel({
                        model: selectedModel.id,
                        systemInstruction: systemPrompt,
                        tools: isSearchEnabled ? [{ googleSearch: {} }] : [],
                        generationConfig: isThinkingEnabled ? { thinkingConfig: { includeThoughts: true } } : undefined
                    });

                    const rawHistory = currentSession.messages.map(m => ({
                        role: m.role === 'ai' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                    }));
                    const firstUserIndex = rawHistory.findIndex(m => m.role === 'user');
                    const validHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

                    const chatSession = model.startChat({ history: validHistory });

                    if (isSearchEnabled) {
                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);
                        searchImages(refinedQuery).then(imgs => {
                            if (imgs && imgs.length > 0) {
                                updateMessage(currentSessionId, msgId, null, { visualResults: imgs });
                            }
                        });
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
                    let textAccumulator = "";
                    let gatheredSources = new Set();

                    for await (const chunk of result.stream) {
                        textAccumulator += chunk.text();
                        const metadata = chunk.candidates?.[0]?.groundingMetadata;
                        if (metadata?.groundingChunks) {
                            metadata.groundingChunks.forEach(chunk => {
                                if (chunk.web?.uri) gatheredSources.add(`[${chunk.web.title || 'Source'}](${chunk.web.uri})`);
                            });
                        }
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                    if (gatheredSources.size > 0) {
                        textAccumulator += "\n\n**Sources:**\n" + Array.from(gatheredSources).map(s => `- ${s}`).join("\n");
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'openai' || selectedModel.provider === 'xai' || selectedModel.provider === 'deepseek') {
                    const client = selectedModel.provider === 'openai' ? clientsRef.current.openai
                        : selectedModel.provider === 'xai' ? clientsRef.current.xai
                            : clientsRef.current.deepseek;

                    if (!client) throw new Error(`${selectedModel.provider} API Key missing`);

                    let targetModelId = selectedModel.id;
                    if (selectedModel.provider === 'deepseek' && isThinkingEnabled) targetModelId = 'deepseek-reasoner';
                    else if (selectedModel.provider === 'xai' && isThinkingEnabled) targetModelId = 'grok-4-1-fast-reasoning';
                    else if (selectedModel.provider === 'openai' && isThinkingEnabled) targetModelId = 'gpt-5.2';

                    let finalSystemPrompt = systemPrompt;
                    if (isSearchEnabled) {
                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);
                        const webContext = await getWebContext(refinedQuery);
                        if (webContext) {
                            finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT:\n${webContext}\n\nCite sources INLINE: [Domain](URL).`;
                            searchImages(refinedQuery).then(imgs => {
                                if (imgs && imgs.length > 0) updateMessage(currentSessionId, msgId, null, { visualResults: imgs });
                            });
                        }
                    }

                    const stream = await client.chat.completions.create({
                        messages: [
                            { role: "system", content: finalSystemPrompt },
                            ...historyForModel,
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: userText },
                                    ...currentAttachments.map(att => ({
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

                    let textAccumulator = "";
                    let isThinking = false;

                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta;
                        const reasoningChunk = delta?.reasoning_content || delta?.reasoning;
                        const contentChunk = delta?.content;

                        if (reasoningChunk) {
                            if (!isThinking) { isThinking = true; textAccumulator += "<think>"; }
                            textAccumulator += reasoningChunk;
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        }
                        if (contentChunk) {
                            if (isThinking) { isThinking = false; textAccumulator += "</think>"; }
                            textAccumulator += contentChunk;
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        }
                    }
                    if (isThinking) {
                        textAccumulator += "</think>";
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'anthropic') {
                    if (!clientsRef.current.anthropic) throw new Error("Anthropic API Key missing");

                    let finalSystemPrompt = systemPrompt;
                    if (isSearchEnabled) {
                        const refinedQuery = await refineSearchQuery(userText, currentSession.messages);
                        const webContext = await getWebContext(refinedQuery);
                        if (webContext) {
                            finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT:\n${webContext}\n\nCite sources INLINE.`;
                            searchImages(refinedQuery).then(imgs => {
                                if (imgs && imgs.length > 0) updateMessage(currentSessionId, msgId, null, { visualResults: imgs });
                            });
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
                                    { type: "text", text: userText },
                                    ...currentAttachments.map(att => ({
                                        type: "image",
                                        source: {
                                            type: "base64",
                                            media_type: att.mimeType,
                                            data: att.preview.split(',')[1]
                                        }
                                    }))
                                ]
                            }
                        ],
                        stream: true,
                        thinking: isThinkingEnabled ? { type: "enabled", budget_tokens: 16000 } : undefined
                    });

                    let textAccumulator = "";
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
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        }
                    }
                } else if (selectedModel.provider === 'scira') {
                    if (!import.meta.env.VITE_SCIRA_API_KEY) throw new Error("Scira API Key missing");
                    let endpoint = "/scira-api/api/search";
                    let body = {};
                    if (sciraMode === 'x') {
                        endpoint = "/scira-api/api/xsearch";
                        body = { query: userText };
                    } else {
                        body = { messages: [{ role: "user", content: userText }] };
                    }
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SCIRA_API_KEY}` },
                        body: JSON.stringify(body)
                    });
                    const data = await response.json();
                    let text = data.text || "";
                    if (data.sources) text += "\n\n**Sources:**\n" + data.sources.map(s => `- [${s}](${s})`).join("\n");
                    updateMessage(currentSessionId, msgId, text);
                }
            } catch (error) {
                updateMessage(currentSessionId, msgId, `Error: ${error.message}`);
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
        <div className="flex h-screen w-full bg-transparent font-sans text-white relative overflow-hidden bg-zinc-950">
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
                            onClick={() => createSession()}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-black/20 hover:shadow-black/30 transition-shadow"
                        >
                            <Plus size={16} /> New Chat
                        </motion.button>

                        <button
                            onClick={() => clearSession(currentSessionId)}
                            className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Clear Chat"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6" ref={scrollRef}>
                    <div className="max-w-5xl mx-auto space-y-8 pb-4">
                        {/* Show Hero/Empty State ONLY if we just have the initial AI greeting */}
                        {currentSession.messages.length <= 1 && currentSession.messages[0]?.role === 'ai' && (
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
                                                whileTap={{ scale: 0.98 }}
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

                        {currentSession.messages.map((msg, idx) => {
                            // Suppress the initial AI greeting from the chat list to favor the Hero state
                            if (msg.role === 'ai' && idx === 0) return null;

                            return (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role !== 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Sparkles size={16} className="text-zinc-900 dark:text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-zinc-300'}`}>
                                        {msg.visualResults && <VisualSearchCarousel images={msg.visualResults} />}
                                        <FormattedMessage content={msg.content} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2">
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
            </main>
        </div>
    );
}
