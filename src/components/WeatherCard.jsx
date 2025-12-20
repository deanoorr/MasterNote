
import React from 'react';
import { motion } from 'framer-motion';
import {
    Cloud,
    Sun,
    CloudRain,
    Snowflake,
    CloudLightning,
    Wind,
    Droplets,
    Thermometer,
    CloudSun,
    Navigation,
    Gauge,
    Calendar
} from 'lucide-react';

const getWeatherIcon = (code, isDay = true, size = 32) => {
    const props = { size, className: "transition-all duration-500" };
    if (code === 0) return <Sun {...props} className={`${props.className} text-yellow-300`} />;
    if (code >= 1 && code <= 3) return <CloudSun {...props} className={`${props.className} text-white`} />;
    if (code >= 45 && code <= 48) return <Cloud {...props} className={`${props.className} text-white/80`} />;
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return <CloudRain {...props} className={`${props.className} text-blue-200`} />;
    if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return <Snowflake {...props} className={`${props.className} text-white`} />;
    if (code >= 95 && code <= 99) return <CloudLightning {...props} className={`${props.className} text-yellow-400`} />;
    return <Cloud {...props} className={`${props.className} text-white`} />;
};

const getWeatherTheme = (code, isDay) => {
    if (code === 0) {
        return {
            gradient: isDay
                ? 'from-blue-400 via-blue-500 to-amber-200'
                : 'from-slate-900 via-indigo-950 to-purple-900',
            label: 'Clear Sky'
        };
    }
    if (code >= 1 && code <= 3) {
        return {
            gradient: isDay
                ? 'from-blue-400 via-indigo-400 to-slate-300'
                : 'from-slate-900 via-slate-800 to-indigo-900',
            label: code === 3 ? 'Overcast' : 'Partly Cloudy'
        };
    }
    if (code >= 45 && code <= 48) {
        return {
            gradient: 'from-slate-400 via-zinc-400 to-slate-500',
            label: 'Foggy'
        };
    }
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) {
        return {
            gradient: 'from-indigo-600 via-blue-700 to-slate-800',
            label: 'Rainy'
        };
    }
    if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
        return {
            gradient: 'from-blue-100 via-blue-200 to-indigo-300',
            label: 'Snowy'
        };
    }
    if (code >= 95 && code <= 99) {
        return {
            gradient: 'from-purple-900 via-slate-900 to-blue-900',
            label: 'Thunderstorm'
        };
    }
    return {
        gradient: 'from-zinc-500 via-zinc-600 to-zinc-700',
        label: 'Cloudy'
    };
};

const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export default function WeatherCard({ data, location }) {
    if (!data || !data.current || !location) return null;

    const current = data.current;
    const daily = data.daily;
    const theme = getWeatherTheme(current.weather_code, current.is_day);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`my-6 relative overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl transition-all duration-700`}
        >
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transition-colors duration-1000`} />

            {/* Glass Overlays */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-black/10 dark:bg-transparent" />

            {/* Content Wrapper */}
            <div className="relative z-10 p-8 text-white">

                {/* Header: Location & Status */}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <Navigation size={14} className="opacity-80 rotate-45" />
                            <h3 className="text-xl font-bold tracking-tight">{location.name || 'Unknown'}</h3>
                        </motion.div>
                        <p className="text-sm font-medium opacity-70 flex items-center gap-2">
                            {location.admin1 ? `${location.admin1}, ` : ''}{location.country || ''} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner"
                    >
                        {getWeatherIcon(current.weather_code, current.is_day, 32)}
                    </motion.div>
                </div>

                {/* Main Temperature Display */}
                <div className="flex items-center gap-8 mb-10">
                    <motion.h2
                        className="text-8xl font-black tracking-tighter drop-shadow-2xl"
                    >
                        {Math.round(current.temperature_2m)}°
                    </motion.h2>
                    <div className="flex flex-col gap-2">
                        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase">
                            {theme.label}
                        </div>
                        <div className="flex gap-4 items-center">
                            <span className="flex items-center gap-1.5 text-sm font-bold">
                                <ArrowUp size={14} className="text-red-300" />
                                {Math.round(daily.temperature_2m_max[0])}°
                            </span>
                            <div className="w-px h-3 bg-white/20" />
                            <span className="flex items-center gap-1.5 text-sm font-bold opacity-80">
                                <ArrowUp size={14} className="text-blue-300 rotate-180" />
                                {Math.round(daily.temperature_2m_min[0])}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    {[
                        { icon: <Droplets size={16} />, label: 'Humidity', value: `${current.relative_humidity_2m}%`, color: 'text-blue-200' },
                        { icon: <Wind size={16} />, label: 'Wind', value: `${Math.round(current.wind_speed_10m)} km/h`, color: 'text-slate-200' },
                        { icon: <Thermometer size={16} />, label: 'Feels Like', value: `${Math.round(current.apparent_temperature)}°`, color: 'text-orange-200' },
                        { icon: <Gauge size={16} />, label: 'Precipitation', value: `${current.precipitation}mm`, color: 'text-cyan-200' },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all duration-300"
                        >
                            <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                            <div className="text-[9px] uppercase tracking-widest font-black opacity-50 mb-0.5">{item.label}</div>
                            <div className="text-base font-bold">{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* Weekly Forecast Section */}
                <div className="pt-6 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-2 mb-4 opacity-70">
                        <Calendar size={14} />
                        <span className="text-xs font-black uppercase tracking-widest">7-Day Forecast</span>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                        {(daily?.time || []).map((time, idx) => (
                            <motion.div
                                key={time + idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + (idx * 0.05) }}
                                className="flex flex-col items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300"
                            >
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                    {getDayName(time)}
                                </span>
                                <div className="p-1.5 rounded-xl bg-white/5">
                                    {getWeatherIcon(daily?.weather_code?.[idx] || 0, true, 20)}
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black">{Math.round(daily?.temperature_2m_max?.[idx] || 0)}°</span>
                                    <span className="text-[10px] font-bold opacity-50">{Math.round(daily?.temperature_2m_min?.[idx] || 0)}°</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Animated Particle Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>
            </div>
        </motion.div>
    );
}

const ArrowUp = ({ size, className, rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ transform: `rotate(${rotate}deg)` }}
    >
        <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
    </svg>
);
