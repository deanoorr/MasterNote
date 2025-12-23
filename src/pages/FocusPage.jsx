import React from 'react';
import { motion } from 'framer-motion';
import PomodoroTimer from '../components/PomodoroTimer';
import Soundscapes from '../components/Soundscapes';
import { Sparkles, Zap } from 'lucide-react';

export default function FocusPage() {
    return (
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-amber-500 fill-amber-500" size={28} />
                                Focus Zone
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                                Eliminate distractions. Deep work starts here.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column: Timer */}
                        <div className="space-y-8">
                            <PomodoroTimer />

                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    Zen Tip
                                </h3>
                                <p className="text-indigo-100 italic">
                                    "The best way to get something done is to begin."
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Soundscapes */}
                        <div className="space-y-8">
                            <Soundscapes />

                            {/* Placeholder for future features or ambient visuals */}
                            <div className="bg-zinc-100 dark:bg-white/5 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 h-64 flex flex-col items-center justify-center text-center opacity-70">
                                <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-white/10 mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🧘</span>
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-white">Breathe</h3>
                                <p className="text-sm text-zinc-500 mt-2 max-w-xs">
                                    Take a moment to center yourself before starting your next session.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
