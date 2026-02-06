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
            const cached = await db.cachedContent.get(content.$id);
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
            className="group bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden h-full flex flex-col"
        >
            {/* Visual Icon Header */}
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPDF ? 'bg-blue-50 text-[#2B669A]' : 'bg-slate-50 text-slate-500'}`}>
                    {isPDF ? (
                        <FileText size={24} strokeWidth={2} />
                    ) : (
                        <LinkIcon size={24} strokeWidth={2} />
                    )}
                </div>

                {isDownloaded && (
                    <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-full">
                        <Check size={14} strokeWidth={3} />
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col">
                <div className="mb-2">
                    <span className="text-[10px] font-bold text-[#2B669A] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
                        {content.subject}
                    </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mb-4 line-clamp-2 leading-snug group-hover:text-[#2B669A] transition-colors">
                    {content.title}
                </h3>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload?.(content); }}
                        className={`flex items-center gap-2 text-xs font-semibold transition-all ${isDownloaded ? 'text-emerald-600' : 'text-slate-400 hover:text-[#2B669A]'}`}
                    >
                        {isDownloaded ? <CheckCircle2 size={16} /> : <DownloadCloud size={16} />}
                        <span>{isDownloaded ? 'Offline Ready' : 'Download'}</span>
                    </button>

                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                        {content.program}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
