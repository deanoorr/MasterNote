import React from 'react';
import NotesBoard from '../components/NotesBoard';

export default function NotesPage() {
    return (
        <div className="h-full w-full bg-gray-50 dark:bg-black/20 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
            <NotesBoard />
        </div>
    );
}
