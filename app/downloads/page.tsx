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
    BookOpen,
    WifiOff,
    Cloud
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export default function DownloadsPage() {
    const { user } = useAuthStore();
    const [downloadedItems, setDownloadedItems] = useState<CachedContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingItem, setViewingItem] = useState<{ url: string; item: CachedContent } | null>(null);
    const isOffline = useOffline();

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
        // Pass the raw blob directly; the PDFViewer now handles binary conversion for iOS
        setViewingItem({ url: item.blob as any, item });
    };

    const handleDeleteDownload = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this resource from your local clinical storage?')) {
            await db.cachedContent.delete(id);
            fetchDownloadedItems();
        }
    };

    const totalSize = (downloadedItems.reduce((acc, item) => acc + (item.blob.size || 0), 0) / (1024 * 1024)).toFixed(1);

    return (
        <div className="min-h-screen bg-[#F3F5F7] px-6 py-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 border-b border-slate-200 pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-[#2B669A] uppercase tracking-wide">Offline Storage</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Downloads
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">Locally cached clinical resources.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                                <HardDrive size={18} className="text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Used Space</p>
                                    <p className="font-bold text-slate-800 text-sm">{totalSize} MB</p>
                                </div>
                            </div>

                            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isOffline
                                ? 'bg-amber-50 border-amber-100 text-amber-600'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                }`}>
                                {isOffline ? <WifiOff size={14} /> : <Cloud size={14} />}
                                <span className="text-[10px] font-bold uppercase tracking-wide">
                                    {isOffline ? 'Offline' : ' synced'}
                                </span>
                            </div>
                        </div>
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
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-lg border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
                            <DownloadCloud className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No Downloads</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm">
                            Resources you download will appear here.
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
                                setViewingItem(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
