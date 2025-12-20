
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const HabitContext = createContext();

export function HabitProvider({ children }) {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);

    // Helper: Calculate streak based on completed dates
    const calculateStreak = (completedDates) => {
        if (!completedDates || completedDates.length === 0) return 0;

        const uniqueDates = [...new Set(completedDates)].sort();
        const today = new Date().toLocaleDateString('en-CA');
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toLocaleDateString('en-CA');

        const lastCompleted = uniqueDates[uniqueDates.length - 1];

        if (lastCompleted !== today && lastCompleted !== yesterday) {
            return 0;
        }

        let streak = 0;
        let currentCheckDate = new Date();

        while (true) {
            const checkString = currentCheckDate.toLocaleDateString('en-CA');
            if (uniqueDates.includes(checkString)) {
                streak++;
            } else {
                if (checkString !== today) {
                    break;
                }
            }
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
            if (streak > 9999) break;
        }
        return streak;
    };

    useEffect(() => {
        if (!user) {
            setHabits([]);
            return;
        }

        const fetchHabits = async () => {
            try {
                const { data, error } = await supabase
                    .from('habits')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setHabits(data.map(h => ({
                    id: h.id,
                    title: h.name,
                    frequency: h.frequency || 'daily',
                    streak: h.streak || 0, // Server streak or recalc?
                    completedDates: h.history?.dates || [], // Stored as object { dates: [] }
                    createdAt: h.created_at
                })).map(h => ({ ...h, streak: calculateStreak(h.completedDates) })));
                // Recalc streak on load to be sure

            } catch (error) {
                console.error('Error loading habits:', error);
            }
        };

        fetchHabits();
    }, [user]);

    const addHabit = async (habit) => {
        if (!user) return;

        const newHabitPayload = {
            user_id: user.id,
            name: habit.title,
            frequency: habit.frequency || 'daily',
            streak: 0,
            history: { dates: [] }
        };

        try {
            const { data, error } = await supabase.from('habits').insert([newHabitPayload]).select().single();
            if (error) throw error;

            const newHabit = {
                id: data.id,
                title: data.name,
                frequency: data.frequency,
                streak: 0,
                completedDates: [],
                createdAt: data.created_at
            };
            setHabits(prev => [newHabit, ...prev]);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteHabit = async (id) => {
        setHabits(prev => prev.filter(h => h.id !== id));
        if (!user) return;
        await supabase.from('habits').delete().eq('id', id);
    };

    const toggleHabit = async (id) => {
        if (!user) return;

        // Optimistic update
        let updatedHabit;
        setHabits(prev => prev.map(h => {
            if (h.id !== id) return h;

            const today = new Date().toLocaleDateString('en-CA');
            const isCompletedToday = h.completedDates.includes(today);
            let newCompletedDates;

            if (isCompletedToday) {
                newCompletedDates = h.completedDates.filter(d => d !== today);
            } else {
                newCompletedDates = [...h.completedDates, today];
            }

            const newStreak = calculateStreak(newCompletedDates);
            updatedHabit = { ...h, completedDates: newCompletedDates, streak: newStreak };
            return updatedHabit;
        }));

        // DB Update
        if (updatedHabit) {
            await supabase.from('habits').update({
                streak: updatedHabit.streak,
                history: { dates: updatedHabit.completedDates }
            }).eq('id', id);
        }
    };

    return (
        <HabitContext.Provider value={{ habits, addHabit, deleteHabit, toggleHabit }}>
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    return useContext(HabitContext);
}
