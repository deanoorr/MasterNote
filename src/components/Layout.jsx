
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Workspace from '../pages/Workspace';
import AssistantView from '../pages/AssistantView';
import NotesPage from '../pages/NotesPage';
import SettingsPage from '../pages/SettingsPage';
import HabitsPage from '../pages/HabitsPage';
import DashboardPage from '../pages/DashboardPage';

export default function Layout() {
    const [activeTab, setActiveTab] = useState('home');
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-zinc-900 dark:text-white font-sans overflow-hidden selection:bg-blue-500/30 relative transition-colors duration-300">
            {/* Global Nebula Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[100px]" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-[80px]" />
            </div>

            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main className={`flex-1 h-full relative overflow-hidden z-10 transition-all duration-300 ml-0 md:ml-20 ${!isCollapsed ? 'md:ml-64' : ''} pb-[60px] md:pb-0`}>
                {activeTab === 'home' && <DashboardPage onNavigate={setActiveTab} />}
                {activeTab === 'workspace' && <Workspace />}
                {activeTab === 'assistant' && <AssistantView />}
                {activeTab === 'notes' && <NotesPage />}
                {activeTab === 'habits' && <HabitsPage />}
                {activeTab === 'settings' && <SettingsPage />}
            </main>

            <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
