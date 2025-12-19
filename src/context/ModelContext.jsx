import React, { createContext, useContext, useState } from 'react';
import { Sparkles, Zap, BrainCircuit } from 'lucide-react';

const ModelContext = createContext();

export const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', icon: Zap, color: 'text-amber-400', provider: 'google', thinking: false },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', icon: Sparkles, color: 'text-blue-400', provider: 'google', thinking: false },
    { id: 'gpt-5.2-chat-latest', name: 'GPT-5.2', icon: BrainCircuit, color: 'text-green-400', provider: 'openai', thinking: true },
    { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1', icon: Zap, color: 'text-purple-400', provider: 'xai', thinking: true },
    { id: 'claude-sonnet-4-5', name: 'Claude 4.5 Sonnet', icon: Sparkles, color: 'text-orange-400', provider: 'anthropic', thinking: true },
    { id: 'claude-opus-4-5', name: 'Claude 4.5 Opus', icon: BrainCircuit, color: 'text-red-400', provider: 'anthropic', thinking: true },
    { id: 'scira-default', name: 'Scira', icon: Zap, color: 'text-indigo-400', provider: 'scira', thinking: false },
    { id: 'deepseek-chat', name: 'DeepSeek V3', icon: BrainCircuit, color: 'text-cyan-400', provider: 'deepseek', thinking: true },
    { id: 'kimi-latest', name: 'Kimi k2', icon: Sparkles, color: 'text-pink-400', provider: 'moonshot', thinking: true },
    { id: 'openrouter-auto', name: 'All Models', icon: Zap, color: 'text-violet-400', provider: 'openrouter', thinking: false },
];

export function ModelProvider({ children }) {
    const [selectedModel, setSelectedModel] = useState(models[3]); // Default to Grok 4.1
    const [openRouterModels, setOpenRouterModels] = useState([]);
    const [selectedOpenRouterModel, setSelectedOpenRouterModel] = useState(null);

    const fetchOpenRouterModels = async () => {
        try {
            const response = await fetch('/openrouter-api/models');
            if (response.ok) {
                const data = await response.json();
                setOpenRouterModels(data.data.sort((a, b) => a.name.localeCompare(b.name)));
                if (!selectedOpenRouterModel && data.data.length > 0) {
                    // Default to a popular free model or just the first one if not set
                    const defaultModel = data.data.find(m => m.id === 'google/gemini-2.0-flash-exp:free') || data.data[0];
                    setSelectedOpenRouterModel(defaultModel);
                }
            }
        } catch (error) {
            console.error("Failed to fetch OpenRouter models:", error);
        }
    };

    return (
        <ModelContext.Provider value={{
            selectedModel,
            setSelectedModel,
            models,
            openRouterModels,
            selectedOpenRouterModel,
            setSelectedOpenRouterModel,
            fetchOpenRouterModels
        }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    return useContext(ModelContext);
}
