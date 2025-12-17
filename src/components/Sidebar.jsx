import React from 'react';
import { LayoutGrid, Settings, LogOut, Sparkles, StickyNote, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

const navItems = [
    { id: 'workspace', label: 'My Tasks', icon: LayoutGrid },
    { id: 'habits', label: 'Habits', icon: Activity },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }) {
    return (
        <aside className="fixed left-0 top-0 h-full w-20 md:w-64 z-50 flex flex-col pt-8 pb-6 px-4 border-r border-zinc-900/0 md:border-zinc-900">

            {/* Logo Area */}
            <div className="px-6 mb-12 mt-2">
                <span className="text-4xl font-bold tracking-tighter text-zinc-100 hidden md:block">
                    BART AI
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${isActive
                                ? 'bg-zinc-800/50 text-white'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                                }`}
                        >
                            <item.icon
                                size={18}
                                className={`${isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-400'}`}
                            />
                            <span className="text-sm font-medium hidden md:block">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Profile/Logout */}
            <div className="mt-auto px-2">
                <button className="w-full flex items-center gap-3 p-2 text-zinc-600 hover:text-zinc-300 transition-colors text-sm">
                    <LogOut size={16} />
                    <span className="font-medium hidden md:block">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
