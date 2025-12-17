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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
            >
                <selectedModel.icon size={14} className={selectedModel.color} />
                <span className="text-xs font-medium text-zinc-200">{selectedModel.name}</span>
                <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 bottom-full mb-2 w-52 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl overflow-hidden"
                    >
                        <div className="p-1.5 space-y-0.5">
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs transition-colors ${selectedModel.id === model.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                        }`}
                                >
                                    <model.icon size={14} className={model.color} />
                                    <span className="font-medium">{model.name}</span>
                                    {selectedModel.id === model.id && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-400" />
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
