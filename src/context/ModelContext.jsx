import React, { createContext, useContext, useState } from 'react';
import { Sparkles, Zap, BrainCircuit } from 'lucide-react';

const ModelContext = createContext();

export const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', icon: Zap, color: 'text-yellow-400', provider: 'google', thinking: false },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', icon: Sparkles, color: 'text-blue-400', provider: 'google', thinking: false },
    { id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2', icon: BrainCircuit, color: 'text-green-400', provider: 'openai', thinking: false },
    { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Thinking', icon: Zap, color: 'text-purple-400', provider: 'xai', thinking: true },
    { id: 'claude-sonnet-4-5', name: 'Claude 4.5 Sonnet', icon: Sparkles, color: 'text-orange-400', provider: 'anthropic', thinking: false },
    { id: 'claude-opus-4-5', name: 'Claude 4.5 Opus', icon: BrainCircuit, color: 'text-red-400', provider: 'anthropic', thinking: false }
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
