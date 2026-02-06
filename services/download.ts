import { db } from '@/lib/db';
import { Content } from '@/types';

export const downloadServices = {
    /**
     * Purges all locally cached clinical data if the security context (subscription) is invalidated.
     */
    async purgeAllDownloads() {
        try {
            await db.cachedContent.clear();
            console.log('[Security] Local clinical repository purged successfully.');
            return true;
        } catch (error) {
            console.error('[Security] Failed to purge local repository:', error);
            return false;
        }
    },

    /**
     * Checks if a specific content asset is already available in the offline vault.
     */
    async getIsDownloaded(contentId: string): Promise<boolean> {
        try {
            const item = await db.cachedContent.get(contentId);
            return !!item;
        } catch (error) {
            console.error('[Download] Status check failed:', error);
            return false;
        }
    },

    /**
     * Formats the playback position/page for persistence.
     */
    async saveReadingProgress(contentId: string, position: number) {
        try {
            // We use localStorage for light metadata like reading position
            localStorage.setItem(`pos_${contentId}`, position.toString());
            // Also save timestamp for last accessed
            localStorage.setItem(`time_${contentId}`, new Date().toISOString());
        } catch (error) {
            console.error('[Sync] Progress save failed:', error);
        }
    },

    /**
     * Retrieves the last valid educational pivot point for an asset.
     */
    async getReadingProgress(contentId: string): Promise<number> {
        try {
            const pos = localStorage.getItem(`pos_${contentId}`);
            return pos ? parseInt(pos, 10) : 0;
        } catch (error) {
            return 0;
        }
    },

    /**
     * Get the last accessed timestamp for a content item
     */
    async getLastAccessedTime(contentId: string): Promise<string | null> {
        try {
            return localStorage.getItem(`time_${contentId}`);
        } catch (error) {
            return null;
        }
    },

    /**
     * Preload content for faster access (download in background)
     */
    async preloadContent(content: Content, fileUrl: string): Promise<boolean> {
        try {
            // Check if already cached
            const existing = await db.cachedContent.get(content.$id);
            if (existing) {
                console.log('[Preload] Content already cached:', content.title);
                return true;
            }

            // Download in background
            const response = await fetch(fileUrl);
            const fileBlob = await response.blob();

            await db.cachedContent.put({
                ...content,
                blob: fileBlob,
                downloadedAt: new Date().toISOString()
            } as any);

            console.log('[Preload] Successfully cached:', content.title);
            return true;
        } catch (error) {
            console.error('[Preload] Failed:', error);
            return false;
        }
    },

    /**
     * Get all cached content items
     */
    async getAllCachedContent(): Promise<Content[]> {
        try {
            const cached = await db.cachedContent.toArray();
            return cached as unknown as Content[];
        } catch (error) {
            console.error('[Cache] Failed to retrieve cached content:', error);
            return [];
        }
    },

    /**
     * Clear specific content from cache
     */
    async removeCachedContent(contentId: string): Promise<boolean> {
        try {
            await db.cachedContent.delete(contentId);
            // Also clear progress
            localStorage.removeItem(`pos_${contentId}`);
            localStorage.removeItem(`time_${contentId}`);
            console.log('[Cache] Removed content:', contentId);
            return true;
        } catch (error) {
            console.error('[Cache] Failed to remove content:', error);
            return false;
        }
    },

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{ count: number; totalSize: number }> {
        try {
            const cached = await db.cachedContent.toArray();
            let totalSize = 0;

            for (const item of cached) {
                if (item.blob instanceof Blob) {
                    totalSize += item.blob.size;
                }
            }

            return {
                count: cached.length,
                totalSize: totalSize
            };
        } catch (error) {
            console.error('[Cache] Failed to get stats:', error);
            return { count: 0, totalSize: 0 };
        }
    }
};
