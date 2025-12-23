import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../context/TaskContext';
import { Sparkles, Zap, Moon } from 'lucide-react';

export default function DigitalCompanion() {
    const { tasks } = useTasks();
    const [mood, setMood] = useState('IDLE'); // IDLE, HAPPY, THINKING
    const [message, setMessage] = useState("I'm ready when you are.");
    const prevCompletedRef = useRef(0);

    // Calculate completed count
    const completedCount = tasks.filter(t => t.status === 'completed' || t.completed).length;

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

    const triggerHappy = () => {
        setMood('HAPPY');
        const msgs = ["Great job!", "You're on fire!", "Keep it up!", "Productivity +100 XP"];
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);

        setTimeout(() => {
            setMood('IDLE');
            setMessage("What's next?");
        }, 3000);
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
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-6 w-full max-w-xs mx-auto">
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
                        background: mood === 'HAPPY'
                            ? 'radial-gradient(circle at 30% 30%, #fcd34d, #f59e0b)'
                            : 'radial-gradient(circle at 30% 30%, #a5b4fc, #6366f1)',
                        boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.3), inset 5px 5px 15px rgba(255,255,255,0.5)'
                    }}
                >
                    {/* Face / Icon */}
                    <AnimatePresence mode="wait">
                        {mood === 'HAPPY' ? (
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
                    className="mt-4 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 relative"
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
