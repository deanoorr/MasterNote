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

const getWeatherIcon = (code, isDay = true, size = 24) => {
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
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`my-4 relative overflow-hidden rounded-3xl border border-white/20 shadow-xl transition-all duration-500 w-full max-w-xl`}
        >
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transition-colors duration-1000`} />

            {/* Glass Overlays */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-black/10 dark:bg-transparent" />

            {/* Content Wrapper */}
            <div className="relative z-10 p-3 md:p-5 text-white">

                {/* Header: Location & Status */}
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-0.5">
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-1.5"
                        >
                            <Navigation size={12} className="opacity-80 rotate-45" />
                            <h3 className="text-base font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">{location.name || 'Unknown'}</h3>
                        </motion.div>
                        <p className="text-[10px] font-medium opacity-70 flex items-center gap-1 pl-0.5">
                            {location.admin1 ? `${location.admin1}, ` : ''}{location.country || ''} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <motion.div
                        className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5"
                    >
                        {getWeatherIcon(current.weather_code, current.is_day, 14)}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{theme.label}</span>
                    </motion.div>
                </div>

                {/* Main Content: Temp + Grid */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
                    {/* Big Temp */}
                    <div className="flex flex-col items-center sm:items-start">
                        <motion.h2
                            className="text-5xl font-black tracking-tighter drop-shadow-lg leading-none"
                        >
                            {Math.round(current.temperature_2m)}°
                        </motion.h2>
                        <div className="flex gap-2 items-center mt-1">
                            <span className="flex items-center gap-1 text-xs font-bold">
                                <ArrowUp size={10} className="text-red-300" />
                                {Math.round(daily?.temperature_2m_max?.[0] || 0)}°
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold opacity-70">
                                <ArrowUp size={10} className="text-blue-300 rotate-180" />
                                {Math.round(daily?.temperature_2m_min?.[0] || 0)}°
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-12 bg-white/20 rounded-full" />

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 w-full sm:flex-1">
                        {[
                            { icon: <Droplets size={12} />, label: 'Hum', value: `${current.relative_humidity_2m}%` },
                            { icon: <Wind size={12} />, label: 'Wind', value: `${Math.round(current.wind_speed_10m)}` },
                            { icon: <Thermometer size={12} />, label: 'Feels', value: `${Math.round(current.apparent_temperature)}°` },
                            { icon: <Gauge size={12} />, label: 'Rain', value: `${current.precipitation}` },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/5"
                            >
                                <div className="opacity-80 mb-0.5">{item.icon}</div>
                                <div className="text-[10px] font-bold leading-none">{item.value}</div>
                                <div className="text-[8px] opacity-50 uppercase tracking-tight mt-0.5">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly Forecast Section (Compact) */}
                <div className="pt-3 border-t border-white/10">
                    <div className="grid grid-cols-7 gap-1">
                        {(daily?.time || []).slice(0, 7).map((time, idx) => (
                            <motion.div
                                key={time + idx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (idx * 0.05) }}
                                className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">
                                    {getDayName(time)[0]}
                                </span>
                                <div className="my-0.5">
                                    {getWeatherIcon(daily?.weather_code?.[idx] || 0, true, 14)}
                                </div>
                                <div className="flex flex-col items-center leading-none gap-0.5">
                                    <span className="text-[10px] font-bold">{Math.round(daily?.temperature_2m_max?.[idx] || 0)}°</span>
                                    <span className="text-[8px] font-medium opacity-50">{Math.round(daily?.temperature_2m_min?.[idx] || 0)}°</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Subtle Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-[60px] pointer-events-none mix-blend-overlay" />
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
