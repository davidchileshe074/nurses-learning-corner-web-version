"use client";

import { useEffect, useState } from 'react';
import { downloadServices } from '@/services/download';
import { Content } from '@/types';
import { storage, config } from '@/lib/appwrite';

interface PreloadOptions {
    enabled?: boolean;
    maxItems?: number;
    priority?: 'high' | 'low';
}

/**
 * Hook to preload content for faster access
 * Automatically caches frequently accessed or recent content
 */
export function useContentPreload(
    contents: Content[],
    options: PreloadOptions = {}
) {
    const { enabled = true, maxItems = 3, priority = 'low' } = options;
    const [preloadedIds, setPreloadedIds] = useState<Set<string>>(new Set());
    const [isPreloading, setIsPreloading] = useState(false);

    useEffect(() => {
        if (!enabled || contents.length === 0) return;

        const preloadContent = async () => {
            setIsPreloading(true);
            const itemsToPreload = contents.slice(0, maxItems);
            const newPreloadedIds = new Set(preloadedIds);

            for (const content of itemsToPreload) {
                // Skip if already preloaded
                if (preloadedIds.has(content.$id)) continue;

                // Skip if already cached
                const isCached = await downloadServices.getIsDownloaded(content.$id);
                if (isCached) {
                    newPreloadedIds.add(content.$id);
                    continue;
                }

                try {
                    const fileId = content.fileId || (content as any).storageFileId;
                    if (!fileId) continue;

                    const fileUrl = storage.getFileDownload(config.bucketId, fileId);

                    // Use requestIdleCallback for low priority preloading
                    if (priority === 'low' && 'requestIdleCallback' in window) {
                        (window as any).requestIdleCallback(async () => {
                            await downloadServices.preloadContent(content, fileUrl.toString());
                            newPreloadedIds.add(content.$id);
                            setPreloadedIds(new Set(newPreloadedIds));
                        });
                    } else {
                        await downloadServices.preloadContent(content, fileUrl.toString());
                        newPreloadedIds.add(content.$id);
                    }
                } catch (error) {
                    console.error(`Failed to preload ${content.title}:`, error);
                }
            }

            setPreloadedIds(newPreloadedIds);
            setIsPreloading(false);
        };

        // Delay preloading to not interfere with initial page load
        const timer = setTimeout(preloadContent, 2000);
        return () => clearTimeout(timer);
    }, [contents, enabled, maxItems, priority]);

    return {
        preloadedIds,
        isPreloading,
        preloadedCount: preloadedIds.size
    };
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
    const [stats, setStats] = useState({ count: 0, totalSize: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            const cacheStats = await downloadServices.getCacheStats();
            setStats(cacheStats);
            setIsLoading(false);
        };

        loadStats();
    }, []);

    const refresh = async () => {
        const cacheStats = await downloadServices.getCacheStats();
        setStats(cacheStats);
    };

    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return {
        count: stats.count,
        totalSize: stats.totalSize,
        formattedSize: formatSize(stats.totalSize),
        isLoading,
        refresh
    };
}

/**
 * Hook to track reading progress across sessions
 */
export function useReadingProgress(contentId: string) {
    const [progress, setProgress] = useState(0);
    const [lastAccessed, setLastAccessed] = useState<string | null>(null);

    useEffect(() => {
        const loadProgress = async () => {
            const savedProgress = await downloadServices.getReadingProgress(contentId);
            const accessTime = await downloadServices.getLastAccessedTime(contentId);
            setProgress(savedProgress);
            setLastAccessed(accessTime);
        };

        loadProgress();
    }, [contentId]);

    const updateProgress = async (page: number) => {
        await downloadServices.saveReadingProgress(contentId, page);
        setProgress(page);
        setLastAccessed(new Date().toISOString());
    };

    return {
        progress,
        lastAccessed,
        updateProgress,
        hasProgress: progress > 0
    };
}
