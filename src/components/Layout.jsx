import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Workspace from '../pages/Workspace';
import AssistantView from '../pages/AssistantView';
import { ModelProvider } from '../context/ModelContext';
import { TaskProvider } from '../context/TaskContext';
import { ChatProvider } from '../context/ChatContext';
import { NotesProvider } from '../context/NotesContext';
import { SettingsProvider } from '../context/SettingsContext';
import { Logo } from './Logo';
import NotesPage from '../pages/NotesPage';
import SettingsPage from '../pages/SettingsPage';

function LayoutContent() {
    const [activeTab, setActiveTab] = useState('workspace');

    return (
        <div className="h-screen w-screen bg-[#09090b] text-white flex overflow-hidden font-sans">

            {/* Sidebar - Floating Style */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="flex-1 flex flex-col h-full pl-24 md:pl-64 transition-all duration-300 relative z-10">
                {/* Helper Header - Transparent */}
                <header className="h-20 flex items-center justify-between px-8 shrink-0 z-30">
                    <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 flex items-center gap-2">
                        {activeTab === 'workspace' && 'My Tasks'}
                        {activeTab === 'assistant' && 'AI Assistant'}
                        {activeTab === 'notes' && 'Sticky Notes'}
                        {activeTab === 'settings' && 'Settings'}
                    </h1>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'workspace' && <Workspace />}
                    {activeTab === 'assistant' && <AssistantView />}
                    {activeTab === 'notes' && <NotesPage />}
                    {activeTab === 'settings' && <SettingsPage />}
                </div>
            </main>
        </div>
    );
}

export default function Layout() {
    return (
        <SettingsProvider>
            <ModelProvider>
                <TaskProvider>
                    <ChatProvider>
                        <NotesProvider>
                            <LayoutContent />
                        </NotesProvider>
                    </ChatProvider>
                </TaskProvider>
            </ModelProvider>
        </SettingsProvider>
    );
}
