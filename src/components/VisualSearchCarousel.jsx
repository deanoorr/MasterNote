
import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowUpRight } from 'lucide-react';

export default function VisualSearchCarousel({ images = [], isLoading = false }) {
    if (!isLoading && (!images || images.length === 0)) return null;

    return (
        <div className="mb-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Layers size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Sources</span>
                </div>
                {images.length > 0 && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {images.length} images
                    </span>
                )}
            </div>

            {/* Carousel */}
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x">
                {isLoading ? (
                    // Skeleton Loading
                    Array(4).fill(0).map((_, i) => (
                        <div
                            key={i}
                            className="bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-40 h-28 shrink-0 animate-pulse"
                        />
                    ))
                ) : (
                    // Image Cards
                    images.map((img, idx) => (
                        <motion.a
                            key={idx}
                            href={img.contextLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative w-44 h-28 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 cursor-pointer snap-start"
                        >
                            <img
                                src={img.link} /* Use full resolution link */
                                alt={img.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    /* Fallback to thumbnail if full res fails */
                                    if (e.target.src !== img.thumbnailLink) {
                                        e.target.src = img.thumbnailLink;
                                    } else {
                                        e.target.style.display = 'none';
                                    }
                                }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <div className="text-[10px] text-white/90 truncate font-medium">
                                    {img.source || 'Source'}
                                </div>
                            </div>

                            {/* External Link Icon */}
                            <div className="absolute top-1.5 right-1.5 p-1 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                <ArrowUpRight size={10} />
                            </div>
                        </motion.a>
                    ))
                )}
            </div>
        </div>
    );
}
