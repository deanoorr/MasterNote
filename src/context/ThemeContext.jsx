
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const { user } = useAuth();
    // Default to 'dark' initially or checking system pref locally before auth loads
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            // Keep strictly local fallback for unauth/loading state
            // But valid source of truth is DB when logged in
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'dark'; // Force dark as requested default, or light if preferred? User requested premium dark.
            }
        }
        return 'dark';
    });

    useEffect(() => {
        if (!user) return; // Keep local state if no user

        const fetchTheme = async () => {
            const { data } = await supabase.from('settings').select('theme').eq('user_id', user.id).single();
            if (data?.theme) {
                setTheme(data.theme);
            }
        };
        fetchTheme();
    }, [user]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // We can still use localStorage as a cache/backup for faster load before auth
        localStorage.setItem('bart_theme', theme);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (user) {
            await supabase.from('settings').update({ theme: newTheme }).eq('user_id', user.id);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
