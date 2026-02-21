'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { downloadServices } from '@/services/download';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set local worker (make sure pdf.worker.min.js is in your public/ folder)
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Set local worker (make sure pdf.worker.min.js is in your public/ folder)
// Note: ES2024 polyfills are now handled in @/lib/polyfills.ts
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  } catch (e) {
    console.error('Initial worker setup failed:', e);
  }
}

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
  const [workerReady, setWorkerReady] = useState(false);
  const [useNativeViewer, setUseNativeViewer] = useState(false);

  // Improved iOS + mobile detection
  const { isMobile, isIOS, iosVersion } = useMemo(() => {
    if (typeof window === 'undefined') return { isMobile: false, isIOS: false, iosVersion: 0 };

    const isStandardIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isModerniPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const ios = isStandardIOS || isModerniPad;

    let version = 0;
    if (ios) {
      // Improved regex for iOS version detection
      const match = navigator.userAgent.match(/(?:iPhone OS|iPad OS|OS) (\d+)_(\d+)/) ||
        navigator.userAgent.match(/Version\/(\d+)\.(\d+)/);
      if (match) {
        version = parseInt(match[1], 10) + parseInt(match[2], 10) / 100;
      } else if (isModerniPad) {
        // Modern iPad without version in UA usually means it's running desktop-class Safari (iPadOS)
        // Check for specific features to guestimate
        if ('ondevicemotion' in window) version = 17.0; // guestimate for iPadOS
        else version = 15; // fallback
      }
    }

    return {
      isMobile: ios || window.innerWidth < 1024,
      isIOS: ios,
      iosVersion: version,
    };
  }, []);

  // Worker setup + timeout for old iOS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        console.log('Worker src set to:', pdfjs.GlobalWorkerOptions.workerSrc);
        setWorkerReady(true);
      } catch (err) {
        console.error('Worker init failed:', err);
        setError('Failed to initialize PDF engine');
      }
    }

    const timeoutDuration = isIOS && iosVersion < 17.5 ? 9000 : 18000;

    const timer = setTimeout(() => {
      if (isLoading && !error && !useNativeViewer) {
        console.warn('PDF Loading Timeout reached. isIOS:', isIOS, 'version:', iosVersion);
        setError(
          isIOS && iosVersion < 17.5
            ? `iOS ${iosVersion.toFixed(1)} detected. This version has known issues with high-performance PDF rendering.`
            : 'The document is taking longer than expected to load.'
        );
        setIsLoading(false);
      }
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [isLoading, error, isIOS, iosVersion, useNativeViewer]);

  // Dynamic safe width — more conservative on older iOS
  const containerRef = useRef<HTMLDivElement>(null);
  const [safePageWidth, setSafePageWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;

      let w = containerRef.current.clientWidth * (isIOS ? 0.88 : 0.94);

      // Very conservative on iOS 17 and below
      const maxSafeWidth = isIOS ? (iosVersion <= 17 ? 750 : 900) : w;
      w = Math.min(w, maxSafeWidth);

      setSafePageWidth(w);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    const timer = setTimeout(updateWidth, 300);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, [isIOS, iosVersion]);

  // Lower initial scale on mobile (especially iOS) to save memory
  useEffect(() => {
    if (isMobile) setScale(isIOS ? 0.6 : 0.75);
  }, [isMobile, isIOS]);

  // URL resolution logic (unchanged)
  useEffect(() => {
    let active = true;

    const resolveUrl = async () => {
      setIsLoading(true);
      setError(null);

      if (url instanceof Blob) {
        const obj = URL.createObjectURL(url);
        if (active) setResolvedUrl(obj);
        return () => URL.revokeObjectURL(obj);
      } else if (typeof url === 'string') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

          const contentType = response.headers.get('Content-Type');
          if (
            contentType &&
            !contentType.toLowerCase().includes('pdf') &&
            !contentType.toLowerCase().includes('application/octet-stream')
          ) {
            throw new Error('Fetched content is not a valid PDF file');
          }

          const blob = await response.blob();
          if (active) {
            const obj = URL.createObjectURL(blob);
            setResolvedUrl(obj);
          }
        } catch (fetchError) {
          console.warn('Blob fetch failed, falling back to direct URL:', fetchError);
          if (active) setResolvedUrl(url);
        }
      }
    };

    resolveUrl();

    return () => {
      active = false;
    };
  }, [url]);

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

  // Swipe gestures (non-iOS mobile)
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
    const threshold = 50;
    if (delta > threshold && pageNumber < numPages) {
      setPageNumber((p) => p + 1);
    } else if (delta < -threshold && pageNumber > 1) {
      setPageNumber((p) => p - 1);
    }
  };

  // Error Boundary
  class PDFErrorBoundary extends React.Component<
    { children: React.ReactNode; onError: (error: Error) => void },
    { hasError: boolean }
  > {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      console.error('PDF Render Crash:', error, info);
      this.props.onError(error);
    }

    render() {
      return this.state.hasError ? null : this.props.children;
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
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="text-white hover:text-blue-400 disabled:opacity-30 p-1"
                disabled={pageNumber <= 1}
              >
                ◀
              </button>
              <span className="text-xs text-white font-mono font-bold min-w-[3rem] text-center">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                className="text-white hover:text-blue-400 disabled:opacity-30 p-1"
                disabled={pageNumber >= numPages}
              >
                ▶
              </button>
            </div>
          )}

          {!useNativeViewer && (
            <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
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
                onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                className="px-3 py-1.5 text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main PDF Area */}
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

              {isIOS && !useNativeViewer && (
                <p className="text-xs text-yellow-300 mb-4">
                  Your iOS version ({iosVersion.toFixed(1)}) has limited PDF support.
                </p>
              )}

              <div className="flex flex-col gap-3 w-full">
                {isIOS && !useNativeViewer && (
                  <button
                    onClick={() => {
                      setUseNativeViewer(true);
                      setError(null);
                      setIsLoading(false);
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors"
                  >
                    Try Native iOS Viewer
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/80 backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Loading Document...
                  </p>
                </div>
              )}

              {useNativeViewer && resolvedUrl ? (
                <div className="absolute inset-0 flex flex-col items-center bg-slate-950">
                  <iframe
                    src={`${resolvedUrl}#view=FitW&toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full flex-1 border-0 bg-white"
                    title="Native PDF Viewer"
                    style={{ height: 'calc(100% - 60px)' }}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl text-center z-10">
                    <p className="text-[10px] text-slate-400 mb-1">
                      {error ? `Rendering Error: ${error}` : 'Native iOS Viewer Active'}
                    </p>
                    <button
                      onClick={() => {
                        setUseNativeViewer(false);
                        setError(null);
                        setIsLoading(true);
                        setWorkerReady(false);
                        setTimeout(() => setWorkerReady(true), 100);
                      }}
                      className="text-[10px] text-blue-400 font-bold hover:underline"
                    >
                      Retry Standard Viewer
                    </button>
                  </div>
                </div>
              ) : (
                resolvedUrl &&
                workerReady &&
                safePageWidth !== undefined && (
                  <PDFErrorBoundary onError={(err) => setError(err.message || 'Rendering failed')}>
                    <Document
                      file={resolvedUrl}
                      onLoadSuccess={onLoadSuccess}
                      onLoadError={onLoadError}
                      loading={null}
                      options={{
                        cMapUrl: '/cmaps/',
                        cMapPacked: true,
                        standardFontDataUrl: '/standard_fonts/',
                      }}
                      className="flex flex-col items-center"
                      error={null}
                    >
                      {isMobile ? (
                        // Single page + navigation on all mobile devices for performance
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          renderMode="canvas"
                          className="shadow-2xl rounded-sm overflow-hidden bg-white touch-pan-y"
                          width={safePageWidth}
                          devicePixelRatio={isMobile ? Math.min(window.devicePixelRatio, 1.0) : window.devicePixelRatio}
                        />
                      ) : (
                        // Multi-page scroll on desktop only
                        Array.from(new Array(numPages), (_, index) => (
                          <Page
                            key={index}
                            pageNumber={index + 1}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            renderMode="canvas"
                            className="shadow-2xl mb-8 rounded-sm overflow-hidden bg-white"
                            width={safePageWidth}
                          />
                        ))
                      )}
                    </Document>
                  </PDFErrorBoundary>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}