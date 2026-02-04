'use client';

import { Content } from '@/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface ContentCardProps {
    content: Content;
    onPress: (content: Content) => void;
    onDownload: (content: Content) => void;
}

export function ContentCard({ content, onPress, onDownload }: ContentCardProps) {
    const [isDownloaded, setIsDownloaded] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            const cached = await db.cachedContent.where('$id').equals(content.$id).first();
            setIsDownloaded(!!cached);
        }
        checkStatus();
    }, [content.$id]);

    return (
        <motion.div
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            onClick={() => onPress(content)}
            className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    {content.type === 'pdf' ? (
                        <svg className="w-16 h-16 text-slate-300 dark:text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                    ) : content.type === 'video' ? (
                        <svg className="w-16 h-16 text-slate-300 dark:text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                        </svg>
                    ) : (
                        <svg className="w-16 h-16 text-slate-300 dark:text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                        </svg>
                    )}
                </div>

                <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-600 shadow-sm border border-slate-100 dark:border-slate-800">
                        {content.program}
                    </span>
                </div>

                {isDownloaded && (
                    <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {content.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{content.subject}</p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(content); }}
                        className={`flex items-center gap-2 group/btn ${isDownloaded ? 'text-green-600' : 'text-slate-400 hover:text-blue-600'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDownloaded ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800 group-hover/btn:bg-blue-50'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase">{isDownloaded ? 'Cached' : 'Offline'}</span>
                    </button>
                    <button title="more" className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
