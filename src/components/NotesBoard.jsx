import React, { useState } from 'react';
import { useNotes } from '../context/NotesContext';
import NoteCard from './NoteCard';
import { Plus, FolderPlus, Trash2, Search, LayoutGrid, X, Minimize2, PanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesBoard() {
    const { notes, projects, addNote, updateNote, deleteNote, addProject, deleteProject } = useNotes();
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [search, setSearch] = useState('');
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    const filteredNotes = notes.filter(note => {
        const matchesProject = selectedProject === 'all' || note.projectId === selectedProject;
        const matchesSearch = note.content.toLowerCase().includes(search.toLowerCase());
        return matchesProject && matchesSearch;
    });

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            addProject(newProjectName, 'bg-zinc-700');
            setNewProjectName('');
            setIsAddingProject(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-transparent">
            {/* Secondary Sidebar - Projects */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-r border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-black/20 flex flex-col overflow-hidden whitespace-nowrap shrink-0"
                    >
                        <div className="w-64 p-4 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xs font-semibold text-zinc-500 tracking-wider">PROJECTS</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAddingProject(true)}
                                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                        title="Add Project"
                                    >
                                        <FolderPlus size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                        title="Close Sidebar"
                                    >
                                        <PanelLeft size={16} />
                                    </button>
                                </div>
                            </div>

                            {isAddingProject && (
                                <form onSubmit={handleCreateProject} className="mb-4">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        placeholder="Project Name..."
                                        onBlur={() => setIsAddingProject(false)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                                    />
                                </form>
                            )}

                            <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => setSelectedProject('all')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${selectedProject === 'all'
                                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <LayoutGrid size={16} /> All Notes
                                    </span>
                                    <span className="text-xs opacity-50">{notes.length}</span>
                                </button>

                                <div className="h-px bg-white/5 my-2 mx-2"></div>

                                {projects.map(project => (
                                    <button
                                        key={project.id}
                                        onClick={() => setSelectedProject(project.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${selectedProject === project.id
                                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span className={`w-2 h-2 rounded-full ${project.color || 'bg-zinc-600'}`}></span>
                                            {project.name}
                                        </span>

                                        {/* Delete Project Button (only visible on hover and not default projects) */}
                                        {!['inbox', 'personal', 'work'].includes(project.id) && (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Grid */}
            <div className="flex-1 flex flex-col p-8 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                title="Open Sidebar"
                            >
                                <PanelLeft size={20} />
                            </button>
                        )}
                        <div className="relative w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-full pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => addNote(selectedProject === 'all' ? 'inbox' : selectedProject)}
                        className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-black/5 dark:shadow-white/5"
                    >
                        <Plus size={16} /> New Note
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                        <AnimatePresence mode="popLayout">
                            {filteredNotes.map(note => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onDelete={deleteNote}
                                    onUpdate={updateNote}
                                    onExpand={() => setSelectedNoteId(note.id)}
                                />
                            ))}
                        </AnimatePresence>

                        {filteredNotes.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-zinc-600">
                                <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center mb-4">
                                    <LayoutGrid size={24} opacity={0.5} />
                                </div>
                                <p>No notes found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Expanded Note Overlay */}
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
                            initial={{ opacity: 0 }} // layoutId handles position/size, opacity handles content fade
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
                                        setSelectedNoteId(null);
                                        deleteNote(selectedNote.id);
                                    }}
                                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <textarea
                                value={selectedNote.content}
                                onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                                placeholder="Type something..."
                                className="w-full h-full bg-transparent border-none outline-none resize-none text-lg leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 custom-scrollbar selection:bg-blue-500/20 dark:selection:bg-white/20 p-2 pr-24"
                                spellCheck={false}
                                autoFocus
                            />

                            <div className="mt-4 text-xs text-zinc-500 font-mono text-right select-none font-semibold tracking-wider">
                                {new Date(selectedNote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
