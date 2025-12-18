import React, { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext();

export function HabitProvider({ children }) {
    const [habits, setHabits] = useState(() => {
        const saved = localStorage.getItem('bart_habits');
        return saved ? JSON.parse(saved) : [];
    });

    // Helper: Calculate streak based on completed dates
    const calculateStreak = (completedDates) => {
        if (!completedDates || completedDates.length === 0) return 0;

        const uniqueDates = [...new Set(completedDates)].sort(); // Ensure sorted ascending
        const today = new Date().toLocaleDateString('en-CA');
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toLocaleDateString('en-CA');

        const lastCompleted = uniqueDates[uniqueDates.length - 1];

        // If the last completion was before yesterday, streak is broken -> 0
        if (lastCompleted !== today && lastCompleted !== yesterday) {
            return 0;
        }

        let streak = 0;
        let currentCheckDate = new Date();

        // Check backwards from today
        // If today is completed, streak starts at 1. If not, we check yesterday.
        // We iterate backwards day by day.

        // Optimization: Loop backwards checking strings
        while (true) {
            const checkString = currentCheckDate.toLocaleDateString('en-CA');
            if (uniqueDates.includes(checkString)) {
                streak++;
            } else {
                // If we miss a day, check if it's today. 
                // If it's today and we missed it, the streak might still be alive from yesterday.
                // But if we missed any other day (yesterday or before), streak breaks.
                if (checkString !== today) {
                    break;
                }
            }
            // Move back one day
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);

            // Safety break for infinite loops (though logic shouldn't allow it)
            if (streak > 9999) break;
        }

        return streak;
    };

    // Recalculate streaks on mount (in case day changed while app was closed)
    useEffect(() => {
        setHabits(prev => prev.map(h => ({
            ...h,
            streak: calculateStreak(h.completedDates)
        })));
    }, []);

    useEffect(() => {
        localStorage.setItem('bart_habits', JSON.stringify(habits));
    }, [habits]);

    const addHabit = (habit) => {
        const newHabit = {
            id: crypto.randomUUID(),
            title: habit.title,
            frequency: habit.frequency || 'daily',
            streak: 0,
            completedDates: [], // Strings 'YYYY-MM-DD'
            createdAt: new Date().toISOString()
        };
        setHabits(prev => [newHabit, ...prev]);
    };

    const deleteHabit = (id) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    };

    const toggleHabit = (id) => {
        setHabits(prev => prev.map(h => {
            if (h.id !== id) return h;

            const today = new Date().toLocaleDateString('en-CA');
            const isCompletedToday = h.completedDates.includes(today);

            let newCompletedDates;

            if (isCompletedToday) {
                // Untoggle
                newCompletedDates = h.completedDates.filter(d => d !== today);
            } else {
                // Toggle
                newCompletedDates = [...h.completedDates, today];
            }

            return {
                ...h,
                completedDates: newCompletedDates,
                streak: calculateStreak(newCompletedDates)
            };
        }));
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
