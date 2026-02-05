'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';
import { noteServices } from '@/services/notes';
import { NoteEditor } from './NoteEditor';

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
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

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setIsLoading(false);
    }

    function onDocumentLoadError(error: Error) {
        console.error('PDF Load Error:', error);
        setIsLoading(false);
    }

    const saveProgress = async (pageNum: number) => {
        try {
            const { downloadServices } = await import('@/services/download');
            await downloadServices.saveReadingProgress(contentId, pageNum);
        } catch (error) {
            console.error('Failed to save reading progress:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            saveProgress(pageNumber);
        }, 3000);
        return () => clearTimeout(timer);
    }, [pageNumber]);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            {/* Top Bar */}
            <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <span className="text-sm font-bold text-slate-100 truncate max-w-[200px] hidden sm:block">Medical Study Material</span>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center bg-slate-800 rounded-xl px-2 sm:px-4 py-2 gap-2 sm:gap-4">
                        <button
                            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                            disabled={pageNumber <= 1}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest min-w-[50px] sm:min-w-[60px] text-center">
                            {pageNumber} / {numPages || '...'}
                        </span>
                        <button
                            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                            className="text-slate-400 hover:text-white disabled:opacity-30"
                            disabled={pageNumber >= numPages}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${showNotes
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                            : 'border-slate-800 text-slate-400 hover:border-purple-500 hover:text-purple-400'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Notes</span>
                    </button>
                </div>
            </div>

            {/* Main Layout (Split) */}
            <div className="flex-1 flex overflow-hidden">
                {/* PDF Area */}
                <div className={`flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex flex-col items-center custom-scrollbar transition-all duration-500 ${showNotes ? 'lg:border-r lg:border-slate-800' : ''}`}>
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex flex-col items-center gap-4 mt-20 text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Preparing Scientific Assets...</p>
                            </div>
                        }
                        className="shadow-2xl shadow-black/80 flex flex-col items-center min-h-full"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={showNotes ? scale * 0.75 : scale}
                            width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 1200) : undefined}
                            renderAnnotationLayer={true}
                            renderTextLayer={true}
                            className="rounded-lg overflow-hidden !bg-slate-900"
                        />
                    </Document>
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
                <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Encrypted Cloud Sync Active</span>
                </div>
            </div>
        </div>
    );
}
