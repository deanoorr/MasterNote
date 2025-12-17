import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Plus, Trash2, Check, Sparkles, Activity, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function HabitsPage() {
    const { habits, addHabit, toggleHabit, deleteHabit } = useHabits();
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [userGoal, setUserGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    // Suggestions state removed as we auto-add
    const [manualInput, setManualInput] = useState('');

    const generateHabits = async () => {
        if (!userGoal.trim()) return;
        setIsGenerating(true);

        try {
            const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
            if (!apiKey) throw new Error("Google API Key missing");

            const genAI = new GoogleGenerativeAI(apiKey);
            // Reverted to gemini-2.5-flash as requested, but keeping in-depth prompt
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
                User Goal: "${userGoal}"
                Task: Create a set of 3-5 daily habits to help achieve this goal. 
                Focus on behavioral psychology but keep them CONCISE, ACTIONABLE, and EASY TO DIGEST.
                Limit each habit to maximum 15 words.
                Return ONLY a JSON array of strings. No markdown formatting.
                Example Output: ["Read 5 pages", "Place book on pillow", "Drink 1 glass of water"]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanText = text.replace(/```json|```/g, '').trim();
            const habitsArray = JSON.parse(cleanText);

            if (Array.isArray(habitsArray)) {
                // Auto-add habits immediately
                habitsArray.forEach(habitTitle => {
                    addHabit({ title: habitTitle });
                });
                setUserGoal(''); // Clear input on success
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert(`Error generating habits: ${error.message || error}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleManualAdd = (e) => {
        e.preventDefault();
        if (manualInput.trim()) {
            addHabit({ title: manualInput });
            setManualInput('');
        }
    };

    const isCompletedToday = (habit) => {
        const today = new Date().toLocaleDateString('en-CA');
        return habit.completedDates.includes(today);
    };

    return (
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar bg-zinc-950">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Activity className="text-emerald-400" />
                            Habit Tracker
                        </h1>
                        <p className="text-zinc-400">Build better habits, one day at a time.</p>
                    </div>
                </div>

                {/* AI Helper Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={100} className="text-emerald-400" />
                    </div>

                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={18} />
                        AI Habit Coach
                    </h2>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={userGoal}
                            onChange={(e) => setUserGoal(e.target.value)}
                            placeholder="I want to read more..."
                            className="flex-1 bg-zinc-800 border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none placeholder:text-zinc-600"
                            onKeyDown={(e) => e.key === 'Enter' && generateHabits()}
                        />
                        <button
                            onClick={generateHabits}
                            disabled={isGenerating || !userGoal.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isGenerating ? 'Thinking...' : 'Generate Plan'}
                        </button>
                    </div>

                    {/* AI Suggestions Removed - Auto-add implemented */}
                </div>

                {/* Manual Add */}
                <form onSubmit={handleManualAdd} className="flex gap-4">
                    <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Add a new habit manually..."
                        className="flex-1 bg-transparent border-b border-zinc-800 text-white px-2 py-2 focus:border-emerald-500 outline-none placeholder:text-zinc-700 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!manualInput.trim()}
                        className="text-zinc-500 hover:text-emerald-400 disabled:opacity-30 transition-colors"
                    >
                        <Plus size={24} />
                    </button>
                </form>

                {/* Habits List */}
                <div className="space-y-3">
                    {habits.length === 0 ? (
                        <div className="text-center py-12 text-zinc-600">
                            <p>No habits yet. Start by adding one or ask the AI for help!</p>
                        </div>
                    ) : (
                        habits.map(habit => (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleHabit(habit.id)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompletedToday(habit)
                                            ? 'bg-emerald-500 text-black scale-110'
                                            : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {isCompletedToday(habit) && <Check size={18} strokeWidth={3} />}
                                    </button>
                                    <div>
                                        <h3 className={`font-medium transition-all ${isCompletedToday(habit) ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                            {habit.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Flame size={12} className={habit.streak > 0 ? 'text-orange-500' : 'text-zinc-600'} />
                                                {habit.streak} day streak
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
