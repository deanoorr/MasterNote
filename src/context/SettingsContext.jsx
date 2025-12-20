
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const defaultSettings = {
    userProfile: {
        name: '',
        age: '',
        about: ''
    },
    aiPreferences: {
        customInstructions: '',
        tone: 'professional'
    }
};

export function SettingsProvider({ children }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState(defaultSettings);

    useEffect(() => {
        if (!user) {
            setSettings(defaultSettings);
            return;
        }

        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is Row not found
                    console.error(error);
                }

                if (data) {
                    const prefs = data.preferences || {};
                    setSettings({
                        userProfile: prefs.userProfile || defaultSettings.userProfile,
                        aiPreferences: prefs.aiPreferences || defaultSettings.aiPreferences
                    });
                } else {
                    // Initial setup if row missing (trigger should have created it, but just in case)
                    // Or if trigger didn't run for existing users
                    await supabase.from('settings').upsert({ user_id: user.id });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };

        fetchSettings();
    }, [user]);

    const saveSettings = async (newSettings) => {
        if (!user) return;
        // Merge with existing preferences to not lose projects/folders
        const { data } = await supabase.from('settings').select('preferences').eq('user_id', user.id).single();
        const currentPrefs = data?.preferences || {};

        await supabase.from('settings').update({
            preferences: {
                ...currentPrefs,
                userProfile: newSettings.userProfile,
                aiPreferences: newSettings.aiPreferences
            }
        }).eq('user_id', user.id);
    };

    const updateProfile = (profileUpdates) => {
        setSettings(prev => {
            const next = {
                ...prev,
                userProfile: { ...prev.userProfile, ...profileUpdates }
            };
            saveSettings(next);
            return next;
        });
    };

    const updateAiPreferences = (prefUpdates) => {
        setSettings(prev => {
            const next = {
                ...prev,
                aiPreferences: { ...prev.aiPreferences, ...prefUpdates }
            };
            saveSettings(next);
            return next;
        });
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
