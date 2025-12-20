import { LayoutGrid, Settings, LogOut, Sparkles, StickyNote, Activity, Home, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function Sidebar({ activeTab, onTabChange, isCollapsed, setIsCollapsed }) {
    return (
        <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-20 md:w-64'} z-50 hidden md:flex flex-col pb-6 border-r border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl transition-all duration-300 group/sidebar rounded-r-3xl`}>

            {/* Logo Area */}
            <div className={`h-14 flex items-center shrink-0 border-b border-transparent ${isCollapsed ? 'justify-center mx-auto' : 'justify-start px-6'}`}>
                <span className="text-2xl md:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-600">
                    {isCollapsed ? 'B' : 'BART AI'}
                </span>
            </div>

            {/* Collapse Toggle - Centered on Edge */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 hover:scale-110 z-50 hidden md:flex"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`relative w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            {isActive && (
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6] ${isCollapsed ? 'left-1' : ''}`} />
                            )}
                            <item.icon
                                size={20}
                                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}
                            />
                            <span className={`relative z-10 text-sm font-medium ${isCollapsed ? 'hidden' : 'hidden md:block'} ${isActive ? 'text-blue-700 dark:text-blue-100' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Profile/Logout */}
            <div className="mt-auto px-0 md:px-2">
                <button className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 pl-3'} p-3 rounded-xl text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm`}>
                    <LogOut size={18} />
                    <span className={`font-medium ${isCollapsed ? 'hidden' : 'hidden md:block'}`}>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
