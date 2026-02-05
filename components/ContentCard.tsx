"use client"
import { Content } from '@/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {
    FileText,
    Link as LinkIcon,
    DownloadCloud,
    CheckCircle2,
    MoreHorizontal,
    Sparkles,
    Zap,
    Download,
    Check
} from 'lucide-react';

interface ContentCardProps {
    content: Content;
    onPress: (content: Content) => void;
    onDownload?: (content: Content) => void;
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

    const isPDF = content.type?.toLowerCase().includes('pdf');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10, transition: { duration: 0.3, ease: "easeOut" } }}
            onClick={() => onPress(content)}
            className="group bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] transition-all cursor-pointer relative overflow-hidden"
        >
            {/* Visual Header / Cover */}
            <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 rounded-[30px] mb-6 overflow-hidden relative group-hover:shadow-inner transition-all border border-transparent group-hover:border-blue-600/10">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all group-hover:scale-110 duration-700">
                    {isPDF ? (
                        <FileText size={64} className="text-blue-200 dark:text-slate-700 font-thin shrink-0" strokeWidth={1} />
                    ) : (
                        <LinkIcon size={64} className="text-blue-200 dark:text-slate-700 font-thin shrink-0" strokeWidth={1} />
                    )}
                </div>

                {/* Status Tags */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-blue-600 border border-slate-100 dark:border-slate-800 shadow-sm">
                        {content.program}
                    </div>
                </div>

                {isDownloaded && (
                    <div className="absolute top-4 right-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                        >
                            <Check size={14} className="text-white" strokeWidth={3} />
                        </motion.div>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Content Body */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{content.subject}</span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tighter italic">
                    {content.title}
                </h3>

                <div className="pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload?.(content); }}
                        className={`flex items-center gap-3 transition-all ${isDownloaded ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600 active:scale-90'}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDownloaded ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50'}`}>
                            {isDownloaded ? <Zap size={16} fill="currentColor" strokeWidth={0} /> : <Download size={16} />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isDownloaded ? 'Cached' : 'Offline'}</span>
                    </button>

                    <button className="w-10 h-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-all">
                        <MoreHorizontal size={16} className="text-slate-300" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
