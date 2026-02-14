'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { downloadServices } from '@/services/download';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.64/pdf.worker.min.mjs';

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

  // Mobile + iOS detection
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return isIOS || window.innerWidth < 640;
  }, []);

  useEffect(() => {
    if (url instanceof Blob) {
      const obj = URL.createObjectURL(url);
      setResolvedUrl(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setResolvedUrl(url);
    }
  }, [url]);

  useEffect(() => {
    if (contentId && pageNumber > 0) {
      downloadServices.saveReadingProgress(contentId, pageNumber);
    }
  }, [contentId, pageNumber]);

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // --- Swipe Logic ---
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

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 px-4 flex items-center justify-between">
        <button onClick={onClose} className="text-white text-lg">✕</button>

        <div className="flex items-center gap-4">
          {isMobile && (
            <>
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                className="text-white"
              >
                ◀
              </button>

              <span className="text-xs text-white font-bold">
                {pageNumber} / {numPages || '...'}
              </span>

              <button
                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                className="text-white"
              >
                ▶
              </button>
            </>
          )}

          <div className="flex items-center bg-slate-800 rounded">
            <button
              onClick={() => setScale(s => Math.max(0.7, s - 0.15))}
              className="px-3 py-1 text-white"
            >
              −
            </button>
            <span className="px-2 text-xs text-white">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.15))}
              className="px-3 py-1 text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* PDF Area */}
      <div
        className="flex-1 overflow-auto flex justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!resolvedUrl || isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Document
            file={resolvedUrl}
            onLoadSuccess={onLoadSuccess}
            className="flex flex-col items-center"
          >
            {isMobile ? (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-xl my-6"
              />
            ) : (
              Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={index}
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                  className="shadow-xl my-6"
                />
              ))
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
