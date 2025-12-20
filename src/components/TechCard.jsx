import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Battery, Smartphone, Wifi, Check, X, Layers, Tag, Star, Zap, Award, ThumbsUp } from 'lucide-react';

export default function TechCard({ data }) {
    if (!data) return null;

    const {
        product_name = 'Unknown Product',
        price = 'TBD',
        rating = 0,
        specs = {},
        pros = [],
        cons = [],
        image_url = null
    } = data;

    // Neutral Dark Theme to prevent clashing and ensure readability
    const theme = {
        bgGradient: "from-zinc-900 via-zinc-950 to-black",
        border: "border-white/10",
        accentText: "text-zinc-400"
    };

    const priceValue = price.replace(/[€$]/g, '').trim();
    // Force Euro for Spain context unless specifically another non-dollar currency
    const currencySymbol = price.includes('£') ? '£' : '€';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`my-4 relative overflow-hidden rounded-[2rem] border ${theme.border} shadow-2xl max-w-md w-full group backdrop-blur-3xl bg-black`}
        >
            {/* Deep Neutral Background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-90`} />

            {/* Product Image Background (Blended) */}
            {image_url && (
                <div className="absolute inset-0 z-0">
                    <img src={image_url} alt={product_name} className="w-full h-full object-cover opacity-40 mix-blend-overlay mask-image-gradient" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                </div>
            )}

            {/* Subtle Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative z-10">

                {/* Compact Header */}
                <div className="p-6 pb-4 relative">
                    {/* "Top Pick" Badge - More subtle */}
                    <div className="absolute top-6 right-6">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 shadow-sm">
                            <Award size={10} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Top Pick</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 pr-16">
                        {/* Rating & Tag */}
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1 text-xs font-bold text-white/80">
                                <Star size={12} className="text-yellow-500" fill="currentColor" />
                                {rating}
                            </div>
                            <div className="w-0.5 h-3 bg-white/10" />
                            <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">Tech Spec</span>
                        </div>

                        <h2 className="text-xl font-bold text-white leading-tight tracking-tight pr-4">{product_name}</h2>

                        <div className="inline-flex items-baseline gap-0.5 mt-0.5">
                            <span className="text-lg font-medium text-zinc-500">{currencySymbol}</span>
                            <span className="text-2xl font-bold text-white tracking-tight">{priceValue}</span>
                        </div>
                    </div>
                </div>

                {/* Compact Specs Grid */}
                <div className="px-6 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(specs).slice(0, 4).map(([key, value], idx) => (
                            <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5 line-clamp-1">
                                    {key}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200 truncate">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compact Verdict Section */}
                <div className="bg-zinc-900/50 border-t border-white/5 p-5">
                    <div className="grid gap-4">
                        {/* Pros */}
                        {pros.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-3">
                                    <ThumbsUp size={12} fill="currentColor" /> Why it wins
                                </h4>
                                {pros.slice(0, 3).map((pro, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] shrink-0" />
                                        <span className="leading-snug">{pro}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Divider */}
                        {(pros.length > 0 && cons.length > 0) && <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />}

                        {/* Cons - Subtle */}
                        {cons.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400/80 flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 flex items-center justify-center rounded-full border border-rose-500/30"><X size={8} /></div> Considerations
                                </h4>
                                {cons.slice(0, 2).map((con, i) => (
                                    <div key={i} className="flex items-start gap-3 text-xs text-zinc-500">
                                        <span className="leading-snug">{con}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
