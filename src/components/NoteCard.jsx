import React, { useMemo } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { marked } from 'marked';

export default function NoteCard({ note, onDelete, onExpand }) {
    const htmlContent = useMemo(() => {
        return marked.parse(note.content || '');
    }, [note.content]);

    return (
        <motion.div
            layoutId={`note-${note.id}`}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            onClick={() => onExpand(note)}
            className="group rounded-[2rem] p-6 bg-white dark:bg-white/5 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-100 shadow-xl shadow-black/5 dark:shadow-black/30 transition-all flex flex-col border border-zinc-200 dark:border-white/10 h-72 relative cursor-pointer"
        >
            {/* Toolbar (Always faintly visible, bright on hover) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onExpand(note); }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    title="Expand"
                >
                    <Maximize2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete Note"
                >
                    <X size={14} />
                </button>
            </div>

            <div
                className="prose prose-sm dark:prose-invert max-w-none w-full flex-1 overflow-hidden pointer-events-none fade-bottom"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <div className="mt-4 text-[10px] text-zinc-500 dark:text-zinc-600 font-mono text-right select-none font-semibold tracking-wider opacity-60">
                {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Fade effect at bottom for long notes */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-black/20 to-transparent pointer-events-none rounded-b-[2rem]" />
        </motion.div>
    );
}
