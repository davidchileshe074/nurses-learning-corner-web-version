'use client';

import { useState, useEffect, use } from 'react';
import { contentServices } from '@/services/content';
import { Content } from '@/types';
import { storage, config } from '@/lib/appwrite';
import { db } from '@/lib/db';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFViewer } from '@/components/PDFViewer';
import { noteServices } from '@/services/notes';
import { subscriptionServices } from '@/services/subscription';
import { useRouter } from 'next/navigation';
import { activityServices } from '@/services/activity';

export default function ContentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuthStore();
    const router = useRouter();

    const [content, setContent] = useState<Content | null>(null);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Viewer State
    const [isViewing, setIsViewing] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string>('');
    const [initialPage, setInitialPage] = useState(1);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [savedPage, setSavedPage] = useState(1);

    useEffect(() => {
        const loadPageData = async () => {
            setIsLoading(true);
            try {
                // 1. Try to get from Cache first (for offline support)
                const cached = await db.cachedContent.where('$id').equals(id).first();

                if (cached) {
                    setContent(cached);
                    setIsDownloaded(true);
                } else {
                    // 2. Fetch from Appwrite if not in cache
                    const data = await contentServices.getContentById(id);
                    setContent(data);

                    // Also check if already downloaded by $id
                    const isAlreadyDownloaded = await db.cachedContent.where('$id').equals(id).count();
                    setIsDownloaded(isAlreadyDownloaded > 0);
                }
            } catch (error) {
                console.error('Failed to load content details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPageData();
    }, [id]);

    const handleDownload = async () => {
        if (!content || isDownloaded || !user) return;

        // Subscription Check
        const sub = await subscriptionServices.getSubscriptionStatus(user.$id);
        const isActive = subscriptionServices.checkSubscriptionExpiry(sub);

        if (!isActive) {
            alert('An active subscription is required to download premium clinical resources.');
            router.push('/profile'); // Redirect to profile/subscription page
            return;
        }

        setIsDownloading(true);
        const fileId = content.fileId || (content as any).storageFileId;

        if (!fileId) {
            console.error('No file ID found for download');
            alert('This resource does not have an associated file for download.');
            setIsDownloading(false);
            return;
        }

        try {
            // 1. Get download URL
            const fileUrl = storage.getFileDownload(config.bucketId, fileId);

            // 2. Fetch file as blob
            const response = await fetch(fileUrl.toString());
            const fileBlob = await response.blob();

            // 3. Save to Dexie
            await db.cachedContent.put({
                ...content,
                blob: fileBlob,
                downloadedAt: new Date().toISOString()
            } as any);

            setIsDownloaded(true);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please check your connection and try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleOpenReader = async (forceStartFresh = false) => {
        if (!content || !user) return;

        // Subscription Check
        const sub = await subscriptionServices.getSubscriptionStatus(user.$id);
        const isActive = subscriptionServices.checkSubscriptionExpiry(sub);

        if (!isActive) {
            alert('An active subscription is required to access premium clinical resources.');
            router.push('/profile');
            return;
        }

        // Check for saved progress (Educational Continuity)
        const { downloadServices } = await import('@/services/download');
        const progress = await downloadServices.getReadingProgress(content.$id);

        if (progress > 1 && !forceStartFresh && !showResumeModal && !isViewing) {
            setSavedPage(progress);
            setShowResumeModal(true);
            return;
        }

        const fileId = content.fileId || (content as any).storageFileId;
        const cached = await db.cachedContent.where('$id').equals(content.$id).first();
        let url = '';

        if (cached && cached.blob instanceof Blob) {
            url = URL.createObjectURL(cached.blob);
        } else if (fileId) {
            url = storage.getFileView(config.bucketId, fileId).toString();
        } else if (content.url) {
            url = content.url;
        }

        if (!url) {
            alert('No viewing URL available for this material.');
            return;
        }

        setInitialPage(forceStartFresh ? 1 : (progress || 1));
        setViewerUrl(url);
        setIsViewing(true);
        setShowResumeModal(false);

        // Log activity (Educational Continuity)
        activityServices.logActivity(user.$id, {
            contentId: content.$id,
            type: 'pdf',
            title: content.title,
            subject: content.subject
        }).catch(err => console.error('Failed to log activity:', err));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Archives...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Resource Not Found</h1>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Hero Section */}
            <div className="relative h-96 bg-slate-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-slate-950/90 z-10"></div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                {/* Content Icon/Thumbnail Placeholder */}
                <div className="relative z-20 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/20 flex items-center justify-center mb-6"
                    >
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </motion.div>
                </div>

                {/* Navigation Bar */}
                <div className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Info Section */}
            <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-950/10 dark:shadow-black/50 p-8 md:p-12 border border-white dark:border-slate-800"
                >
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-900/50">
                            {content.program}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {content.subject}
                        </span>
                        {isDownloaded && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-900/50 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Available Offline
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                        {content.title}
                    </h1>

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
                            {content.description || 'No detailed description available for this resource. This clinical material is designed to support healthcare professionals in their educational journey.'}
                        </p>
                    </div>

                    {/* Meta Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 py-8 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 uppercase">{content.type}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Added</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{new Date(content.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-12">
                        <button
                            onClick={() => handleOpenReader()}
                            className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Open Material
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={isDownloaded || isDownloading}
                            className={`flex-1 py-5 rounded-3xl font-black uppercase text-sm tracking-widest border-2 active:scale-95 transition-all flex items-center justify-center gap-3 ${isDownloaded
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-blue-600 hover:text-blue-600'
                                }`}
                        >
                            {isDownloading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isDownloaded ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            {isDownloading ? 'Caching...' : isDownloaded ? 'Available Offline' : 'Download Offline'}
                        </button>
                    </div>

                    {isDownloaded && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => router.push('/downloads')}
                            className="mt-6 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            View in Downloads
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Resume Session Modal */}
            <AnimatePresence>
                {showResumeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[48px] p-10 max-w-md w-full shadow-2xl border border-white dark:border-slate-800 text-center relative overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[35%] flex items-center justify-center mx-auto mb-8 text-blue-600 relative z-10">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-3">Resume Prep?</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[3px] mb-10">
                                You left off at Page {savedPage}
                            </p>

                            <div className="flex flex-col gap-4 relative z-10">
                                <button
                                    onClick={() => handleOpenReader(false)}
                                    className="py-5 bg-blue-600 rounded-3xl font-black uppercase text-xs tracking-[2px] text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    </svg>
                                    Continue Learning
                                </button>
                                <button
                                    onClick={() => handleOpenReader(true)}
                                    className="py-5 bg-slate-100 dark:bg-slate-800 rounded-3xl font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Start Fresh
                                </button>
                                <button
                                    onClick={() => setShowResumeModal(false)}
                                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Viewer Modal */}
            <AnimatePresence>
                {isViewing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120]"
                    >
                        <PDFViewer
                            url={viewerUrl}
                            userId={user!.$id}
                            contentId={content.$id}
                            initialPage={initialPage}
                            onClose={() => setIsViewing(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
