import React, { useState, useEffect } from 'react';
import { BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThinkingProcess({ content, defaultExpanded = false, isComplete = false }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Auto-collapse when complete (only if it was open)
    useEffect(() => {
        if (isComplete) {
            setIsExpanded(false);
        }
    }, [isComplete]);

    if (!content) return null;

    return (
        <div className="my-2 border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            >
                <BrainCircuit size={14} className="text-purple-400" />
                <span>Thinking Process</span>
                {isExpanded ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-3 pb-3 pt-0 text-xs text-zinc-500 font-mono whitespace-pre-wrap border-t border-white/5 bg-black/20 italic">
                            <div className="pt-2">
                                {content}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
