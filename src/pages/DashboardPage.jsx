import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';

import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Circle, Clock, Loader2, ArrowRight, Activity } from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
    const { tasks, updateTask } = useTasks();
    const { habits, toggleHabit } = useHabits();
    const { settings } = useSettings();

    const [briefing, setBriefing] = useState('');


    const userName = settings?.userProfile?.name || 'User';
    const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5);
    const todaysHabits = habits; // In a real app, filter by day of week if needed

    // Generate Morning Briefing
    useEffect(() => {
        const taskName = pendingTasks[0]?.title || "your goals";
        setBriefing(`Good day, ${userName}! Time to crush ${taskName} and have a great one.`);
    }, [userName, pendingTasks]);

    const isCompletedToday = (habit) => {
        const today = new Date().toLocaleDateString('en-CA');
        return habit.completedDates.includes(today);
    };

    const handleToggleTask = (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTask(task.id, { status: newStatus });
    };

    return (
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* 1. Morning Briefing Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-900/20"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={120} className="text-zinc-900 dark:text-white" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Command Center</h1>
                        <p className="text-xl text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
                            {briefing}
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* 2. Today's Focus (Tasks) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <CheckCircle2 className="text-blue-500" size={20} />
                                Today's Focus
                            </h2>
                            <button
                                onClick={() => onNavigate('workspace')}
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
                            >
                                View All <ArrowRight size={12} />
                            </button>
                        </div>

                        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-4 min-h-[200px]">
                            {pendingTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-600 p-8">
                                    <Clock size={32} className="mb-2 opacity-50" />
                                    <p>All caught up!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="group flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                                            onClick={() => handleToggleTask(task)}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-blue-500 border-blue-500' : 'border-zinc-400 dark:border-zinc-600 group-hover:border-zinc-600 dark:group-hover:border-zinc-500'}`}>
                                                {task.status === 'completed' && <CheckCircle2 size={14} className="text-white dark:text-black" />}
                                            </div>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-sm truncate flex-1">{task.title}</span>
                                            {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Habit Pulse */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Activity className="text-emerald-500" size={20} />
                                Habit Pulse
                            </h2>
                            <button
                                onClick={() => onNavigate('habits')}
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
                            >
                                Manage <ArrowRight size={12} />
                            </button>
                        </div>

                        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-4 min-h-[200px]">
                            {todaysHabits.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-600 p-8">
                                    <Sparkles size={32} className="mb-2 opacity-50" />
                                    <p>No active habits.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todaysHabits.map(habit => {
                                        const completed = isCompletedToday(habit);
                                        return (
                                            <div
                                                key={habit.id}
                                                className="group flex items-center justify-between gap-4 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                                                onClick={() => toggleHabit(habit.id)}
                                            >
                                                <span className={`text-sm transition-colors flex-1 ${completed ? 'text-emerald-500/50 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                    {habit.title}
                                                </span>
                                                <div className={`w-8 h-5 rounded-full flex items-center p-0.5 transition-colors shrink-0 ${completed ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'}`}>
                                                    <motion.div
                                                        layout
                                                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
