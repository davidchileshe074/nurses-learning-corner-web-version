"use client"
import { useState, useEffect } from 'react';
import { db, CachedContent } from '@/lib/db';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ContentCard } from '@/components/ContentCard';
import { PDFViewer } from '@/components/PDFViewer';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DownloadCloud,
    Trash2,
    Search,
    HardDrive,
    ShieldCheck,
    ChevronRight,
    Activity,
    BookOpen
} from 'lucide-react';

export default function DownloadsPage() {
    const { user } = useAuthStore();
    const [downloadedItems, setDownloadedItems] = useState<CachedContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingItem, setViewingItem] = useState<{ url: string; item: CachedContent } | null>(null);

    useEffect(() => {
        fetchDownloadedItems();
    }, []);

    const fetchDownloadedItems = async () => {
        setIsLoading(true);
        try {
            const items = await db.cachedContent.reverse().toArray();
            setDownloadedItems(items);
        } catch (error) {
            console.error('Failed to fetch downloads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenContent = (item: CachedContent) => {
        const url = URL.createObjectURL(item.blob);
        setViewingItem({ url, item });
    };

    const handleDeleteDownload = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this resource from your local clinical storage?')) {
            await db.cachedContent.where('$id').equals(id).delete();
            fetchDownloadedItems();
        }
    };

    const totalSize = (downloadedItems.reduce((acc, item) => acc + (item.blob.size || 0), 0) / (1024 * 1024)).toFixed(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-14">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Offline Clinical Archives</span>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                                Downloads <span className="text-blue-600 italic">.</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-2">Your portable high-fidelity clinical library.</p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 px-8 py-4 rounded-[30px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex items-center gap-6"
                        >
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Local Storage</p>
                                <p className="font-black text-slate-900 dark:text-white text-xl leading-none">{totalSize} <span className="text-xs text-slate-400">MB</span></p>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[450px] bg-white dark:bg-slate-900 rounded-[40px] animate-pulse border border-slate-100 dark:border-slate-800"></div>
                        ))}
                    </div>
                ) : downloadedItems.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        <AnimatePresence>
                            {downloadedItems.map((item) => (
                                <motion.div
                                    key={item.$id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative group"
                                >
                                    <ContentCard
                                        content={item}
                                        onPress={() => handleOpenContent(item)}
                                    />
                                    <button
                                        onClick={(e) => handleDeleteDownload(item.$id, e)}
                                        className="absolute top-6 right-6 p-4 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl hover:bg-red-500 text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100 z-10 border border-white/10 shadow-2xl"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-slate-900 rounded-[60px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-[35%] mx-auto mb-8 shadow-xl relative z-10">
                            <DownloadCloud className="text-slate-300" size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic relative z-10">Offline Vault Empty</h3>
                        <p className="text-slate-400 font-medium text-base mt-4 uppercase tracking-widest max-w-sm mx-auto px-6 relative z-10 leading-loose">
                            Downloaded clinical materials will be archived here for instant offline access.
                        </p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewingItem && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <PDFViewer
                            url={viewingItem.url}
                            userId={user.$id}
                            contentId={viewingItem.item.$id}
                            onClose={() => {
                                URL.revokeObjectURL(viewingItem.url);
                                setViewingItem(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
