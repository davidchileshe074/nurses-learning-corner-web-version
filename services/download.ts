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
            const count = await db.cachedContent.where('$id').equals(contentId).count();
            return count > 0;
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
    }
};
