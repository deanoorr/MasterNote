import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Trash2, Zap, MessageSquare, ArrowUp, Command, Bot, User, StopCircle, PanelLeft, Sparkles, BrainCircuit, Paperclip, X, FileText, Globe } from 'lucide-react';
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
                                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">{children}</a>,

                                        // Headers
                                        h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-zinc-700">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-bold text-zinc-100 mt-2 mb-1">{children}</h3>,

                                        // Lists
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300 ml-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300 ml-2">{children}</ol>,
                                        li: ({ children }) => <li className="text-zinc-300 [&>p]:mb-1">{children}</li>,

                                        // Blockquotes
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-600 pl-4 italic text-zinc-400 my-2">{children}</blockquote>,

                                        // Tables (The request!)
                                        table: ({ children }) => <div className="overflow-x-auto my-4 border border-zinc-700 rounded-lg"><table className="min-w-full text-left text-sm">{children}</table></div>,
                                        thead: ({ children }) => <thead className="bg-zinc-800 text-zinc-200 font-semibold">{children}</thead>,
                                        tbody: ({ children }) => <tbody className="divide-y divide-zinc-700 bg-zinc-900/50">{children}</tbody>,
                                        tr: ({ children }) => <tr className="hover:bg-zinc-800/50 transition-colors">{children}</tr>,
                                        th: ({ children }) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
                                        td: ({ children }) => <td className="px-4 py-2 text-zinc-300">{children}</td>,

                                        // Code
                                        code: ({ inline, className, children, ...props }) => {
                                            return <code className="bg-zinc-800 text-red-200 px-1 py-0.5 rounded text-xs mx-0.5 border border-zinc-700/50" {...props}>{children}</code>;
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
        deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY ? new OpenAI({ apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, baseURL: window.location.origin + "/deepseek-api", dangerouslyAllowBrowser: true }) : null,
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
        updateMessage
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

    // --- Hybrid Search Helper ---
    // Uses Gemini Flash to fetch real-time web context 
    const getWebContext = async (query) => {
        try {
            if (!clientsRef.current.genAI) return null;
            const model = clientsRef.current.genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                tools: [{ googleSearch: {} }] // Enable Google Search
            });

            const prompt = `
            Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            User Query: "${query}"
            Task: Search Google for this query. 
            ALWAYS search if the query involves news, current events, weather, sports, or specific facts that might change.
            Only return "NO_SEARCH" if the user is asking for creative writing, simple coding tasks, or strictly internal knowledge (like "who are you").
            Otherwise, return a comprehensive text summary of the search results.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Extract and append sources
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                const sources = groundingMetadata.groundingChunks
                    .map(chunk => chunk.web?.uri ? `[${chunk.web.title || 'Source'}](${chunk.web.uri})` : null)
                    .filter(Boolean);

                if (sources.length > 0) {
                    const uniqueSources = [...new Set(sources)];
                    text += "\n\n**Sources:**\n" + uniqueSources.map(s => `- ${s}`).join("\n");
                }
            }

            if (text.includes("NO_SEARCH")) return null;
            return text;
        } catch (e) {
            console.warn("Web Context Fetch Failed:", e);
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        setInput('');
        setIsProcessing(true);

        // --- 1. Chat Mode ---
        if (mode === 'chat') {
            const userMsg = {
                id: Date.now(),
                role: 'user',
                content: userText,
                attachments: attachments, // Save attachments to history
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            addMessageToSession(currentSessionId, userMsg);

            const currentAttachments = [...attachments]; // Capture for async usage
            setAttachments([]); // Clear UI immediately

            // Create placeholder message ID
            const msgId = Date.now() + 1;
            addMessageToSession(currentSessionId, {
                id: msgId,
                role: 'ai',
                content: '', // Start empty
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            try {
                // Construct fresh history including the new user message
                // Fix: Properly map roles and exclude internal system messages (like "Chat history cleared")
                const historyForModel = [
                    ...currentSession.messages.map(m => {
                        if (m.role === 'ai') return { role: 'assistant', content: m.content };
                        if (m.role === 'user') return { role: 'user', content: m.content };
                        // Ignore internal system messages to prevent context pollution
                        return null;
                    }).filter(Boolean),
                    { role: 'user', content: userText }
                ];

                const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Construct User Profile & Preferences Block
                const userProfileBlock = settings.userProfile.name || settings.userProfile.age || settings.userProfile.about
                    ? `\n\nUSER PROFILE:\nName: ${settings.userProfile.name || 'Unknown'}\nAge: ${settings.userProfile.age || 'Unknown'}\nAbout: ${settings.userProfile.about || 'N/A'}`
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

                    // Sanitize history for Gemini: Must start with User, and alternate User/Model
                    const rawHistory = currentSession.messages.map(m => ({
                        role: m.role === 'ai' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                    }));

                    // Find first user message index
                    const firstUserIndex = rawHistory.findIndex(m => m.role === 'user');

                    // If no user message found in history (e.g. only AI greeting), use empty history
                    // If found, slice from there to ensure it starts with User
                    const validHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

                    const chatSession = model.startChat({
                        history: validHistory,
                    });

                    // Construct Message Parts (Text + Images)
                    const messageParts = [{ text: userText }];
                    currentAttachments.forEach(att => {
                        // Remove data:image/...;base64, prefix for inlineData
                        const base64Data = att.preview.split(',')[1];
                        messageParts.push({
                            inlineData: {
                                mimeType: att.mimeType,
                                data: base64Data
                            }
                        });
                    });

                    const result = await chatSession.sendMessageStream(messageParts);

                    let textAccumulator = "";
                    let gatheredSources = new Set();

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        textAccumulator += chunkText;

                        // Capture sources from chunk metadata
                        const metadata = chunk.candidates?.[0]?.groundingMetadata;
                        if (metadata?.groundingChunks) {
                            metadata.groundingChunks.forEach(chunk => {
                                if (chunk.web?.uri) {
                                    gatheredSources.add(`[${chunk.web.title || 'Source'}](${chunk.web.uri})`);
                                }
                            });
                        }

                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                    // Append unique sources to the final message
                    if (gatheredSources.size > 0) {
                        textAccumulator += "\n\n**Sources:**\n" + Array.from(gatheredSources).map(s => `- ${s}`).join("\n");
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'openai' || selectedModel.provider === 'xai' || selectedModel.provider === 'deepseek') {
                    const client = selectedModel.provider === 'openai' ? clientsRef.current.openai
                        : selectedModel.provider === 'xai' ? clientsRef.current.xai
                            : clientsRef.current.deepseek;

                    if (!client) throw new Error(`${selectedModel.provider} API Key missing`);

                    // --- Dynamic Model Switching (Chat vs Reasoning) ---
                    let targetModelId = selectedModel.id;

                    if (selectedModel.provider === 'deepseek' && isThinkingEnabled) {
                        targetModelId = 'deepseek-reasoner';
                    } else if (selectedModel.provider === 'xai' && isThinkingEnabled) {
                        // targetModelId = 'grok-4-1-reasoning'; // If xAI releases a distinct ID
                    } else if (selectedModel.provider === 'openai' && isThinkingEnabled) {
                        targetModelId = 'gpt-5.2'; // Use base GPT-5.2 for reasoning (Pro is completion-only)
                    }

                    // --- 1. Agent Logic (Non-Scira) ---
                    if (selectedModel.provider !== 'scira') {
                    }

                    // --- Hybrid Search Injection ---
                    let finalSystemPrompt = systemPrompt;

                    // Only search if explicitly enabled by the user
                    if (isSearchEnabled) {
                        try {
                            updateMessage(currentSessionId, msgId, " Searching the web... 🌍"); // Visual feedback

                            const webContext = await getWebContext(userText);
                            if (webContext) {
                                finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT (from Google Search):\n${webContext}\n\nIMPORTANT: You must use the information above to answer. ALWAYS list the sources provided in the context at the end of your response using Markdown format.`;
                                updateMessage(currentSessionId, msgId, " Found info! Thinking... 🧠"); // Visual feedback
                            } else {
                                updateMessage(currentSessionId, msgId, ""); // Clear status
                            }
                        } catch (err) {
                            console.error("Hybrid search error", err);
                            updateMessage(currentSessionId, msgId, "");
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
                        // OpenAI GPT-5.2 Native Reasoning
                        reasoning_effort: (selectedModel.provider === 'openai' && isThinkingEnabled) ? "high" : undefined,
                        // xAI / Grok Native Reasoning Param
                        extra_body: (selectedModel.provider === 'xai' && isThinkingEnabled) ? { reasoning: true } : undefined
                    });

                    let textAccumulator = "";
                    let isThinking = false;

                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta;

                        // Check for native reasoning fields (OpenAI/xAI/Deepseek conventions)
                        const reasoningChunk = delta?.reasoning_content || delta?.reasoning;
                        const contentChunk = delta?.content;

                        if (reasoningChunk) {
                            if (!isThinking) {
                                isThinking = true;
                                textAccumulator += "<think>";
                            }
                            textAccumulator += reasoningChunk;
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        }

                        if (contentChunk) {
                            if (isThinking) {
                                isThinking = false;
                                textAccumulator += "</think>";
                            }
                            textAccumulator += contentChunk;
                            updateMessage(currentSessionId, msgId, textAccumulator);
                        }
                    }

                    // Ensure think block is closed if stream ends while thinking
                    if (isThinking) {
                        textAccumulator += "</think>";
                        updateMessage(currentSessionId, msgId, textAccumulator);
                    }

                } else if (selectedModel.provider === 'anthropic') {
                    if (!clientsRef.current.anthropic) throw new Error("Anthropic API Key missing");

                    // --- Hybrid Search Injection for Anthropic ---
                    let finalSystemPrompt = systemPrompt;
                    if (isSearchEnabled) {
                        try {
                            updateMessage(currentSessionId, msgId, " Searching the web... 🌍"); // Visual feedback

                            const webContext = await getWebContext(userText);
                            if (webContext) {
                                finalSystemPrompt += `\n\nREAL-TIME WEB CONTEXT (from Google Search):\n${webContext}\n\nIMPORTANT: You must use the information above to answer. ALWAYS list the sources provided in the context at the end of your response using Markdown format.`;
                                updateMessage(currentSessionId, msgId, " Found info! Thinking... 🧠"); // Visual feedback
                            } else {
                                updateMessage(currentSessionId, msgId, ""); // Clear status
                            }
                        } catch (err) {
                            console.error("Hybrid search error", err);
                            updateMessage(currentSessionId, msgId, "");
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

                    // Filter history to remove error messages which might confuse the model
                    const cleanHistory = historyForModel.filter(m => !m.content.startsWith("Error:") && !m.content.startsWith(" Connection Failed:"));

                    // --- XPloit: Smart Query Generator for X Mode ---
                    const generateSmartQuery = async (history, currentInput) => {
                        try {
                            if (!clientsRef.current.genAI) return currentInput; // Fallback

                            // Only use last 3 messages for context to keep it fast
                            const recentContext = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
                            if (!recentContext) return currentInput;

                            const model = clientsRef.current.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
                            const prompt = `
            Context:
            ${recentContext}
            
            User's next input: "${currentInput}"
            
            Task: The user wants to search X (Twitter). Based on the context and their input, generate the best 2-3 keywords for a search query.
            - If the user's input is "what about on X?", infer the topic from context.
            - If they ask "what is elon saying", search "Elon Musk".
            - Return ONLY the raw search query string. No quotes, no explanations.
            `;

                            const result = await model.generateContent(prompt);
                            const smartQuery = result.response.text().trim();
                            console.log("Smart X Query:", smartQuery);
                            return smartQuery;
                        } catch (e) {
                            console.warn("Smart Query Failed, using raw input:", e);
                            return currentInput;
                        }
                    };

                    // --- Scira Modes ---
                    if (sciraMode === 'x') {
                        endpoint = "/scira-api/api/xsearch";
                        updateMessage(currentSessionId, msgId, " Analyzing context for X... 🧠");

                        // Generate Context-Aware Query
                        const smartQuery = await generateSmartQuery(cleanHistory, userText);

                        // Update status to show what we are searching for
                        updateMessage(currentSessionId, msgId, ` Searching X for: "${smartQuery}"... 🐦`);

                        body = {
                            query: smartQuery
                        };
                    } else {
                        // Chat Mode (Unified): Include full history and context
                        updateMessage(currentSessionId, msgId, " Thinking... 💭");

                        // We use the same context injection as Chat Mode
                        // Inject Context (Notes & Tasks) if available
                        const notesContext = notes.map(n => `- [${n.title}]: ${n.content.substring(0, 200)}...`).join('\n');
                        const tasksContext = tasks.map(t => `- [${t.status}] ${t.title}`).join('\n');

                        let collapsedHistory = "";
                        if (cleanHistory.length > 0) {
                            collapsedHistory = "PREVIOUS CONVERSATION:\n";
                            cleanHistory.forEach(msg => {
                                const roleName = msg.role === 'user' ? 'User' : 'AI';
                                // Skip system messages or empty content
                                if (msg.content) {
                                    collapsedHistory += `${roleName}: ${msg.content}\n`;
                                }
                            });
                            collapsedHistory += "\n---\n";
                        }

                        // Add the context (Notes/Tasks) if enabled
                        let contextBlock = "";
                        if (notes.length > 0 || tasks.length > 0) {
                            const notesContext = notes.map(n => `- [${n.title}]: ${n.content.substring(0, 200)}...`).join('\n');
                            const tasksContext = tasks.map(t => `- [${t.status}] ${t.title}`).join('\n');
                            contextBlock = `REAL-TIME CONTEXT (Notes & Tasks):\n${notesContext}\n${tasksContext}\n\n---\n`;
                        }

                        const systemInstruction = `You are an AI with real-time internet access. You MUST verify your knowledge with a web search before answering, especially for recent events, news, or technical releases. Do not rely solely on your internal cutoff knowledge. If the user asks about ANY factual topic (sports, news, tech), SEARCH the internet first.`;

                        const finalPrompt = `SYSTEM INSTRUCTION: ${systemInstruction}\n\n${contextBlock}${collapsedHistory}CURRENT USER QUERY: ${userText}`;

                        console.log("Scira Collapsed Payload:", finalPrompt);

                        body = {
                            messages: [
                                { role: "user", content: finalPrompt }
                            ]
                        };
                    }

                    try {
                        const response = await fetch(endpoint, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${import.meta.env.VITE_SCIRA_API_KEY}`
                            },
                            body: JSON.stringify(body)
                        });

                        if (!response.ok) {
                            const errText = await response.text();
                            throw new Error(`Scira API Error: ${response.status} - ${errText}`);
                        }

                        const data = await response.json();
                        let text = data.text || "";

                        if (data.sources && data.sources.length > 0) {
                            text += "\n\n**Sources:**\n" + data.sources.map(s => `- [${s}](${s})`).join("\n");
                        }

                        updateMessage(currentSessionId, msgId, text);
                    } catch (fetchError) {
                        console.error("Scira Fetch Error:", fetchError);
                        throw new Error(`Connection Failed: ${fetchError.message}`);
                    }
                }
            } catch (error) {
                console.error("OpenAI API Error:", error);
                updateMessage(currentSessionId, msgId, `Error: ${error.message} (Full: ${JSON.stringify(error, Object.getOwnPropertyNames(error))})`);
            }
        }

        // --- 2. Agent Mode ---
        else {
            addMessageToSession(currentSessionId, { id: Date.now(), role: 'system', content: `Command: "${userText}"`, timestamp: 'System' });

            try {
                if (!clientsRef.current.genAI) throw new Error("Google API Key missing for Agent mode");
                const model = clientsRef.current.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

                // Enhanced context with dates and status
                const taskContextJSON = JSON.stringify(tasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    date: t.date,
                    priority: t.priority,
                    status: t.status
                })));

                const projectContextJSON = JSON.stringify(projects.map(p => ({
                    id: p.id,
                    name: p.name
                })));

                const prompt = `
          Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          Existing Tasks: ${taskContextJSON}
          Existing Projects: ${projectContextJSON}
          User Request: "${userText}"
          
          You are an intelligent task manager agent. Analyze the User Request and extract the intent.
          
          Object Mapping:
          - Match "delete task X" or "complete task X" to a specific ID from Existing Tasks.
          - If the user refers to a task by name (e.g. "wash winnie"), find the corresponding ID.
          - If the user says "in my X folder" or "project X", try to match it to Existing Projects.
          
          Rules:
          1. EXTRACT the core task title. Remove conversational fillers.
          2. EXTRACT metadata (date, priority, tags, status).
          3. EXTRACT targetProject (name of project if mentioned).
          4. ACTION determination: "create", "update", "delete", "clear", "query".
          5. INTENT MAPPING:
             - "Complete", "finish", "check off", "done" -> action: "update", taskData: { status: "completed" }
             - "Uncheck", "restart", "todo" -> action: "update", taskData: { status: "pending" }
             - "What tasks...", "Show me...", "List..." -> action: "query"
          
          IMPORTANT: 
          - For "update" or "delete", you MUST return the exact 'id' found in Existing Tasks as 'targetId'.
          - For "query", provide a helpful, natural language summary in the 'response' field. Use Markdown formatting (bolding, lists).

          Return JSON ONLY: 
          { 
            "action": "create"|"update"|"delete"|"clear"|"query"|"invalid", 
            "taskData": { "title": "...", "date": "...", "priority": "...", "tags": [...], "status": "pending"|"completed" }, 
            "targetProject": "Project Name or null",
            "targetId": "ID" (from list) or "all", 
            "response": "Natural language answer for queries",
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

                // --- Helper: Smart Project Finding ---
                const findProjectId = (targetName) => {
                    if (!targetName) return null;
                    const lowerTarget = targetName.toLowerCase();
                    const match = projects.find(p => p.name.toLowerCase().includes(lowerTarget));
                    return match ? match.id : null;
                };

                if (actionData.action === 'query') {
                    addMessageToSession(currentSessionId, {
                        id: Date.now() + 1,
                        role: 'ai', // Use AI role for rich text rendering
                        content: actionData.response || "Here are your tasks.",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                } else if (actionData.action === 'create') {
                    // Resolve project ID
                    const projectId = findProjectId(actionData.targetProject);

                    const newTask = {
                        title: actionData.taskData.title || userText,
                        tags: actionData.taskData.tags?.length ? actionData.taskData.tags : ['New'],
                        date: actionData.taskData.date || 'Upcoming',
                        priority: actionData.taskData.priority || 'Medium',
                        projectId: projectId // Can be null if not found
                    };
                    addTask(newTask);

                    const projectMsg = projectId ? ` in project "${projects.find(p => p.id === projectId).name}"` : '';
                    addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Created: ${newTask.title}${projectMsg}`, isSuccess: true });
                } else if (actionData.action === 'update') {
                    if (actionData.targetId === 'all') {
                        tasks.forEach(t => updateTask(t.id, actionData.taskData));
                        addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `Updated all tasks.`, isSuccess: true });
                    } else {
                        const realId = findTaskId(actionData.targetId);
                        if (realId) {
                            updateTask(realId, actionData.taskData);
                            const taskTitle = tasks.find(t => t.id === realId)?.title || 'task';
                            const actionVerb = actionData.taskData.status === 'completed' ? 'Completed' : 'Updated';
                            addMessageToSession(currentSessionId, { id: Date.now() + 1, role: 'system', content: `${actionVerb} "${taskTitle}".`, isSuccess: true });
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
        <div className="flex h-full w-full bg-transparent font-sans text-white relative overflow-hidden">


            {/* --- Left Sidebar: History --- */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <span className="text-xs font-semibold text-zinc-500 tracking-wider">HISTORY</span>
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
                                    className={`w-full text-left px-3 py-3 text-sm transition-all truncate flex items-center justify-between group border-l-2 ${currentSessionId === session.id
                                        ? 'border-purple-500 bg-white/5 text-white'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
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
            <main className="flex-1 flex flex-col relative bg-transparent">

                {/* Header: Mode & Model */}
                <header className="h-14 border-b border-white/5 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
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
                        <button
                            onClick={() => createSession()}
                            className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
                            title="New Chat"
                        >
                            <Plus size={16} /> New
                        </button>
                        <div className="h-4 w-[1px] bg-zinc-800"></div>
                        <button onClick={() => clearSession(currentSessionId)} className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1">
                            <Trash2 size={14} /> Clear
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6" ref={scrollRef}>
                    <div className="max-w-3xl mx-auto space-y-8 pb-4">
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
                                            <div className="relative w-24 h-24 rounded-full bg-zinc-950 flex items-center justify-center border border-white/10 shadow-2xl shadow-black/80">
                                                {/* Inner Gradient */}
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10"></div>

                                                {/* Icon */}
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                >
                                                    <Sparkles size={40} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-light text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight pb-2">
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
                                                className="flex flex-col gap-2 p-5 text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm group shadow-lg shadow-black/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:from-blue-500/10 group-hover:to-purple-500/10 text-zinc-400 group-hover:text-blue-300 transition-all duration-300">
                                                        {item.icon}
                                                    </span>
                                                    <span className="text-zinc-200 font-medium">{item.label}</span>
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

                        {/* Show Message List if we have real interaction (more than 1 msg OR first msg is not generic AI greeting) */}
                        {(!((currentSession.messages.length <= 1 && currentSession.messages[0]?.role === 'ai'))) && currentSession.messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role !== 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
                                        {msg.role === 'system' ? <Command size={14} className="text-zinc-400" /> : <Sparkles size={16} className="text-white" />}
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'space-y-1' : ''}`}>
                                    {/* Render Attachments if any */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                                            {msg.attachments.map((att, idx) => (
                                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-700/50 w-32 h-32 bg-zinc-900">
                                                    {att.type === 'image' ? (
                                                        <img src={att.preview} alt="Attachment" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                                            <FileText size={24} />
                                                            <span className="text-[10px] mt-2 px-2 truncate w-full text-center">{att.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

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

                        {/* Processing indicator removed as per user request */}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2">
                    <div className="max-w-3xl mx-auto relative group z-20">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none -top-20" />
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 focus-within:shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)] rounded-2xl flex items-end p-2 transition-all duration-300">
                            <div className="pl-2 pb-2 flex items-center">
                                <ModelSelector />
                                {selectedModel.provider === 'scira' && (
                                    <div className="flex items-center ml-2 bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
                                        {[
                                            { id: 'chat', label: 'Chat', icon: MessageSquare },
                                            { id: 'x', label: 'X', icon: ({ size, className }) => <span className={`font-bold text-[10px] ${className}`} style={{ fontSize: size }}>𝕏</span> }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSciraMode(m.id)}
                                                className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 ${sciraMode === m.id ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                title={`${m.label} Mode`}
                                            >
                                                <m.icon size={14} />
                                                <span className="text-[10px] font-medium">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="h-4 w-[1px] bg-zinc-800 mx-2"></div>
                                <button
                                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                    className={`p-1.5 rounded-md transition-colors ${isThinkingEnabled
                                        ? 'bg-purple-500/10 text-purple-300'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                        }`}
                                    title="Extended Thinking"
                                >
                                    <BrainCircuit size={14} />
                                </button>

                                <button
                                    onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                                    className={`p-1.5 rounded-md transition-colors ${isSearchEnabled
                                        ? 'bg-blue-500/10 text-blue-300'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                        }`}
                                    title="Web Search"
                                >
                                    <Globe size={14} />
                                </button>
                            </div>

                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-2 w-full px-2 flex gap-2 overflow-x-auto">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="relative group w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg">
                                            {att.type === 'image' ? (
                                                <img src={att.preview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeAttachment(idx)}
                                                className="absolute top-0 right-0 p-0.5 bg-black/50 text-white hover:text-red-400 rounded-bl-md transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-end flex-1 gap-2">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={mode === 'chat' ? "Message Bart..." : "Enter a task Command..."}
                                    className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm px-3 py-3 w-full resize-none max-h-40"
                                    rows={1}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 mb-1 text-zinc-500 hover:text-white transition-colors"
                                    title="Attach files"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!input && attachments.length === 0}
                                    className={`p-2 rounded-lg mb-1 transition-all ${input.trim() || attachments.length > 0 ? 'bg-white text-black' : 'bg-transparent text-zinc-600'
                                        }`}
                                >
                                    <ArrowUp size={18} />
                                </button>
                            </div>
                        </div>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,application/pdf"
                        />
                        <div className="text-center mt-2 text-[10px] text-zinc-700">
                            Bart may display inaccurate info, including about people, so double-check its responses.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
