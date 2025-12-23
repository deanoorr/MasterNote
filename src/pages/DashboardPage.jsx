import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';

import { motion } from 'framer-motion';
import DigitalCompanion from '../components/DigitalCompanion';
import { Activity, CheckCircle, TrendingUp, AlertCircle, ArrowRight, Clock, Sparkles, CheckCircle2, Layout as LayoutIcon } from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
    const { tasks, updateTask, projects } = useTasks();
    const { habits, toggleHabit } = useHabits();
    const { user } = useSettings();


    const userName = user?.name || 'User';
    const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5);
    const todaysHabits = habits;

    const isCompletedToday = (habit) => {
        const today = new Date().toLocaleDateString('en-CA');
        return habit.completedDates.includes(today);
    };

    const handleToggleTask = (task) => {
        // Toggle between pending/completed (or other logic if needed)
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTask(task.id, { status: newStatus });
    };

    return (
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* 1. Digital Companion Header */}
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                    <DigitalCompanion />

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name || 'Friend'}.
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
                            Ready to make today count?
                        </p>
                    </motion.div>
                </div>

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

                {/* 4. Active Projects */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <LayoutIcon className="text-indigo-500" size={20} />
                        Active Projects
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* We need projects here. It's not in the hook above yet. Adding import/hook usage. */}
                        {projects.filter(p => p.id !== 'all').map(project => {
                            const pTasks = tasks.filter(t => t.projectId === project.id);
                            const pCompleted = pTasks.filter(t => t.status === 'completed' || t.completed).length;
                            const pProgress = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : 0;

                            return (
                                <motion.div
                                    key={project.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => onNavigate(`project:${project.id}`)}
                                    className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${project.color || 'bg-zinc-500'} bg-opacity-20 text-indigo-600 dark:text-indigo-400`}>
                                            <LayoutIcon size={18} />
                                        </div>
                                        <ArrowRight size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">{project.name}</h3>
                                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                                        <span>{pTasks.length} tasks</span>
                                        <span>{pProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pProgress}%` }}
                                            className={`h-full ${project.color || 'bg-indigo-500'}`}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Productivity Analytics (Visual) */}
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-3xl p-8 transform transition-all hover:shadow-lg hover:shadow-purple-500/5">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                            <TrendingUp size={24} />
                        </div>
                        Productivity Insights
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* 1. Completion Rate (Donut Chart) */}
                        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-zinc-100 dark:text-zinc-800"
                                    />
                                    <motion.circle
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) : 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        className="text-purple-500"
                                        style={{ pathLength: 0 }} // Required for motion initial state
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                                    </span>
                                    <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Complete</span>
                                </div>
                            </div>
                            <p className="text-center text-zinc-500 text-sm mt-4">
                                You've completed <span className="font-bold text-zinc-900 dark:text-white">{tasks.filter(t => t.status === 'completed').length}</span> out of {tasks.length} tasks.
                            </p>
                        </div>

                        {/* 2. Task Distribution (Visual Bars) */}
                        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-white/5 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Task Distribution</h3>

                            <div className="space-y-6">
                                {/* Completed */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
                                        <span className="text-zinc-500">{tasks.filter(t => t.status === 'completed').length} tasks</span>
                                    </div>
                                    <div className="w-full h-2 bg-emerald-500/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* In Progress */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-medium text-amber-600 dark:text-amber-400">In Progress</span>
                                        <span className="text-zinc-500">{tasks.filter(t => t.status === 'in_progress').length} tasks</span>
                                    </div>
                                    <div className="w-full h-2 bg-amber-500/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'in_progress').length / tasks.length) * 100 : 0}%` }}
                                            transition={{ duration: 1, delay: 0.4 }}
                                            className="h-full bg-amber-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* To Do */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-medium text-zinc-600 dark:text-zinc-400">To Do</span>
                                        <span className="text-zinc-500">{tasks.filter(t => t.status === 'pending' || !t.status).length} tasks</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'pending' || !t.status).length / tasks.length) * 100 : 0}%` }}
                                            transition={{ duration: 1, delay: 0.6 }}
                                            className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Priority Focus (Card) */}
                        <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden flex flex-col justify-between">
                            {/* Abstract Shapes */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl transform -translate-x-5 translate-y-5" />

                            <div>
                                <h3 className="text-rose-100 text-sm font-medium mb-1 relative z-10">Attention Needed</h3>
                                <div className="flex items-baseline gap-2 relative z-10 mb-4">
                                    <span className="text-5xl font-bold">
                                        {tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length}
                                    </span>
                                    <span className="text-rose-100/80">high priority</span>
                                </div>
                                <p className="text-sm text-rose-50/90 leading-relaxed relative z-10">
                                    High priority tasks pending. Resolve them to improve your workflow.
                                </p>
                            </div>

                            <button
                                onClick={() => onNavigate('workspace')}
                                className="w-full mt-6 bg-white text-rose-600 py-3 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors shadow-sm relative z-10 flex items-center justify-center gap-2"
                            >
                                View Updates <ArrowRight size={16} />
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
