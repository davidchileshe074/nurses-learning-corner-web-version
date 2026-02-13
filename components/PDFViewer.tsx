'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';
import { noteServices } from '@/services/notes';
import { NoteEditor } from './NoteEditor';

// Set worker for react-pdf using CDN for stability
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string | Blob;
    userId: string;
    contentId: string;
    initialPage?: number;
    onClose: () => void;
}

export function PDFViewer({ url, userId, contentId, initialPage = 1, onClose }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [fileData, setFileData] = useState<any>(null);

    // Optimized DPR for mobile to prevent memory crashes on iOS
    const dpr = useMemo(() => {
        if (typeof window === 'undefined') return 1;
        // Reduced to 1.2 max for better memory performance on iOS devices (Retina is usually 2 or 3, but 1.2 is enough for legibility)
        const isMobile = window.innerWidth < 768;
        return isMobile ? 1.2 : Math.min(window.devicePixelRatio || 1, 2);
    }, []);

    const isMobileUI = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

    // Manual fetch to bypass potential pdf.js networking quirks on iOS Safari/Capacitor
    useEffect(() => {
        const loadFile = async () => {
            if (!url) return;

            // If it's a blob URL or a remote URL, fetch it manually to ensure session/CORS/iOS binary compliance
            if (typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('http'))) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    setFileData({ data: arrayBuffer });
                } catch (error) {
                    console.error('Fetch error in PDFViewer:', error);
                    // Fallback to direct URL if fetch fails
                    setFileData(url);
                }
            } else if (url instanceof Blob) {
                // Handle raw Blob objects directly
                try {
                    const arrayBuffer = await url.arrayBuffer();
                    setFileData({ data: arrayBuffer });
                } catch (e) {
                    setFileData(url);
                }
            } else {
                setFileData(url);
            }
        };
        loadFile();

        return () => {
            // Clean up file data to release memory
            setFileData(null);
        };
    }, [url]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('PDF loaded successfully:', numPages, 'pages');
        setNumPages(numPages);
        setIsLoading(false);
        setLoadError(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error('PDF Viewer Error:', error);
        setIsLoading(false);
        // More descriptive error for users
        if (error.message.includes('Worker')) {
            setLoadError('Educational engine initialization failed. Please refresh.');
        } else {
            setLoadError('Unable to render clinical document. The file might be corrupted or too large.');
        }
    }

    const saveProgress = useCallback(async (pageNum: number) => {
        try {
            const { downloadServices } = await import('@/services/download');
            await downloadServices.saveReadingProgress(contentId, pageNum);
        } catch (error) {
            console.error('Failed to save reading progress:', error);
        }
    }, [contentId]);

    // Debounced progress saving
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pageNumber > 0) saveProgress(pageNumber);
        }, 2000);
        return () => clearTimeout(timer);
    }, [pageNumber, saveProgress]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && pageNumber > 1) {
                setPageNumber(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && pageNumber < numPages) {
                setPageNumber(prev => prev + 1);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [pageNumber, numPages, onClose]);

    const version = pdfjs.version;

    // Set worker source
    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
    }, [version]);

    const options = useMemo(() => ({
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/standard_fonts/`,
        enableXfa: false,
        isEvalSupported: false,
        // iOS Fixes: Disable range requests and streaming to prevent hangs on some Safari versions
        disableRange: true,
        disableStream: true,
    }), [version]);

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden"
            style={{ height: '100dvh', overscrollBehavior: 'none' }}
        >
            {/* Top Bar */}
            <div className="h-14 sm:h-16 px-4 sm:px-6 bg-slate-900/50 backdrop-blur-lg border-b border-white/5 flex items-center justify-between shrink-0 safe-top">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Close (Esc)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <span className="text-sm font-bold text-slate-100 truncate max-w-[150px] sm:max-w-[200px] hidden xs:block">Study Material</span>
                </div>

                <div className="flex items-center gap-3 md:gap-8">
                    <div className="flex items-center bg-slate-800 rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-4">
                        <button
                            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-1"
                            disabled={pageNumber <= 1}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest min-w-[40px] sm:min-w-[60px] text-center">
                            {pageNumber} / {numPages || '...'}
                        </span>
                        <button
                            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-1"
                            disabled={pageNumber >= numPages || numPages === 0}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="hidden md:flex items-center bg-slate-800 rounded-xl overflow-hidden">
                        <button onClick={() => setScale(Math.max(0.5, scale - 0.2))} className="p-2 text-slate-400 hover:bg-slate-700 transition-colors border-r border-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <span className="px-3 text-[10px] font-black text-white">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(Math.min(2.5, scale + 0.2))} className="p-2 text-slate-400 hover:bg-slate-700 transition-colors border-l border-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 transition-all ${showNotes
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                            : 'border-slate-800 text-slate-400 hover:border-purple-500 hover:text-purple-400'
                            }`}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Notes</span>
                    </button>
                </div>
            </div>

            {/* Main Layout (Split) */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* PDF Area */}
                <div className={`flex-1 overflow-auto bg-slate-950 p-0 sm:p-8 flex flex-col items-center custom-scrollbar transition-all duration-500 ${showNotes ? 'lg:mr-96 xl:mr-[500px]' : ''}`}>
                    {(!fileData && isLoading) ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-6">
                            <div className="w-12 h-12 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Downloading Secure Document...</p>
                        </div>
                    ) : loadError ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-6">
                            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="max-w-xs">
                                <p className="text-red-400 font-bold text-sm">{loadError}</p>
                                <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">Large clinical documents may exceed your device's available memory. Try Safe Mode for better stability.</p>
                            </div>

                            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-500 transition-colors"
                                >
                                    Reload Reader
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-4 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Document
                            file={fileData || url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-6">
                                    <div className="w-12 h-12 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Preparing Scientific Assets...</p>
                                </div>
                            }
                            options={options}
                            className="flex-1 flex flex-col items-center w-full"
                        >
                            <div className="flex-1 flex items-center justify-center w-full min-h-full py-12 scroll-mt-20">
                                <Page
                                    pageNumber={pageNumber}
                                    scale={isMobileUI ? (showNotes ? scale * 0.6 : scale * 0.9) : (showNotes ? scale * 0.7 : scale)}
                                    devicePixelRatio={dpr}
                                    width={typeof window !== 'undefined' ? (window.innerWidth < 640 ? window.innerWidth : Math.min(window.innerWidth * 0.85, 1200)) : undefined}
                                    // High-memory layers disabled on mobile for stability
                                    renderAnnotationLayer={!isMobileUI}
                                    renderTextLayer={!isMobileUI}
                                    renderMode="canvas"
                                    className="overflow-hidden !bg-slate-900 shadow-2xl shadow-black/80"
                                    loading={
                                        <div className="flex items-center justify-center min-h-[600px] w-full bg-slate-900/50 rounded-2xl">
                                            <div className="w-8 h-8 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    }
                                />
                            </div>
                        </Document>
                    )}
                </div>

                {/* Note Sidebar */}
                <AnimatePresence>
                    {showNotes && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-16 right-0 w-full lg:relative lg:inset-0 lg:w-96 xl:w-[500px] z-40 bg-slate-950 p-4"
                        >
                            <NoteEditor
                                userId={userId}
                                contentId={contentId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sync Status Badge */}
            <div className={`absolute bottom-8 left-8 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-100 uppercase tracking-tighter">Page {pageNumber} Synced</span>
                        {isMobileUI && <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Mobile Safe Mode Active</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
