import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Tag, AlertCircle, Check, Trash2, Clock, Plus, X, Edit2, Save, ListFilter, Box, Folder, PanelLeft } from 'lucide-react';

import { useTasks } from '../context/TaskContext';

export default function TaskManager() {
    const { tasks, addTask, updateTask, deleteTask, projects, addProject, deleteProject } = useTasks();
    const [selectedProject, setSelectedProject] = useState('all'); // 'all', 'inbox', or projectId
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Task Logic
    const [showAdd, setShowAdd] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskPriority, setNewTaskPriority] = useState('Medium');
    const [sortBy, setSortBy] = useState('date');

    // Project Logic
    const [showAddProject, setShowAddProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editPriority, setEditPriority] = useState('');
    const [editProjectId, setEditProjectId] = useState('inbox');

    const toggleStatus = (id, currentStatus) => {
        updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' });
    };

    const handleManualAdd = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        addTask({
            title: newTaskTitle,
            tags: ['Manual'],
            date: newTaskDate,
            priority: newTaskPriority,
            projectId: selectedProject === 'all' || selectedProject === 'inbox' ? null : selectedProject
        });
        setNewTaskTitle('');
        setNewTaskDate(new Date().toISOString().split('T')[0]);
        setNewTaskPriority('Medium');
        setShowAdd(false);
    };

    const handleAddProject = (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        addProject({
            name: newProjectName,
            color: 'blue', // Default, could be customized
            icon: 'folder'
        });
        setNewProjectName('');
        setShowAddProject(false);
    };

    const startEditing = (task) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditDate(task.date.includes('-') ? task.date : new Date().toISOString().split('T')[0]);
        setEditPriority(task.priority || 'Medium');
        setEditProjectId(task.projectId || 'inbox');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle('');
        setEditDate('');
        setEditPriority('');
        setEditProjectId('inbox');
    };

    const saveEdit = () => {
        if (!editTitle.trim()) return;
        updateTask(editingId, {
            title: editTitle,

            date: editDate,
            priority: editPriority,
            projectId: editProjectId === 'inbox' ? null : editProjectId
        });
        cancelEditing();
    };

    const getFilteredTasks = () => {
        let filtered = tasks;
        if (selectedProject === 'inbox') {
            filtered = tasks.filter(t => !t.projectId);
        } else if (selectedProject !== 'all') {
            filtered = tasks.filter(t => t.projectId === selectedProject);
        }
        return filtered;
    };

    const getSortedTasks = (filteredTasks) => {
        return [...filteredTasks].sort((a, b) => {
            if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
            if (sortBy === 'priority') {
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            } else if (sortBy === 'date') {
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

    const isOverdue = (dateString) => {
        if (!dateString) return false;
        if (['Today', 'Tomorrow', 'Upcoming'].includes(dateString)) return false;

        // Simple YYYY-MM-DD check
        const todayStr = new Date().toISOString().split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString < todayStr;
        }
        return false;
    };

    const sortedTasks = getSortedTasks(getFilteredTasks());
    const currentProjectName = selectedProject === 'all' ? 'All Tasks' : selectedProject === 'inbox' ? 'Inbox' : projects.find(p => p.id === selectedProject)?.name || 'Project';

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-r border-white/5 bg-zinc-950/30 flex flex-col overflow-hidden whitespace-nowrap"
                    >
                        <div className="p-4 w-64">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Views</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white">
                                    <PanelLeft size={16} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedProject('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${selectedProject === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ListFilter size={16} /> All Tasks
                                </button>
                                <button
                                    onClick={() => setSelectedProject('inbox')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${selectedProject === 'inbox' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Box size={16} /> Inbox
                                </button>
                            </div>

                            <div className="mt-8 flex items-center justify-between mb-2 px-1">
                                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Projects</h2>
                                <button onClick={() => setShowAddProject(!showAddProject)} className="text-zinc-500 hover:text-white">
                                    <Plus size={14} />
                                </button>
                            </div>

                            {showAddProject && (
                                <form onSubmit={handleAddProject} className="mb-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Project Name"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-zinc-500"
                                    />
                                </form>
                            )}

                            <div className="space-y-1">
                                {projects.map(project => (
                                    <div key={project.id} className="group flex items-center">
                                        <button
                                            onClick={() => setSelectedProject(project.id)}
                                            className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${selectedProject === project.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full bg-${project.color}-500`} />
                                            {project.name}
                                        </button>
                                        <button
                                            onClick={() => deleteProject(project.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full">
                <header className="mb-8 flex justify-between items-end border-b border-zinc-900 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                    title="Open Sidebar"
                                >
                                    <PanelLeft size={20} />
                                </button>
                            )}
                            <h1 className="text-3xl font-semibold text-white tracking-tight">
                                {currentProjectName}
                            </h1>
                        </div>
                        <p className="text-zinc-500 text-sm">
                            {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-white/10">
                            <ListFilter size={16} className="text-slate-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-slate-300 cursor-pointer"
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
                                    placeholder={`Add a task to ${currentProjectName === 'All Tasks' ? 'Inbox' : currentProjectName}...`}
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
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
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
                        {sortedTasks.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-slate-500 py-20"
                            >
                                No tasks in {currentProjectName}. <br />
                                <span className="text-sm">Use the Agent to create one!</span>
                            </motion.div>
                        )}

                        {sortedTasks.map((task, index) => {
                            const project = projects.find(p => p.id === task.projectId);
                            const overdue = isOverdue(task.date);
                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                    layout
                                    transition={{ duration: 0.2 }}
                                    className={`glass-card p-5 rounded-xl border group relative transition-all ${task.status === 'completed'
                                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                                        : overdue
                                            ? 'border-red-500/50 bg-red-500/10 hover:border-red-500/70'
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
                                                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-white/10">
                                                    <Folder size={14} className="text-slate-400" />
                                                    <select
                                                        value={editProjectId}
                                                        onChange={(e) => setEditProjectId(e.target.value)}
                                                        className="bg-transparent border-none outline-none text-sm text-slate-300 max-w-[100px]"
                                                    >
                                                        <option value="inbox">Inbox</option>
                                                        {projects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
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
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`text-lg font-medium transition-colors ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white'
                                                        }`}>
                                                        {task.title}
                                                    </h3>
                                                    {project && selectedProject === 'all' && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-white/5">
                                                            {project.name}
                                                        </span>
                                                    )}
                                                </div>

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
                            );
                        })}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
