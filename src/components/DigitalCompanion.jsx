import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../context/TaskContext';
import { Sparkles, Zap, Moon } from 'lucide-react';

export default function DigitalCompanion() {
    const { tasks, userXp, userLevel, justLeveledUp } = useTasks();
    const [mood, setMood] = useState('IDLE'); // IDLE, HAPPY, THINKING, LEVEL_UP
    const [message, setMessage] = useState("I'm ready when you are.");
    const prevCompletedRef = useRef(0);
    const prevLevelRef = useRef(userLevel);

    // Calculate completed count
    const completedCount = tasks.filter(t => t.status === 'completed' || t.completed).length;

    // Calculate XP progress for current level
    // Lvl 1: 0-99 (Width 100)
    // Lvl 2: 100-399 (Width 300)
    // Formula inverse: XP = (Level-1)^2 * 100
    const currentLevelBaseXp = Math.pow(userLevel - 1, 2) * 100;
    const nextLevelBaseXp = Math.pow(userLevel, 2) * 100;
    const xpNeededForLevel = nextLevelBaseXp - currentLevelBaseXp;
    const xpInCurrentLevel = userXp - currentLevelBaseXp;
    const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));

    useEffect(() => {
        // Init ref
        if (prevCompletedRef.current === 0 && completedCount > 0) {
            prevCompletedRef.current = completedCount;
        }

        if (completedCount > prevCompletedRef.current) {
            // Task completed!
            triggerHappy();
        }

        prevCompletedRef.current = completedCount;
    }, [completedCount]);

    useEffect(() => {
        if (justLeveledUp || userLevel > prevLevelRef.current) {
            triggerLevelUp();
        }
        prevLevelRef.current = userLevel;
    }, [userLevel, justLeveledUp]);

    const triggerHappy = () => {
        if (mood === 'LEVEL_UP') return; // Don't interrupt level up
        setMood('HAPPY');
        const msgs = ["Great job!", "You're on fire!", "Keep it up!", "Productivity +10 XP"];
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);

        setTimeout(() => {
            setMood('IDLE');
            setMessage("What's next?");
        }, 3000);
    };

    const triggerLevelUp = () => {
        setMood('LEVEL_UP');
        setMessage(`Level Up! Welcome to Lvl ${userLevel}! 🎉`);

        // Celebrate for longer
        setTimeout(() => {
            setMood('IDLE');
            setMessage("You are unstoppable.");
        }, 5000);
    };

    // Animation Variants
    const orbVariants = {
        IDLE: {
            scale: [1, 1.05, 1],
            y: [0, -10, 0],
            backgroundColor: ["#818cf8", "#6366f1", "#818cf8"], // Indigo
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        },
        HAPPY: {
            scale: [1, 1.2, 0.9, 1.1, 1],
            y: [0, -30, 0],
            backgroundColor: ["#fbbf24", "#f59e0b", "#fbbf24"], // Amber/Gold
            transition: { duration: 0.8, ease: "circOut" }
        },
        LEVEL_UP: {
            scale: [1, 1.5, 1.2, 1.5, 1],
            rotate: [0, 0, 180, 360, 0],
            y: [0, -50, -20, -50, 0],
            backgroundColor: ["#818cf8", "#ec4899", "#8b5cf6", "#f59e0b", "#818cf8"], // Rainbow-ish
            transition: { duration: 2, ease: "easeInOut" }
        }
    };

    const glowVariants = {
        IDLE: {
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        },
        HAPPY: {
            opacity: [0.5, 0.8, 0],
            scale: [1, 2, 3],
            transition: { duration: 1, ease: "easeOut" }
        },
        LEVEL_UP: {
            opacity: [0, 1, 0.5, 1, 0],
            scale: [1, 3, 2, 4, 1],
            background: ["radial-gradient(circle, #ec4899, transparent)", "radial-gradient(circle, #f59e0b, transparent)"],
            transition: { duration: 2, ease: "easeInOut" }
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-6 w-full max-w-xs mx-auto">

            {/* Level Badge - Floating top right */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-lg text-xs font-bold text-zinc-900 dark:text-white shadow-sm flex items-center gap-1">
                    <Zap size={12} className="text-yellow-500 fill-yellow-500" />
                    Lvl {userLevel}
                </div>
                {/* XP Bar */}
                <div className="mt-1 w-16 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                </div>
            </div>

            {/* The Orb */}
            <div className="relative w-32 h-32 flex items-center justify-center">

                {/* Outer Glow */}
                <motion.div
                    variants={glowVariants}
                    animate={mood}
                    className="absolute inset-0 rounded-full bg-indigo-500 blur-2xl z-0"
                />

                {/* Core Sphere */}
                <motion.div
                    variants={orbVariants}
                    animate={mood}
                    className="relative z-10 w-20 h-20 rounded-full shadow-inner flex items-center justify-center"
                    style={{
                        background: mood === 'HAPPY' || mood === 'LEVEL_UP'
                            ? 'radial-gradient(circle at 30% 30%, #fcd34d, #f59e0b)'
                            : 'radial-gradient(circle at 30% 30%, #a5b4fc, #6366f1)',
                        boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.3), inset 5px 5px 15px rgba(255,255,255,0.5)'
                    }}
                >
                    {/* Face / Icon */}
                    <AnimatePresence mode="wait">
                        {mood === 'HAPPY' || mood === 'LEVEL_UP' ? (
                            <motion.div
                                key="happy"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                            >
                                <Sparkles className="text-white drop-shadow-md" size={32} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-2"
                            >
                                {/* Eyes */}
                                <div className="w-2 h-3 bg-white/80 rounded-full animate-blink behavior-smooth" />
                                <div className="w-2 h-3 bg-white/80 rounded-full animate-blink behavior-smooth" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Speech Bubble */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={message}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 relative text-center max-w-[200px]"
                >
                    {message}
                    {/* Triangle pointer */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-l border-t border-zinc-100 dark:border-zinc-700 transform rotate-45" />
                </motion.div>
            </AnimatePresence>

            <style>{`
                @keyframes blink {
                    0%, 90% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                    100% { transform: scaleY(1); }
                }
                .animate-blink {
                    animation: blink 4s infinite;
                }
            `}</style>
        </div>
    );
}
