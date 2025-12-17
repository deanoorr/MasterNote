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
            // Reverted to gemini-3-flash-preview per user request
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

            const prompt = `
                You are a behavioral psychology expert.
                Task: Create a set of 3-5 daily habits to help achieve the user's goal.
                Focus on behavioral psychology but keep them CONCISE, ACTIONABLE, and EASY TO DIGEST.
                Limit each habit to maximum 15 words.
                Return ONLY a JSON array of strings. No markdown formatting.
                Example Output: ["Read 5 pages", "Place book on pillow", "Drink 1 glass of water"]

                User Goal: "${userGoal}"
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
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="max-w-4xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 mb-2 flex items-center gap-4">
                            <Activity className="text-blue-400" size={32} />
                            Habit Tracker
                        </h1>
                        <p className="text-zinc-400 text-lg">Elevate your daily routine with precision and consistency.</p>
                    </div>
                </div>

                {/* AI Helper Section */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden shadow-2xl">
                        <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                            <Sparkles size={200} className="text-indigo-400" />
                        </div>

                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                            <Sparkles className="text-blue-400" size={22} />
                            AI Habit Architect
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={userGoal}
                                    onChange={(e) => setUserGoal(e.target.value)}
                                    placeholder="I want to master deep work..."
                                    className="w-full bg-black/60 border border-white/5 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 outline-none placeholder:text-zinc-600 transition-all shadow-inner text-lg"
                                    onKeyDown={(e) => e.key === 'Enter' && generateHabits()}
                                />
                            </div>
                            <button
                                onClick={generateHabits}
                                disabled={isGenerating || !userGoal.trim()}
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Architecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>Generate Framework</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Manual Add */}
                <form onSubmit={handleManualAdd} className="flex gap-4 items-center px-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="Construct a custom habit..."
                            className="w-full bg-transparent border-b border-white/5 text-white px-0 py-3 focus:border-indigo-500/50 outline-none placeholder:text-zinc-700 transition-all text-lg"
                        />
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 group-focus-within:w-full"></div>
                    </div>
                    <button
                        type="submit"
                        disabled={!manualInput.trim()}
                        className="p-3 rounded-full bg-white/5 text-zinc-400 hover:text-indigo-400 hover:bg-white/10 disabled:opacity-20 transition-all"
                    >
                        <Plus size={28} />
                    </button>
                </form>

                {/* Habits List */}
                <div className="grid gap-4">
                    {habits.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Activity size={48} className="mx-auto text-zinc-800 mb-4" />
                            <p className="text-zinc-500 text-lg">Your habit landscape is currently pristine.</p>
                            <p className="text-zinc-600 text-sm mt-2">Begin your journey by adding a habit above.</p>
                        </div>
                    ) : (
                        habits.map(habit => (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg"
                            >
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => toggleHabit(habit.id)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isCompletedToday(habit)
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)]'
                                            : 'bg-black/60 border border-white/10 text-zinc-700 hover:border-indigo-500/50 hover:text-indigo-400'
                                            }`}
                                    >
                                        {isCompletedToday(habit) ? (
                                            <Check size={22} strokeWidth={3} />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-indigo-900 transition-colors"></div>
                                        )}
                                    </button>
                                    <div>
                                        <h3 className={`text-lg font-medium transition-all duration-500 ${isCompletedToday(habit) ? 'text-zinc-600 line-through' : 'text-white'}`}>
                                            {habit.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs mt-2">
                                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${habit.streak > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800/50 text-zinc-600'}`}>
                                                <Flame size={14} className={habit.streak > 0 ? 'animate-pulse' : ''} />
                                                <span className="font-semibold">{habit.streak} DAY STREAK</span>
                                            </span>
                                            <span className="text-zinc-600 uppercase tracking-widest font-bold">Daily Ritual</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="p-3 text-zinc-700 hover:text-red-400/80 hover:bg-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>

    );
}
