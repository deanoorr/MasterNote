// Soundscapes Component - Audio fixed
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, CloudRain, Trees, Coffee, Wind } from 'lucide-react';

const TRACKS = [
    {
        id: 'rain',
        name: 'Heavy Rain',
        icon: CloudRain,
        src: 'https://www.gstatic.com/voice_delight/sounds/long/rain.mp3',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'forest',
        name: 'Deep Forest',
        icon: Trees,
        src: 'https://www.gstatic.com/voice_delight/sounds/long/forest.mp3',
        color: 'from-emerald-500 to-green-600'
    },
    {
        id: 'cafe',
        name: 'Cafe Ambience',
        icon: Coffee,
        src: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'ocean',
        name: 'Ocean Waves',
        icon: Wind,
        src: 'https://www.gstatic.com/voice_delight/sounds/long/ocean.mp3',
        color: 'from-cyan-500 to-blue-600'
    }
];

export default function Soundscapes() {
    const [activeTrack, setActiveTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const audio = audioRef.current;
        audio.loop = true;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        audio.volume = volume;
    }, [volume]);

    const toggleTrack = (track) => {
        const audio = audioRef.current;

        if (activeTrack?.id === track.id) {
            // Toggle play/pause for current track
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        } else {
            // Switch track
            audio.src = track.src;
            audio.play().catch(e => console.error("Audio playback error:", e));
            setActiveTrack(track);
            setIsPlaying(true);
        }
    };

    return (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-white/10 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Volume2 size={20} className="text-purple-500" />
                    Soundscapes
                </h3>

                {/* Global Volume Control */}
                <div className="flex items-center gap-2">
                    {volume === 0 ? <VolumeX size={16} className="text-zinc-400" /> : <Volume2 size={16} className="text-zinc-400" />}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {TRACKS.map(track => {
                    const isActive = activeTrack?.id === track.id;
                    return (
                        <button
                            key={track.id}
                            onClick={() => toggleTrack(track)}
                            className={`relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${isActive
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.02]'
                                : 'bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            {/* Animated Background Gradient */}
                            {isActive && isPlaying && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${track.color} opacity-20 animate-pulse`} />
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className={`p-3 rounded-full transition-colors ${isActive
                                    ? 'bg-white/20 dark:bg-black/10'
                                    : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                                    }`}>
                                    {isActive && isPlaying
                                        ? <Pause size={20} fill="currentColor" />
                                        : <track.icon size={20} />
                                    }
                                </div>
                                <span className="font-medium text-sm">{track.name}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Now Playing Indicator */}
            {activeTrack && isPlaying && (
                <div className="mt-6 flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-purple-500 rounded-full animate-music-bar"
                            style={{
                                height: '12px',
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.8s'
                            }}
                        />
                    ))}
                    <span className="text-xs text-zinc-500 ml-2">Playing {activeTrack.name}</span>
                </div>
            )}

            <style>{`
                @keyframes music-bar {
                    0%, 100% { height: 8px; opacity: 0.5; }
                    50% { height: 20px; opacity: 1; }
                }
                .animate-music-bar {
                    animation: music-bar infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
