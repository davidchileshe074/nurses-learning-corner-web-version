'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';
import { noteServices } from '@/services/notes';
import { NoteEditor } from './NoteEditor';

// Define Error Boundary Component
class PDRErrorBoundary extends Component<{ children: ReactNode; fallback: (error: string) => ReactNode }, { hasError: boolean, errorMsg: string }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, errorMsg: error.message };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("PDFViewer Crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback(this.state.errorMsg);
        }
        return this.props.children;
    }
}

// Set worker for react-pdf using local file confirmed in public directory.
// This matches the react-pdf v10 version and prevents CORS issues on mobile.
const getWorkerSrc = () => {
    if (typeof window === 'undefined') return null;
    return '/pdf.worker.min.mjs'; // Use the .mjs version for modern browsers/iOS
};

interface PDFViewerProps {
    url: string | Blob;
    userId: string;
    contentId: string;
    initialPage?: number;
    onClose: () => void;
}

interface PDFViewerContentProps extends PDFViewerProps {
    useSimpleMode: boolean;
    setUseSimpleMode: (value: boolean) => void;
    resolvedUrl: string | null;
    numPages: number;
    setNumPages: (n: number) => void;
    pageNumber: number;
    setPageNumber: (val: number | ((prev: number) => number)) => void;
    loadError: string | null;
    setLoadError: (err: string | null) => void;
}

