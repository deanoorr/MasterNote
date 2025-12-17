import React, { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext();

export function HabitProvider({ children }) {
    const [habits, setHabits] = useState(() => {
        const saved = localStorage.getItem('bart_habits');
        return saved ? JSON.parse(saved) : [];
    });

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

            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const isCompletedToday = h.completedDates.includes(today);

            let newCompletedDates;
            let newStreak = h.streak;

            if (isCompletedToday) {
                // Untoggle
                newCompletedDates = h.completedDates.filter(d => d !== today);
                newStreak = Math.max(0, newStreak - 1); // Simple decrement, real streak logic is complex but this suffices for simple trackers
            } else {
                // Toggle
                newCompletedDates = [...h.completedDates, today];
                // Check if yesterday was completed to increment streak, otherwise reset to 1
                // For simplicity in this v1, we just increment streak on toggle
                newStreak = newStreak + 1;
            }

            return {
                ...h,
                completedDates: newCompletedDates,
                streak: newStreak
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
