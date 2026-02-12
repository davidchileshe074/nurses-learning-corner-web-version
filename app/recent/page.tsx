"use client";

import { useState, useEffect } from 'react';
import { getRecentItems, ContentItem } from '@/services/recentStudy';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, BookOpen, FileText, Layers, ChevronRight, History, Sparkles } from 'lucide-react';

export default function RecentStudyPage() {
    const [recentItems, setRecentItems] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadRecent = async () => {
            setIsLoading(true);
            try {
                const items = await getRecentItems();
                setRecentItems(items);
            } catch (error) {
                console.error('Failed to load recent items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRecent();
    }, []);

    const getTypeIcon = (type: string) => {
        if (type.toLowerCase().includes('pdf')) return FileText;
        if (type.toLowerCase().includes('flashcard')) return Layers;
        return BookOpen;
    };

    return (
        <div className="min-h-screen bg-[#F3F5F7] px-6 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-3"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                            <History className="text-[#2B669A]" size={24} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#2B669A] uppercase tracking-wider block">Study History</span>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recent Study</h1>
                        </div>
                    </motion.div>
                    <p className="text-slate-600 text-sm mt-2 ml-[60px]">
                        Pick up where you left off with your most recently accessed materials
                    </p>
                </header>

                {/* Content */}
                <main>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse bg-white rounded-2xl h-40 border border-slate-200"></div>
                            ))}
                        </div>
                    ) : recentItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {recentItems.map((item, index) => {
                                    const Icon = getTypeIcon(item.type);
                                    return (
                                        <motion.div
                                            key={item.$id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => router.push(`/library/details?id=${item.$id}`)}
                                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#2B669A]/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#2B669A] group-hover:text-white transition-all shrink-0">
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-[#2B669A] uppercase tracking-wide mb-1">
                                                        {item.subject}
                                                    </p>
                                                    <h3 className="text-slate-900 font-bold text-sm line-clamp-2 leading-tight group-hover:text-[#2B669A] transition-colors">
                                                        {item.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock size={14} />
                                                    <span className="text-xs font-medium">Recently accessed</span>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#2B669A] transition-colors" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-32 h-32 bg-white rounded-[50px] border border-slate-200 shadow-sm flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-blue-600/5 blur-2xl rounded-full"></div>
                                <History size={48} className="text-slate-200 relative z-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Recent Study</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed mb-8">
                                Your recently accessed materials will appear here. Start exploring the library to build your study history.
                            </p>
                            <button
                                onClick={() => router.push('/library')}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[#2B669A] text-white rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-[#234f7a] transition-all shadow-lg shadow-[#2B669A]/20"
                            >
                                <BookOpen size={18} />
                                Browse Library
                                <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
}
