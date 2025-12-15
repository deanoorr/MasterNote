import React, { createContext, useContext, useState } from 'react';
import { Sparkles, Zap, BrainCircuit } from 'lucide-react';

const ModelContext = createContext();

export const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', icon: Zap, color: 'text-yellow-400', provider: 'google' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', icon: Sparkles, color: 'text-blue-400', provider: 'google' },
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
