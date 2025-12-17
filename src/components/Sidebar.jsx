import React from 'react';
import { LayoutGrid, Settings, LogOut, Sparkles, StickyNote, Activity, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'workspace', label: 'My Tasks', icon: LayoutGrid },
    { id: 'habits', label: 'Habits', icon: Activity },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }) {
    return (
        <aside className="fixed left-0 top-0 h-full w-20 md:w-64 z-50 flex flex-col pt-8 pb-6 px-4 border-r border-white/5 bg-black/20 backdrop-blur-xl">

            {/* Logo Area */}
            <div className="px-6 mb-12 mt-2">
                <span className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 hidden md:block">
                    BART AI
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
                            )}
                            <item.icon
                                size={20}
                                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                            />
                            <span className={`relative z-10 text-sm font-medium hidden md:block ${isActive ? 'text-blue-100' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Profile/Logout */}
            <div className="mt-auto px-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all text-sm">
                    <LogOut size={18} />
                    <span className="font-medium hidden md:block">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
