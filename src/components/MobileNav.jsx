import React from 'react';
import { LayoutGrid, Settings, Sparkles, StickyNote, Activity, Home, Zap } from 'lucide-react';

export default function MobileNav({ activeTab, onTabChange }) {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'focus', label: 'Focus', icon: Zap },
        { id: 'workspace', label: 'Tasks', icon: LayoutGrid },
        { id: 'assistant', label: 'AI', icon: Sparkles },
        { id: 'notes', label: 'Notes', icon: StickyNote },
        { id: 'habits', label: 'Habits', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full h-[60px] bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 flex justify-around items-center px-1 z-50 md:hidden pb-safe">
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                    >
                        <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-500/10' : ''}`}>
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
