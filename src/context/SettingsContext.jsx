import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const defaultSettings = {
    userProfile: {
        name: '',
        age: '',
        about: ''
    },
    aiPreferences: {
        customInstructions: '',
        tone: 'professional' // professional, witty, friendly, pirate
    }
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('bart_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('bart_settings', JSON.stringify(settings));
    }, [settings]);

    const updateProfile = (profileUpdates) => {
        setSettings(prev => ({
            ...prev,
            userProfile: { ...prev.userProfile, ...profileUpdates }
        }));
    };

    const updateAiPreferences = (prefUpdates) => {
        setSettings(prev => ({
            ...prev,
            aiPreferences: { ...prev.aiPreferences, ...prefUpdates }
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateProfile, updateAiPreferences }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
