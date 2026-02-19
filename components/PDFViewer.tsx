'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { downloadServices } from '@/services/download';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use legacy worker for better iOS/Safari compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string | Blob;
  onClose: () => void;
  userId?: string;
  contentId?: string;
  initialPage?: number;
}

export function PDFViewer({ url, onClose, userId, contentId, initialPage }: PDFViewerProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile + iOS detection
  const { isMobile, isIOS } = useMemo(() => {
    if (typeof window === 'undefined') return { isMobile: false, isIOS: false };
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return {
      isMobile: ios || window.innerWidth < 640,
      isIOS: ios
    };
  }, []);

  // Dynamic safe page width to avoid iOS canvas pixel limit (~16.7M pixels)
  const containerRef = useRef<HTMLDivElement>(null);
  const [safePageWidth, setSafePageWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;

      let w = containerRef.current.clientWidth * (isIOS ? 0.88 : 0.94);

      // Cap width aggressively on iOS to stay safely under canvas limit
      // ~900px at DPR=3 → ~900 × 1273 ≈ 1.1M pixels (well below 16.7M)
      const maxSafeWidth = isIOS ? 900 : w;
      w = Math.min(w, maxSafeWidth);

      setSafePageWidth(w);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    const timer = setTimeout(updateWidth, 300); // initial debounce
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, [isIOS]);

  // Set initial scale lower on iOS to help fit
  useEffect(() => {
    if (isIOS) {
      setScale(0.8);
    }
  }, [isIOS]);

  useEffect(() => {
    let active = true;

    const resolveUrl = async () => {
      setIsLoading(true);
      setError(null);

      if (url instanceof Blob) {
        const obj = URL.createObjectURL(url);
        if (active) {
          setResolvedUrl(obj);
        }
        return () => URL.revokeObjectURL(obj);
      } else if (typeof url === 'string') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

          const contentType = response.headers.get('Content-Type');
          if (contentType && !contentType.toLowerCase().includes('pdf') && !contentType.toLowerCase().includes('application/octet-stream')) {
            throw new Error('Fetched content is not a valid PDF file');
          }

          const blob = await response.blob();

          if (active) {
            const obj = URL.createObjectURL(blob);
            setResolvedUrl(obj);
          }
        } catch (fetchError) {
          console.warn('Blob fetch failed, falling back to direct URL:', fetchError);
          if (active) {
            setResolvedUrl(url);
          }
        }
      }
    };

    resolveUrl();

    return () => { active = false; };
  }, [url]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (resolvedUrl && (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('webkit-blob:'))) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [resolvedUrl]);

  useEffect(() => {
    if (contentId && pageNumber > 0) {
      downloadServices.saveReadingProgress(contentId, pageNumber);
    }
  }, [contentId, pageNumber]);

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onLoadError = (err: Error) => {
    console.error('PDF Load Error:', err);
    setError(err.message || 'Failed to load PDF document.');
    setIsLoading(false);
  };

  // Swipe Logic
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (delta > swipeThreshold && pageNumber < numPages) {
      setPageNumber(p => p + 1);
    } else if (delta < -swipeThreshold && pageNumber > 1) {
      setPageNumber(p => p - 1);
    }
  };

  // Error Boundary
  class PDFErrorBoundary extends React.Component<{ children: React.ReactNode, onError: (error: Error) => void }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode, onError: (error: Error) => void }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error("PDF Render Crash:", error, errorInfo);
      this.props.onError(error);
    }

    render() {
      if (this.state.hasError) {
        return null;
      }
      return this.props.children;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-white/10 px-4 flex items-center justify-between shadow-sm z-50">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500/20 hover:text-red-500 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          {isMobile && numPages > 0 && (
            <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 gap-2">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                className="text-white hover:text-blue-400 disabled:opacity-30 p-1"
                disabled={pageNumber <= 1}
              >
                ◀
              </button>

              <span className="text-xs text-white font-mono font-bold min-w-[3rem] text-center">
                {pageNumber} / {numPages}
              </span>

              <button
                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                className="text-white hover:text-blue-400 disabled:opacity-30 p-1"
                disabled={pageNumber >= numPages}
              >
                ▶
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="px-3 py-1.5 text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"
            >
              −
            </button>
            <div className="bg-slate-950/30 h-full w-[1px]"></div>
            <span className="px-2 text-xs text-white font-mono min-w-[3.5ch] text-center">
              {Math.round(scale * 100)}%
            </span>
            <div className="bg-slate-950/30 h-full w-[1px]"></div>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="px-3 py-1.5 text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* PDF Area */}
      <div
        className={`flex-1 w-full relative bg-slate-900/95 ${isIOS ? 'overflow-y-auto' : 'overflow-hidden'}`}
        style={isIOS ? { WebkitOverflowScrolling: 'touch' } : undefined}
        onTouchStart={!isIOS ? onTouchStart : undefined}
        onTouchMove={!isIOS ? onTouchMove : undefined}
        onTouchEnd={!isIOS ? onTouchEnd : undefined}
      >
        <div
          className="absolute inset-0 overflow-auto flex flex-col items-center py-8 px-4 touch-pan-y overscroll-contain"
          ref={containerRef}
        >
          {error ? (
            <div className="my-auto flex flex-col items-center justify-center bg-slate-900 p-8 rounded-2xl border border-white/10 max-w-sm text-center shadow-xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 text-2xl">
                ⚠️
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Unable to load document</h3>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              {isIOS && (
                <p className="text-xs text-slate-500 mb-4 bg-slate-800 p-2 rounded">
                  Tip: If this document fails to load, it might be password protected or corrupted.
                </p>
              )}
              <button
                onClick={() => onClose()}
                className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/80 backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Document...</p>
                </div>
              )}

              {resolvedUrl && safePageWidth !== undefined && (
                <PDFErrorBoundary onError={(err) => setError(err.message || 'Rendering failed')}>
                  <Document
                    file={resolvedUrl}
                    onLoadSuccess={onLoadSuccess}
                    onLoadError={onLoadError}
                    loading={null}
                    className="flex flex-col items-center"
                    error={null}
                  >
                    {isMobile ? (
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        renderMode={isIOS ? 'svg' : 'canvas'} // SVG often helps on iOS
                        className="shadow-2xl rounded-sm overflow-hidden bg-white touch-pan-y"
                        width={safePageWidth}
                      />
                    ) : (
                      Array.from(new Array(numPages), (_, index) => (
                        <Page
                          key={index}
                          pageNumber={index + 1}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-2xl mb-8 rounded-sm overflow-hidden bg-white"
                        />
                      ))
                    )}
                  </Document>
                </PDFErrorBoundary>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}