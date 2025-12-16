import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Tag, AlertCircle, Check, Trash2, Clock, Plus, X, Edit2, Save, ListFilter } from 'lucide-react';

import { useTasks } from '../context/TaskContext';

export default function TaskManager() {
    const { tasks, addTask, updateTask, deleteTask } = useTasks();
    const [showAdd, setShowAdd] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    // Initialize with today's date in YYYY-MM-DD format for the input
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskPriority, setNewTaskPriority] = useState('Medium');
    const [sortBy, setSortBy] = useState('date'); // 'date', 'priority'


    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editPriority, setEditPriority] = useState('');

    const toggleStatus = (id, currentStatus) => {
        updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' });
    };

    const handleManualAdd = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        addTask({
            title: newTaskTitle,
            tags: ['Manual'],
            date: newTaskDate, // Will be YYYY-MM-DD
            priority: newTaskPriority
        });
        setNewTaskTitle('');
        setNewTaskDate(new Date().toISOString().split('T')[0]); // Reset to today
        setNewTaskPriority('Medium');
        setShowAdd(false);
    };

    const startEditing = (task) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        // Handle different date formats or default to today if strict parsing fails,
        // but for now assume it fits or user re-picks.
        // If date is "Today"/"Tomorrow", we might want to convert to YYYY-MM-DD for the input
        // or just let them pick a new one. Let's default to current value if it resembles a date, else today.
        setEditDate(task.date.includes('-') ? task.date : new Date().toISOString().split('T')[0]);
        setEditPriority(task.priority || 'Medium');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle('');
        setEditDate('');
        setEditPriority('');
    };

    const saveEdit = () => {
        if (!editTitle.trim()) return;
        updateTask(editingId, {
            title: editTitle,
            date: editDate,
            priority: editPriority
        });
        cancelEditing();
    };

    const getSortedTasks = () => {
        return [...tasks].sort((a, b) => {
            // First sort by status (pending first)
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }

            if (sortBy === 'priority') {
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                const pA = priorityWeight[a.priority] || 0;
                const pB = priorityWeight[b.priority] || 0;
                return pB - pA; // Descending priority
            } else if (sortBy === 'date') {
                // Simple string compare works reasonably for YYYY-MM-DD and "Today"/"Tomorrow" (Today > Tomorrow alphabetically if not careful, but usually we want date objects)
                // Let's force a basic date parse if possible, or fall back to string
                const dateValue = (d) => {
                    if (d === 'Today') return new Date().toISOString();
                    if (d === 'Tomorrow') {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return tomorrow.toISOString();
                    }
                    return d;
                };
                return dateValue(a.date).localeCompare(dateValue(b.date));
            }
            return 0;
        });
    };

    const sortedTasks = getSortedTasks();

    return (
        <div className="h-full flex flex-col p-8 max-w-5xl mx-auto">
            <header className="mb-12 flex justify-between items-end border-b border-zinc-900 pb-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
                        My Tasks
                    </h1>
                    <p className="text-zinc-500 text-sm">Priorities for today.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-white/10">
                        <ListFilter size={16} className="text-slate-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-300"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="priority">Sort by Priority</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="flex items-center gap-2 bg-zinc-100 text-black hover:bg-white px-4 py-2 rounded-md transition-all font-medium text-sm shadow-sm"
                    >
                        {showAdd ? <X size={16} /> : <Plus size={16} />}
                        {showAdd ? 'Cancel' : 'New Task'}
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {showAdd && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, mb: 0 }}
                        animate={{ opacity: 1, height: 'auto', mb: 24 }}
                        exit={{ opacity: 0, height: 0, mb: 0 }}
                        onSubmit={handleManualAdd}
                        className="overflow-hidden mb-6"
                    >
                        <div className="p-4 glass-card rounded-xl border border-primary-500/30 flex flex-col gap-3">
                            <input
                                autoFocus
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
                            />

                            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/10">
                                    <Clock size={14} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={newTaskDate}
                                        onChange={(e) => setNewTaskDate(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-slate-300 [color-scheme:dark]"
                                    />
                                </div>

                                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/10">
                                    <AlertCircle size={14} className="text-slate-400" />
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-slate-300"
                                    >
                                        <option value="High">High Priority</option>
                                        <option value="Medium">Medium Priority</option>
                                        <option value="Low">Low Priority</option>
                                    </select>
                                </div>

                                <div className="flex-1"></div>

                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <AnimatePresence mode="popLayout">
                    {tasks.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-slate-500 py-20"
                        >
                            No active tasks. Use the Agent to create one!
                        </motion.div>
                    )}

                    {sortedTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            layout
                            transition={{ duration: 0.2 }}
                            className={`glass-card p-5 rounded-xl border group relative transition-all ${task.status === 'completed'
                                ? 'bg-slate-900/40 border-slate-800 opacity-60'
                                : 'border-white/5 hover:border-white/10 hover:shadow-lg'
                                }`}
                        >
                            {editingId === task.id ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full bg-slate-800/50 rounded-lg px-3 py-2 border border-white/10 outline-none text-white"
                                    />
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/10">
                                            <Clock size={14} className="text-slate-400" />
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-slate-300 [color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/10">
                                            <AlertCircle size={14} className="text-slate-400" />
                                            <select
                                                value={editPriority}
                                                onChange={(e) => setEditPriority(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-slate-300"
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                        <div className="flex-1"></div>
                                        <button onClick={cancelEditing} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={saveEdit} className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                            <Save size={14} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => toggleStatus(task.id, task.status)}
                                        className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${task.status === 'completed'
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'border-slate-600 hover:border-primary-500 hover:bg-primary-500/10 text-transparent hover:text-primary-500'
                                            }`}
                                    >
                                        <Check size={14} />
                                    </button>

                                    <div className="flex-1">
                                        <h3 className={`text-lg font-medium mb-2 transition-colors ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white'
                                            }`}>
                                            {task.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            {task.priority && (
                                                <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md border font-medium ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                    task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            )}

                                            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                                <Calendar size={12} className="mr-1.5" /> {task.date}
                                            </span>

                                            {task.tags && task.tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                    <Tag size={12} className="mr-1.5" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditing(task)}
                                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit Task"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
