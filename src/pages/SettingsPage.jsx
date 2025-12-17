import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { Save, User, Sparkles, MessageSquare, Sun, Moon, Laptop } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const { settings, updateProfile, updateAiPreferences } = useSettings();
    const { theme, toggleTheme } = useTheme();

    // Local state handling isn't strictly necessary if we update context directly on change,
    // but for larger forms, it can be better. Here we'll update context directly for simplicity and instant save.

    return (
        <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-12 pb-20"
            >
                {/* Header */}
                <div className="border-b border-zinc-200 dark:border-white/10 pb-6">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Settings</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Customize your profile and AI interaction preferences.</p>
                </div>

                {/* Appearance Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                        {theme === 'dark' ? <Moon className="text-purple-400" size={24} /> : <Sun className="text-amber-500" size={24} />}
                        <h2>Appearance</h2>
                    </div>

                    <div className="bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-md font-medium text-zinc-900 dark:text-white">Theme Mode</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Switch between light and dark aesthetics.</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-200'
                                    }`}
                            >
                                <span
                                    className={`${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                        } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>
                    </div>
                </section>

                {/* User Profile Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                        <User className="text-indigo-500 dark:text-indigo-400" size={24} />
                        <h2>User Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Name</label>
                            <input
                                type="text"
                                value={settings.userProfile.name}
                                onChange={(e) => updateProfile({ name: e.target.value })}
                                className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                placeholder="How should the AI call you?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Age</label>
                            <input
                                type="text"
                                value={settings.userProfile.age}
                                onChange={(e) => updateProfile({ age: e.target.value })}
                                className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                placeholder="Your age (optional)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">About Me</label>
                        <textarea
                            value={settings.userProfile.about}
                            onChange={(e) => updateProfile({ about: e.target.value })}
                            rows={3}
                            className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 resize-none"
                            placeholder="Tell the AI a bit about yourself (e.g., I'm a software engineer, I love anime...)"
                        />
                    </div>
                </section>

                {/* AI Preferences Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                        <Sparkles className="text-purple-500 dark:text-purple-400" size={24} />
                        <h2>AI Customization</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Personality / Tone</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Professional', 'Witty', 'Friendly', 'Pirate'].map((tone) => (
                                <button
                                    key={tone}
                                    onClick={() => updateAiPreferences({ tone: tone.toLowerCase() })}
                                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${settings.aiPreferences.tone === tone.toLowerCase()
                                        ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-white'
                                        : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Custom System Instructions</label>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">These instructions will be prepended to every interaction.</p>
                        <textarea
                            value={settings.aiPreferences.customInstructions}
                            onChange={(e) => updateAiPreferences({ customInstructions: e.target.value })}
                            rows={6}
                            className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 font-mono text-sm"
                            placeholder="e.g., Always explain things like I'm 5, or Always reply in JSON format..."
                        />
                    </div>
                </section>

                {/* Save Indicator (Visual Only as it auto-saves) */}
                <div className="fixed bottom-8 right-8">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-zinc-400 text-sm">
                        <Save size={14} className="text-green-500" />
                        <span>Changes auto-saved</span>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
