import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, BarChart3, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Sparkline = ({ data, isPositive }) => {
    // Ensure we have data
    const points = useMemo(() => {
        if (!data || data.length < 2) return [];
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const width = 140;
        const height = 50;

        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height; // Invert Y
            return `${x},${y}`;
        }).join(' ');
    }, [data]);

    if (!points) return null;

    return (
        <div className="relative h-[50px] w-[140px] overflow-visible">
            <svg width="100%" height="100%" viewBox="0 0 140 50" className="overflow-visible">
                {/* Glow Filter */}
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <motion.path
                    d={`M 0,50 L ${points.split(' ')[0]} ${points} L 140,50 Z`}
                    fill="url(#fillGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                {/* Line */}
                <motion.path
                    d={`M ${points}`}
                    fill="none"
                    stroke={isPositive ? '#34d399' : '#f87171'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
};

export default function FinanceCard({ data }) {
    if (!data) return null;

    const {
        symbol = 'UNKNOWN',
        name = 'Asset',
        price = '0.00',
        currency = 'USD',
        change_percent = 0,
        change_amount = 0,
        is_positive = true,
        market_cap = '-',
        volume = '-',
        data_points = []
    } = data;

    const isPositiveChange = Boolean(is_positive);

    // Richer Gradients
    const theme = isPositiveChange
        ? {
            bg: 'from-emerald-900/30 via-zinc-950 to-zinc-950',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            iconBg: 'bg-emerald-500/10',
            indicator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }
        : {
            bg: 'from-rose-900/30 via-zinc-950 to-zinc-950',
            border: 'border-rose-500/20',
            text: 'text-rose-400',
            iconBg: 'bg-rose-500/10',
            indicator: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`my-4 relative overflow-hidden rounded-[2rem] border ${theme.border} shadow-2xl max-w-md w-full backdrop-blur-3xl group bg-zinc-950/50`}
        >
            {/* Rich Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} transition-all duration-700 opacity-60`} />

            {/* Noise texture for premium feel */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Glass Shine */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-white/20 transition-colors" />

            <div className="relative z-10 p-6 text-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-2xl ${theme.iconBg} backdrop-blur-md shadow-inner`}>
                            {symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('XRP') ? <Wallet size={20} className="text-white" /> : <DollarSign size={20} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-none mb-0.5 tracking-tight">{name}</h3>
                            <span className="text-xs font-bold opacity-50 tracking-widest">{symbol}</span>
                        </div>
                    </div>
                </div>

                {/* Main Price & Sparkline Row */}
                <div className="flex items-end justify-between mb-8">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium opacity-60 mb-1">Current Price</span>
                        <h2 className="text-5xl font-black tracking-tighter drop-shadow-xl">
                            {currency === 'USD' || currency === 'EUR' ? '€' : ''}{price}
                        </h2>
                    </div>

                    {/* Sparkline placed strategically */}
                    <div className="pb-1">
                        <Sparkline data={data_points} isPositive={isPositiveChange} />
                    </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Change Indicator */}
                    <div className={`flex flex-col justify-center p-3 rounded-2xl border ${theme.indicator}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {isPositiveChange ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            <span className="text-lg font-black tracking-tight">{change_percent}%</span>
                        </div>
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{isPositiveChange ? '+' : ''}{change_amount} {currency} (24h)</span>
                    </div>

                    {/* Volume / Market Cap Mini-Grid */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Mkt Cap</span>
                            <span className="text-xs font-bold font-mono">{market_cap}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Vol</span>
                            <span className="text-xs font-bold font-mono">{volume}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
