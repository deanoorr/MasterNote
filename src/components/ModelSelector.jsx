import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModel } from '../context/ModelContext';

export default function ModelSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenRouterOpen, setIsOpenRouterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    const {
        selectedModel,
        setSelectedModel,
        models,
        openRouterModels,
        selectedOpenRouterModel,
        setSelectedOpenRouterModel,
        fetchOpenRouterModels
    } = useModel();

    useEffect(() => {
        if (selectedModel.provider === 'openrouter' && openRouterModels.length === 0) {
            fetchOpenRouterModels();
        }
    }, [selectedModel, openRouterModels.length, fetchOpenRouterModels]);

    useEffect(() => {
        if (isOpenRouterOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isOpenRouterOpen) {
            setSearchQuery('');
        }
    }, [isOpenRouterOpen]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpenRouterOpen(false);
            }
        };

        if (isOpenRouterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpenRouterOpen]);


    const groupedModels = useMemo(() => {
        const groups = {};

        openRouterModels.forEach(model => {
            if (searchQuery && !model.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return;
            }

            const parts = model.name.split(':');
            const provider = parts.length > 1 ? parts[0].trim() : 'Other';
            const displayName = parts.length > 1 ? parts.slice(1).join(':').trim() : model.name;

            if (!groups[provider]) {
                groups[provider] = [];
            }
            groups[provider].push({ ...model, displayName });
        });

        // Sort providers alphabetically
        const sortedGroups = {};
        Object.keys(groups).sort().forEach(key => {
            sortedGroups[key] = groups[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
        });

        return sortedGroups;
    }, [openRouterModels, searchQuery]);

    return (
        <div className="flex items-center gap-2 z-50">
            {/* Main Selector */}
            <div className="relative">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setIsOpenRouterOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-black/20 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                >
                    <selectedModel.icon size={14} className={selectedModel.color} />
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200">{selectedModel.name}</span>
                    <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 bottom-full mb-2 w-52 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl shadow-xl overflow-hidden z-20"
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
                                            ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
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

            {/* OpenRouter Selector */}
            {selectedModel.provider === 'openrouter' && (
                <div className="relative" ref={dropdownRef}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setIsOpenRouterOpen(!isOpenRouterOpen);
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-black/20 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 group"
                    >
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200 max-w-[150px] truncate">
                            {selectedOpenRouterModel ? selectedOpenRouterModel.name : 'Select Model'}
                        </span>
                        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpenRouterOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                        {isOpenRouterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute left-0 bottom-full mb-2 w-72 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col max-h-[400px] z-50"
                            >
                                <div className="p-2 border-b border-zinc-200 dark:border-white/10 sticky top-0 bg-white/50 dark:bg-black/50 backdrop-blur-md">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search models..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-white/5 border-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 text-zinc-900 dark:text-white placeholder-zinc-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-y-auto p-1.5 custom-scrollbar">
                                    {Object.entries(groupedModels).length > 0 ? (
                                        Object.entries(groupedModels).map(([provider, providerModels]) => (
                                            <div key={provider} className="mb-2 last:mb-0">
                                                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10">
                                                    {provider}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {providerModels.map((model) => (
                                                        <button
                                                            key={model.id}
                                                            onClick={() => {
                                                                setSelectedOpenRouterModel(model);
                                                                setIsOpenRouterOpen(false);
                                                            }}
                                                            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${selectedOpenRouterModel?.id === model.id
                                                                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white'
                                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <span className="truncate flex-1">{model.displayName}</span>
                                                            {selectedOpenRouterModel?.id === model.id && (
                                                                <Check size={12} className="text-zinc-900 dark:text-white shrink-0" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-zinc-500">
                                            No models found
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