export function PDFViewer(props: PDFViewerProps) {
    const [useSimpleMode, setUseSimpleMode] = useState(false);
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(props.initialPage || 1);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Resolve URL exactly once per 'url' prop change
    useEffect(() => {
        let isMounted = true;
        let objectUrl: string | null = null;

        const resolve = async () => {
            if (!props.url) return;
            try {
                if (props.url instanceof Blob) {
                    objectUrl = URL.createObjectURL(props.url);
                    if (isMounted) setResolvedUrl(objectUrl);
                } else {
                    if (isMounted) setResolvedUrl(props.url as string);
                }
            } catch (err) {
                console.error("URL resolution error:", err);
                if (isMounted) setLoadError("Failed to initialize document source.");
            }
        };

        resolve();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [props.url]);

    return (
        <PDRErrorBoundary
            key={useSimpleMode ? 'simple' : 'standard'}
            fallback={(error) => (
                <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Viewer Error</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mb-2">
                        The document viewer encountered an unexpected issue on your device.
                    </p>
                    <p className="text-red-500/50 text-[10px] font-mono mb-6 max-w-xs break-words">
                        Error Detail: {error}
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                        <button
                            onClick={() => {
                                setUseSimpleMode(true);
                            }}
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
                        >
                            Use Simple Mode (iOS Safe)
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-3 bg-[#2B669A]/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-[10px] uppercase tracking-wide hover:bg-[#2B669A]/30 transition-all"
                            >
                                Reload App
                            </button>
                            <button
                                onClick={props.onClose}
                                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wide hover:bg-slate-700 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}>
            <PDFViewerContent
                {...props}
                useSimpleMode={useSimpleMode}
                setUseSimpleMode={setUseSimpleMode}
                resolvedUrl={resolvedUrl}
                numPages={numPages}
                setNumPages={setNumPages}
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                loadError={loadError}
                setLoadError={setLoadError}
            />
        </PDRErrorBoundary>
    );
}

function PDFViewerContent({
    url,
    userId,
    contentId,
    initialPage = 1,
    onClose,
    useSimpleMode,
    setUseSimpleMode,
    resolvedUrl,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    loadError,
    setLoadError
}: PDFViewerContentProps) {
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const [loadAttempts, setLoadAttempts] = useState(0);

    // iOS Detection
    const isIOS = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }, []);

    const [readyToRender, setReadyToRender] = useState(false);

    // Synchronous worker assignment for immediate availability
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        const src = getWorkerSrc();
        if (src) pdfjs.GlobalWorkerOptions.workerSrc = src;
    }

    // Handle Readiness & Worker assignment
    useEffect(() => {
        let isMounted = true;

        if (loadAttempts > 0) {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.64/pdf.worker.min.mjs`;
        }

        if (resolvedUrl) {
            // No intentional delay for simple mode; small delay for standard mode to stabilize mem
            const delay = useSimpleMode ? 0 : (isIOS ? 500 : 200);
            const timer = setTimeout(() => {
                if (isMounted) setReadyToRender(true);
            }, delay);
            return () => {
                isMounted = false;
                clearTimeout(timer);
            };
        }
    }, [resolvedUrl, loadAttempts, isIOS, useSimpleMode]);

    // Robust metadata fetch for Simple Mode
    // This is required because if numPages is 0, the 'Next' buttons stay disabled
    useEffect(() => {
        if (useSimpleMode && resolvedUrl && numPages === 0) {
            let isMounted = true;
            const getMeta = async () => {
                try {
                    // Use a clean loading task to avoid worker initialization issues
                    const loadingTask = pdfjs.getDocument({
                        url: resolvedUrl,
                        // Avoid using worker for a simple metadata fetch if possible to prevent crashes
                        stopAtErrors: false
                    });
                    const pdf = await loadingTask.promise;
                    if (isMounted && pdf.numPages > 0) {
                        setNumPages(pdf.numPages);
                    }
                } catch (e) {
                    console.warn('Silent metadata fetch failed:', e);
                    // Last resort: If we can't get the page count, we'll set a high number
                    // so the user can at least keep clicking 'Next' in simple mode
                    if (isMounted && numPages === 0) setNumPages(999);
                }
            };
            getMeta();
            return () => { isMounted = false; };
        }
    }, [useSimpleMode, resolvedUrl, numPages, setNumPages]);

    // Simplified Mobile Detection that responds to window availability
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setIsSmallScreen(window.innerWidth < 768);
        const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileUI = isSmallScreen;

    // Optimized DPR for mobile to prevent memory crashes on iOS
    const dpr = useMemo(() => {
        if (typeof window === 'undefined') return 1;
        if (isIOS) return 1.0; // Force 1.0 on iOS for stability

        // Reduced to 1.0 on very small screens for maximum stability
        const isSmallMobile = window.innerWidth < 480;
        const isMobile = window.innerWidth < 768;
        if (isSmallMobile) return 1.0;
        return isMobile ? 1.2 : Math.min(window.devicePixelRatio || 1, 2);
    }, [isIOS]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('PDF loaded successfully:', numPages, 'pages');
        setNumPages(numPages);
        setIsLoading(false);
        setLoadError(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error('PDF Viewer Error:', error);

        // If it failed and we haven't retried with CDN worker yet, try that
        if (loadAttempts === 0 && (error.message.includes('Worker') || error.message.includes('setting up'))) {
            console.warn('Local worker failed, retrying with CDN worker...');
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.64/pdf.worker.min.mjs`;
            setLoadAttempts(1);
            return;
        }

        setIsLoading(false);
        // More descriptive error for iOS users
        if (isIOS) {
            setLoadError('iOS Memory Limit: The document may be too large to render in-app.');
        } else if (error.message.includes('Worker')) {
            setLoadError('Educational engine initialization failed. Please check your internet connection and try again.');
        } else {
            setLoadError('Unable to render clinical document. The file might be corrupted or too large for this device.');
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

    const options = useMemo(() => ({
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/standard_fonts/',
        enableXfa: false,
        isEvalSupported: false,
        // iOS Fixes: Disable range requests and streaming to prevent hangs on some Safari versions
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true, // Prevent background fetching too many pages at once
    }), []);


    return (
        <div
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden"
            style={{ height: '100dvh', overscrollBehavior: 'none' }}
        >
            {/* Top Bar */}
            <div className={`h-14 sm:h-16 px-4 sm:px-6 bg-slate-900/50 backdrop-blur-lg border-b border-white/5 flex items-center justify-between shrink-0 safe-top ${isIOS ? 'pt-2' : ''}`}>
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

                    <div className="flex items-center bg-slate-800 rounded-xl overflow-hidden">
                        <button onClick={() => setScale(Math.max(0.5, scale - 0.2))} className="p-2 text-slate-400 hover:bg-slate-700 transition-colors border-r border-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <span className="px-3 text-[10px] font-black text-white">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(Math.min(2.5, scale + 0.2))} className="p-2 text-slate-400 hover:bg-slate-700 transition-colors border-l border-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <button
                        onClick={() => setUseSimpleMode(!useSimpleMode)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 transition-all ${useSimpleMode
                            ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                            : 'border-slate-800 text-slate-400 hover:border-amber-500 hover:text-amber-400'
                            }`}
                        title={useSimpleMode ? "Back to Advanced Viewer" : "Switch to iOS Safe Mode"}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{useSimpleMode ? 'Standard Mode' : 'Safe Mode'}</span>
                    </button>

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
                <div className={`flex-1 overflow-auto bg-slate-950 p-0 sm:p-8 flex flex-col items-center justify-start custom-scrollbar transition-all duration-500 ${showNotes ? 'lg:mr-96 xl:mr-[500px]' : ''}`}>
                    {loadError ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-6">
                            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="max-w-xs">
                                <p className="text-red-400 font-bold text-sm">{loadError}</p>
                                <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">Large clinical documents may exceed your device's available memory.</p>
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
                    ) : (!resolvedUrl || !readyToRender) ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-6">
                            <div className="w-12 h-12 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Initializing Reader Engine...</p>
                        </div>
                    ) : (useSimpleMode && resolvedUrl) ? (
                        <div className="flex-1 w-full bg-slate-950 flex flex-col items-center justify-start relative overflow-hidden">
                            <div
                                className="w-full h-full bg-slate-900 relative shadow-2xl flex flex-col items-center"
                                style={{
                                    height: '100%',
                                    minHeight: '100%',
                                    maxWidth: isMobileUI ? '100%' : '800px',
                                    transform: `scale(${isMobileUI ? scale * 1.1 : scale})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}
                            >
                                {/* Safari/iOS Fixes: width-1/min-100 prevents Safari from expanding the iframe to full PDF height */}
                                <iframe
                                    key={`${resolvedUrl}-${pageNumber}`}
                                    // #view=FitH forces the PDF to fit the width of the container
                                    src={`${resolvedUrl}#page=${pageNumber}&view=FitH,0&scrollbar=0&toolbar=0`}
                                    className="w-full h-full border-none"
                                    title="Safe PDF Viewer"
                                    style={{
                                        display: 'block',
                                        height: '100%',
                                        width: '1px',
                                        minWidth: '100%',
                                        border: 'none',
                                        WebkitOverflowScrolling: 'touch'
                                    }}
                                    // @ts-ignore
                                    scrolling="no"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    ) : (
                        <Document
                            file={resolvedUrl}
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
                                    // High-memory layers disabled on mobile/iOS for stability
                                    renderAnnotationLayer={!isMobileUI && !isIOS}
                                    renderTextLayer={!isMobileUI && !isIOS}
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
                        {isIOS && <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest mt-0.5">iOS Optimized Mode</span>}
                        {!isIOS && isMobileUI && <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Mobile Safe Mode</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
