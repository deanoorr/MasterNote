import React, { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useNotes } from '../context/NotesContext';
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, MoreHorizontal, StickyNote, Layout as LayoutIcon, Minimize2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NoteCard from '../components/NoteCard';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

export default function ProjectPage({ projectId, onBack }) {
    const { projects, tasks, addTask, updateTask, deleteTask } = useTasks();
    const { notes, addNote, updateNote, deleteNote } = useNotes();

    // UI State
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);

    // Quill Modules
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    // Data Resolution
    const project = projects.find(p => p.id === projectId) || { name: 'Unknown Project', color: 'bg-zinc-500' };

    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId]);
    const projectNotes = useMemo(() => notes.filter(n => n.projectId === projectId), [notes, projectId]);

    const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

    // Effects
    useEffect(() => {
        if (selectedNoteId) {
            const note = notes.find(n => n.id === selectedNoteId);
            if (note) {
                setEditorContent(marked.parse(note.content || ''));
            }
        }
    }, [selectedNoteId]);

    // Note Handlers
    const handleEditorChange = (content) => {
        setEditorContent(content);
        if (selectedNoteId) {
            const markdown = turndownService.turndown(content);
            updateNote(selectedNoteId, { content: markdown });
        }
    };

    // Stats
    const completedTasks = projectTasks.filter(t => t.status === 'completed' || t.completed).length;
    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

    // Handlers
    const handleAddTask = () => {
        addTask({
            title: 'New Project Task',
            projectId: projectId,
            priority: 'Medium',
            status: 'pending'
        });
    };

    const handleAddNote = async () => {
        const newNote = await addNote(projectId, "# New Resource\n\n");
        if (newNote) {
            setSelectedNoteId(newNote.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="h-full flex flex-col bg-white dark:bg-black p-4 md:p-8 overflow-hidden"
        >
            {/* Header / Command Center Bar */}
            <div className="flex flex-col gap-4 mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{project.name}</h1>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700`}>
                                War Room
                            </div>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            {completedTasks} / {projectTasks.length} tasks completed • {projectNotes.length} resources
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {/* Actions could go here */}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${project.color || 'bg-blue-500'}`}
                    />
                </div>
            </div>

            {/* Content Layout - Split View Desktop, Tabbed Mobile */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">

                {/* Left Column: Tasks */}
                <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                            <CheckCircle2 size={18} className="text-zinc-500" />
                            <span>Mission Objectives</span>
                            <span className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{projectTasks.length}</span>
                        </div>
                        <button
                            onClick={handleAddTask}
                            className="p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {projectTasks.map(task => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl hover:shadow-md transition-all"
                                >
                                    <button
                                        onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
                                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'
                                            }`}
                                    >
                                        {task.status === 'completed' && <CheckCircle2 size={12} strokeWidth={4} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={task.title}
                                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                            onFocus={() => setEditingTaskId(task.id)}
                                            onBlur={() => setEditingTaskId(null)}
                                            className={`text-sm font-medium w-full bg-transparent outline-none transition-colors ${task.status === 'completed' ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-200'
                                                }`}
                                        />
                                    </div>
                                    <div className={`text-[10px] font-medium px-2 py-0.5 rounded border ${task.priority === 'High' ? 'text-red-500 border-red-200/50 bg-red-500/10' :
                                        task.priority === 'Medium' ? 'text-orange-500 border-orange-200/50 bg-orange-500/10' :
                                            'text-blue-500 border-blue-200/50 bg-blue-500/10'
                                        }`}>
                                        {task.priority || 'Normal'}
                                    </div>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 transition-all"
                                    >
                                        <Plus size={14} className="rotate-45" />
                                    </button>
                                </motion.div>
                            ))}
                            {projectTasks.length === 0 && (
                                <div className="text-center py-12 text-zinc-500 text-sm">
                                    No missions active. Initate one above.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Resources/Notes */}
                <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                            <StickyNote size={18} className="text-zinc-500" />
                            <span>Intel & Resources</span>
                            <span className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{projectNotes.length}</span>
                        </div>
                        <button
                            onClick={handleAddNote}
                            className="p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                                {projectNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onDelete={deleteNote}
                                        onExpand={() => setSelectedNoteId(note.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        {projectNotes.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-sm h-full">
                                <StickyNote size={32} strokeWidth={1} className="mb-2 opacity-50" />
                                <p>No intelligence gathered yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Expanded Note Overlay - Copied from NotesBoard for consistency */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNoteId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            layoutId={`note-${selectedNote.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                            className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col p-8 overflow-hidden z-10"
                        >
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedNoteId(null)}
                                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize2 size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        const noteId = selectedNote.id;
                                        deleteNote(noteId);
                                        setSelectedNoteId(null);
                                    }}
                                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col">
                                <ReactQuill
                                    theme="snow"
                                    value={editorContent}
                                    onChange={handleEditorChange}
                                    modules={modules}
                                    placeholder="Type something..."
                                    className="h-full flex flex-col"
                                />
                            </div>
                            {/* Styles for Quill Dark Mode Override */}
                            <style>{`
                                .quill { display: flex; flex-direction: column; height: 100%; }
                                .ql-container { flex: 1; overflow-y: auto; font-family: 'Inter', sans-serif; font-size: 1.125rem; }
                                .ql-toolbar { border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #e4e4e7 !important; background: transparent; padding-top: 0 !important; }
                                .dark .ql-toolbar { border-bottom-color: rgba(255,255,255,0.1) !important; }
                                .dark .ql-stroke { stroke: #a1a1aa !important; }
                                .dark .ql-fill { fill: #a1a1aa !important; }
                                .dark .ql-picker { color: #a1a1aa !important; }
                                .dark .ql-editor { color: #e4e4e7; line-height: 1.7; }
                                .ql-editor.ql-blank::before { color: #a1a1aa; font-style: normal; }
                                .ql-editor h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; }
                                .ql-editor h2 { font-size: 1.5em; font-weight: 600; margin-bottom: 0.5em; margin-top: 1em; }
                                .ql-editor p { margin-bottom: 0.5em; }
                            `}</style>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
