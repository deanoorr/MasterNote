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

function LayoutContent() {
    const [activeTab, setActiveTab] = useState('home');

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden selection:bg-rose-500/30">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 ml-20 md:ml-64 h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5 pointer-events-none" />
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
    );
}
