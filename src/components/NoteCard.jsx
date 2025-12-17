import React, { useRef, useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NoteCard({ note, onDelete, onUpdate, onExpand }) {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [note.content]);

    return (
        <motion.div
            layoutId={`note-${note.id}`}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="group rounded-[2rem] p-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-zinc-100 shadow-xl shadow-black/10 hover:shadow-black/30 transition-all flex flex-col border border-white/5 hover:border-white/10 min-h-[200px] relative"
        >
            {/* Toolbar (Always faintly visible, bright on hover) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button
                    onClick={() => onExpand(note)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Expand"
                >
                    <Maximize2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(note.id)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete Note"
                >
                    <X size={14} />
                </button>
            </div>

            <textarea
                ref={textareaRef}
                value={note.content}
                onChange={(e) => onUpdate(note.id, { content: e.target.value })}
                placeholder="Type something..."
                className="w-full bg-transparent border-none outline-none resize-none font-medium leading-relaxed placeholder-zinc-600 flex-1 h-full selection:bg-white/20 custom-scrollbar pr-16"
                spellCheck={false}
            />

            <div className="mt-2 text-[10px] text-zinc-600 font-mono text-right select-none font-semibold tracking-wider opacity-60">
                {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </motion.div>
    );
}
