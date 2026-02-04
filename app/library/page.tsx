'use client';

import { useState, useEffect, useCallback } from 'react';
import { contentServices } from '@/services/content';
import { noteServices } from '@/services/notes';
import { Content, Program } from '@/types';
import { ContentCard } from '@/components/ContentCard';
import { PDFViewer } from '@/components/PDFViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/hooks/useAuthStore';
import { storage, config } from '@/lib/appwrite';
import { db } from '@/lib/db';

import { activityServices } from '@/services/activity';

const PROGRAMS: Program[] = ['RN', 'RM', 'PHN', 'EN', 'EM'];

export default function LibraryPage() {
    const { profile, user } = useAuthStore();
    const [content, setContent] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState<Program | 'ALL'>(profile?.program || 'ALL');

    // Viewer State
    const [viewingContent, setViewingContent] = useState<Content | null>(null);
    const [viewerUrl, setViewerUrl] = useState<string>('');
    const [initialPage, setInitialPage] = useState(1);

    const fetchContent = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await contentServices.getLibraryContent(
                selectedProgram === 'ALL' ? undefined : selectedProgram
            );

            const filteredData = searchQuery
                ? data.filter(item =>
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.subject.toLowerCase().includes(searchQuery.toLowerCase())
                )
                : data;

            setContent(filteredData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProgram, searchQuery]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDownload = async (item: Content) => {
        if (!item.fileId) return;

        try {
            // 1. Fetch file as blob
            const fileBlob = await storage.getFileDownload(config.bucketId, item.fileId);

            // 2. Save to Dexie
            await db.cachedContent.put({
                ...item,
                blob: fileBlob,
                downloadedAt: new Date().toISOString()
            } as any);

            // Trigger re-render of cards (they check status on mount/effect)
            fetchContent();
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleOpenContent = async (item: Content) => {
        console.log('Opening content:', item);
        if (item.type !== 'pdf') {
            console.log('Not a PDF, skipping');
            return;
        }

        if (!user) {
            console.error('User not logged in, cannot open content');
            return;
        }

        // 1. Check if cached
        const cached = await db.cachedContent.where('$id').equals(item.$id).first();
        let url = '';

        if (cached) {
            console.log('Using cached version');
            url = URL.createObjectURL(cached.blob);
        } else if (item.fileId) {
            console.log('Using Appwrite view URL');
            url = storage.getFileView(config.bucketId, item.fileId).toString();
        }

        console.log('Generated URL:', url);

        if (url) {
            // 2. Fetch last read position from notes
            try {
                const lastNote = await noteServices.getNoteByContent(user!.$id, item.$id);
                console.log('Last read position:', lastNote?.lastPosition);
                setInitialPage(lastNote?.lastPosition || 1);
            } catch (e) {
                console.warn('Failed to fetch last position:', e);
                setInitialPage(1);
            }

            setViewerUrl(url);
            setViewingContent(item);

            // Log activity
            activityServices.logActivity(user!.$id, {
                contentId: item.$id,
                type: 'pdf',
                title: item.title,
                subject: item.subject
            }).catch(err => console.error('Failed to log activity:', err));
        } else {
            console.error('No URL generated for item:', item.$id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header & Filters */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-6 transition-all">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Library</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Curated medical resources for professional excellence.</p>
                        </div>

                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search subjects, manuals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 rounded-2xl outline-none transition-all text-slate-900 dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'All Resources' },
                            ...PROGRAMS.map(p => ({ id: p, label: p }))
                        ].map((prog) => (
                            <button
                                key={prog.id}
                                onClick={() => setSelectedProgram(prog.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedProgram === prog.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
                                    }`}
                            >
                                {prog.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl h-[450px] border border-slate-100 dark:border-slate-800"></div>
                        ))}
                    </div>
                ) : content.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        <AnimatePresence>
                            {content.map((item) => (
                                <ContentCard
                                    key={item.$id}
                                    content={item}
                                    onPress={handleOpenContent}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">No resources found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your filters or search query.</p>
                        <button
                            onClick={() => { setSelectedProgram('ALL'); setSearchQuery(''); }}
                            className="mt-6 font-bold text-blue-600 hover:text-blue-500"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </main>

            {/* PDF Viewer Modal */}
            <AnimatePresence>
                {viewingContent && viewerUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                    >
                        <PDFViewer
                            url={viewerUrl}
                            userId={user!.$id}
                            contentId={viewingContent.$id}
                            initialPage={initialPage}
                            onClose={() => {
                                setViewingContent(null);
                                setViewerUrl('');
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
