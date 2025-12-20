import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, MapPin, Calendar, Globe } from 'lucide-react';

export default function SportsCard({ data }) {
    if (!data) return null;

    const {
        league = 'League',
        status = 'Scheduled',
        home_team = { name: 'Home', score: '-', logo_color: 'from-gray-700 to-gray-900', logo_url: null },
        away_team = { name: 'Away', score: '-', logo_color: 'from-gray-700 to-gray-900', logo_url: null },
        venue = 'Unknown Venue'
    } = data;

    const isLive = status.toLowerCase().includes('live') || status.toLowerCase().includes("'");

    // Helper to get safe gradients or default
    const getGradient = (colorString) => {
        if (!colorString || !colorString.includes('from-')) return 'from-zinc-800 to-zinc-900';
        return colorString;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="my-6 relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl max-w-lg w-full group bg-black"
        >
            {/* Dynamic Background Split - Much Darker */}
            <div className="absolute inset-0 flex">
                <div className={`w-1/2 bg-gradient-to-br ${getGradient(home_team.logo_color)} opacity-20 transition-all duration-700`} />
                <div className={`w-1/2 bg-gradient-to-bl ${getGradient(away_team.logo_color)} opacity-20 transition-all duration-700`} />
            </div>

            {/* Dramatic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />

            {/* Texture */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10 text-white p-6 pb-8">

                {/* Header Pill */}
                <div className="flex justify-center mb-6">
                    <div className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3 shadow-lg">
                        <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-white/90">
                            <Trophy size={10} className="text-yellow-400" />
                            {league}
                        </div>
                        <div className="w-px h-3 bg-white/20" />
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/70">
                            <MapPin size={10} />
                            {venue}
                        </div>
                    </div>
                </div>

                {/* Main Scoreboard */}
                <div className="flex items-center justify-between gap-2">

                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${getGradient(home_team.logo_color)} shadow-[0_8px_16px_rgba(0,0,0,0.3)] border border-white/20 flex items-center justify-center text-sm font-black overflow-hidden relative group/icon`}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                            {home_team.logo_url ? (
                                <img
                                    src={home_team.logo_url}
                                    alt={home_team.name}
                                    className="w-full h-full object-cover p-2"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <span className={`relative z-10 ${home_team.logo_url ? 'hidden' : 'block'}`}>{home_team.name.substring(0, 3).toUpperCase()}</span>
                        </motion.div>
                        <h3 className="font-extrabold text-xl leading-none text-center tracking-tight mb-1 drop-shadow-md">{home_team.name}</h3>
                        <span className="text-[9px] opacity-60 uppercase font-bold tracking-[0.2em]">Home</span>
                    </div>

                    {/* VS / Score Widget */}
                    <div className="flex flex-col items-center px-2 z-20">
                        <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-6 py-3 border border-white/10 flex items-center gap-5 shadow-2xl min-w-[140px] justify-center">
                            <span className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-2xl">{home_team.score ?? '-'}</span>
                            <div className="flex flex-col gap-0.5 opacity-50">
                                <div className="w-1 h-1 bg-white rounded-full" />
                                <div className="w-1 h-1 bg-white rounded-full" />
                            </div>
                            <span className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-2xl">{away_team.score ?? '-'}</span>
                        </div>

                        {/* Status Pill */}
                        <div className={`mt-[-12px] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg z-10 ${isLive ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                            {status}
                        </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${getGradient(away_team.logo_color)} shadow-[0_8px_16px_rgba(0,0,0,0.3)] border border-white/20 flex items-center justify-center text-sm font-black overflow-hidden relative group/icon`}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                            {away_team.logo_url ? (
                                <img
                                    src={away_team.logo_url}
                                    alt={away_team.name}
                                    className="w-full h-full object-cover p-2"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <span className={`relative z-10 ${away_team.logo_url ? 'hidden' : 'block'}`}>{away_team.name.substring(0, 3).toUpperCase()}</span>
                        </motion.div>
                        <h3 className="font-extrabold text-xl leading-none text-center tracking-tight mb-1 drop-shadow-md">{away_team.name}</h3>
                        <span className="text-[9px] opacity-60 uppercase font-bold tracking-[0.2em]">Away</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
