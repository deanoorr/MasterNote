import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const MODES = {
    WORK: { id: 'work', label: 'Deep Focus', time: 25 * 60, color: 'text-rose-500', bg: 'bg-rose-500' },
    SHORT_BREAK: { id: 'short', label: 'Short Break', time: 5 * 60, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    LONG_BREAK: { id: 'long', label: 'Long Break', time: 15 * 60, color: 'text-blue-500', bg: 'bg-blue-500' },
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState('WORK');
    const [timeLeft, setTimeLeft] = useState(MODES.WORK.time);
    const [isActive, setIsActive] = useState(false);
    const [progress, setProgress] = useState(1);

    const timerRef = useRef(null);

    const currentMode = MODES[mode];

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newValue = prev - 1;
                    setProgress(newValue / currentMode.time);
                    return newValue;
                });
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optional: Play alarm sound here
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft, currentMode.time]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(currentMode.time);
        setProgress(1);
    };

    const changeMode = (newModeKey) => {
        setMode(newModeKey);
        setIsActive(false);
        setTimeLeft(MODES[newModeKey].time);
        setProgress(1);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
            {/* Mode Switcher */}
            <div className="flex gap-2 mb-8 bg-zinc-100 dark:bg-black/20 p-1.5 rounded-xl">
                {Object.keys(MODES).map((key) => (
                    <button
                        key={key}
                        onClick={() => changeMode(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === key
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {MODES[key].label}
                    </button>
                ))}
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-zinc-200 dark:text-zinc-800"
                    />
                    <motion.circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className={`${currentMode.color}`}
                        strokeLinecap="round"
                        initial={{ pathLength: 1 }}
                        animate={{ pathLength: progress }}
                        transition={{ duration: 1, ease: 'linear' }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold font-mono tracking-tighter text-zinc-900 dark:text-white">
                        {formatTime(timeLeft)}
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${currentMode.color} font-medium`}>
                        {mode === 'WORK' ? <Brain size={18} /> : <Coffee size={18} />}
                        {isActive ? 'Focusing...' : 'Paused'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <RotateCcw size={24} />
                </button>

                <button
                    onClick={toggleTimer}
                    className={`p-6 rounded-full text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 ${currentMode.bg}`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
            </div>
        </div>
    );
}
