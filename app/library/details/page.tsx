'use client';

import { useState, useEffect, use } from 'react';
import { contentServices } from '@/services/content';
import { Content } from '@/types';
import { storage, config } from '@/lib/appwrite';
import { db } from '@/lib/db';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, BookOpen, CheckCircle, Clock, Calendar } from 'lucide-react';

const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), {
    loading: () => (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Reader Engine...</p>
        </div>
    ),
    ssr: false
});
import { noteServices } from '@/services/notes';
import { subscriptionServices } from '@/services/subscription';
import { useRouter } from 'next/navigation';
import { activityServices } from '@/services/activity';
import { addToRecent } from '@/services/recentStudy';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ContentDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
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
        if (!id) {
            // If No ID is present after hydration, we shouldn't show a spinner forever
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }

        const loadPageData = async () => {
            setIsLoading(true);
            try {
                // 1. Try to get from Cache first (for offline support)
                const cached = await db.cachedContent.get(id);

                if (cached) {
                    setContent(cached);
                    setIsDownloaded(true);
                } else {
                    // 2. Fetch from Appwrite if not in cache
                    const data = await contentServices.getContentById(id);
                    setContent(data);

                    // Also check if already downloaded by $id
                    const isAlreadyDownloaded = await db.cachedContent.get(id);
                    setIsDownloaded(!!isAlreadyDownloaded);
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

        // Subscription Check (Bypassed if offline and content is downloaded)
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const cached = await db.cachedContent.get(content.$id);

        if (!isOffline) {
            const sub = await subscriptionServices.getSubscriptionStatus(user.$id);
            const isActive = subscriptionServices.checkSubscriptionExpiry(sub);

            if (!isActive && !cached) {
                alert('An active subscription is required to access premium clinical resources.');
                router.push('/profile');
                return;
            }
        } else if (!cached) {
            alert('This resource is not available offline. Please connect to the internet to access it.');
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

        // Track in recent study (Local Storage)
        addToRecent(content).catch(err => console.error('Failed to add to recent:', err));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F3F5F7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen bg-[#F3F5F7] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Resource Not Found</h1>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-[#2B669A] text-white rounded-xl font-bold text-sm hover:bg-[#234f7a] transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F5F7] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2B669A] uppercase tracking-wide truncate">
                            {content.subject}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    {/* Hero Section */}
                    <div className="relative bg-gradient-to-br from-[#2B669A] to-[#1e4a6f] p-8 md:p-12">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

                        <div className="relative z-10">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] font-bold uppercase tracking-wide border border-white/30">
                                    {content.program}
                                </span>
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] font-bold uppercase tracking-wide border border-white/30">
                                    {content.type}
                                </span>
                                {isDownloaded && (
                                    <span className="px-3 py-1 bg-green-500/20 backdrop-blur-sm text-green-100 rounded-full text-[10px] font-bold uppercase tracking-wide border border-green-400/30 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                                        Available Offline
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                {content.title}
                            </h1>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{new Date(content.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-8 md:p-12">
                        <p className="text-slate-600 text-base leading-relaxed mb-8">
                            {content.description || 'No detailed description available for this resource. This clinical material is designed to support healthcare professionals in their educational journey.'}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleOpenReader()}
                                className="flex-1 py-4 bg-[#2B669A] hover:bg-[#234f7a] text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-[#2B669A]/20 transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={20} />
                                Open Material
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={isDownloaded || isDownloading}
                                className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wide border-2 transition-all flex items-center justify-center gap-2 ${isDownloaded
                                    ? 'bg-green-50 border-green-200 text-green-600 cursor-default'
                                    : isDownloading
                                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-[#2B669A] hover:text-[#2B669A]'
                                    }`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Downloading...
                                    </>
                                ) : isDownloaded ? (
                                    <>
                                        <CheckCircle size={20} />
                                        Downloaded
                                    </>
                                ) : (
                                    <>
                                        <Download size={20} />
                                        Download
                                    </>
                                )}
                            </button>
                        </div>

                        {isDownloaded && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => router.push('/downloads')}
                                className="mt-4 w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-100 transition-all"
                            >
                                View in Downloads
                            </motion.button>
                        )}
                    </div>
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
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2B669A]">
                                <Clock size={32} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Resume Reading?</h3>
                            <p className="text-slate-500 text-sm mb-8">
                                You left off at page <span className="font-bold text-[#2B669A]">{savedPage}</span>
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleOpenReader(false)}
                                    className="py-4 bg-[#2B669A] rounded-xl font-bold text-sm uppercase tracking-wide text-white hover:bg-[#234f7a] transition-all"
                                >
                                    Continue Reading
                                </button>
                                <button
                                    onClick={() => handleOpenReader(true)}
                                    className="py-4 bg-slate-100 rounded-xl font-bold text-sm uppercase tracking-wide text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    Start from Beginning
                                </button>
                                <button
                                    onClick={() => setShowResumeModal(false)}
                                    className="mt-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
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
                            onClose={() => {
                                if (viewerUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(viewerUrl);
                                }
                                setIsViewing(false);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ContentDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F3F5F7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Reader...</p>
            </div>
        }>
            <ContentDetailsContent />
        </Suspense>
    );
}
