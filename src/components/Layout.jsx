import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Workspace from '../pages/Workspace';
import AssistantView from '../pages/AssistantView';
import NotesPage from '../pages/NotesPage';
import SettingsPage from '../pages/SettingsPage';
import HabitsPage from '../pages/HabitsPage';
import DashboardPage from '../pages/DashboardPage';
import { ModelProvider } from '../context/ModelContext';
import { TaskProvider } from '../context/TaskContext';
import { ChatProvider } from '../context/ChatContext';
import { NotesProvider } from '../context/NotesContext';
import { SettingsProvider } from '../context/SettingsContext';
import { HabitProvider } from '../context/HabitContext';
import { ThemeProvider } from '../context/ThemeContext';

function LayoutContent() {
    const [activeTab, setActiveTab] = useState('home');

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-zinc-900 dark:text-white font-sans overflow-hidden selection:bg-blue-500/30 relative transition-colors duration-300">
            {/* Global Nebula Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[100px]" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-[80px]" />
            </div>

            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 ml-20 md:ml-64 h-full relative overflow-hidden z-10">
                {activeTab === 'home' && <DashboardPage onNavigate={setActiveTab} />}
                {activeTab === 'workspace' && <Workspace />}
                {activeTab === 'assistant' && <AssistantView />}
                {activeTab === 'notes' && <NotesPage />}
                {activeTab === 'habits' && <HabitsPage />}
                {activeTab === 'settings' && <SettingsPage />}
            </main>
        </div>
    );
}

export default function Layout() {
    return (
        <ThemeProvider>
            <ModelProvider>
                <SettingsProvider>
                    <TaskProvider>
                        <ChatProvider>
                            <NotesProvider>
                                <HabitProvider>
                                    <LayoutContent />
                                </HabitProvider>
                            </NotesProvider>
                        </ChatProvider>
                    </TaskProvider>
                </SettingsProvider>
            </ModelProvider>
        </ThemeProvider>
    );
}
