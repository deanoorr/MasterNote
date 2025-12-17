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

];

export function ModelProvider({ children }) {
    const [selectedModel, setSelectedModel] = useState(models[0]); // Default to Gemini 2.5 Flash

    return (
        <ModelContext.Provider value={{ selectedModel, setSelectedModel, models }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    return useContext(ModelContext);
}
