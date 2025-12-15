import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModel } from '../context/ModelContext';

export default function ModelSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { selectedModel, setSelectedModel, models } = useModel();

    return (
        <div className="relative z-50">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/5 transition-colors border border-white/10"
            >
                <selectedModel.icon size={16} className={selectedModel.color} />
                <span className="text-sm font-medium text-slate-200">{selectedModel.name}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-panel overflow-hidden shadow-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10"
                    >
                        <div className="p-1">
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedModel.id === model.id
                                        ? 'bg-primary-500/20 text-white'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    <model.icon size={16} className={model.color} />
                                    <span className="font-medium">{model.name}</span>
                                    {selectedModel.id === model.id && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
