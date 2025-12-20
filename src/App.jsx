
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ModelProvider } from './context/ModelContext';
import { TaskProvider } from './context/TaskContext';
import { ChatProvider } from './context/ChatContext';
import { NotesProvider } from './context/NotesContext';
import { SettingsProvider } from './context/SettingsContext';
import { HabitProvider } from './context/HabitContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ModelProvider>
                    <SettingsProvider>
                        <TaskProvider>
                            <ChatProvider>
                                <NotesProvider>
                                    <HabitProvider>
                                        <Routes>
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/signup" element={<Signup />} />
                                            <Route path="/*" element={
                                                <ProtectedRoute>
                                                    <Layout />
                                                </ProtectedRoute>
                                            } />
                                        </Routes>
                                    </HabitProvider>
                                </NotesProvider>
                            </ChatProvider>
                        </TaskProvider>
                    </SettingsProvider>
                </ModelProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
