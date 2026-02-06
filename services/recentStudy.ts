
import { Content } from '@/types';

// Alias Content to ContentItem to match the user's expected type name from the snippet
export type ContentItem = Content;

const RECENT_STORAGE_KEY = 'recent_study_items';
const MAX_RECENT = 10;

export const addToRecent = async (item: ContentItem) => {
    try {
        const current = await getRecentItems();
        // Remove if already exists (to move to front)
        const filtered = current.filter(i => i.$id !== item.$id);
        const updated = [item, ...filtered].slice(0, MAX_RECENT);

        if (typeof window !== 'undefined') {
            localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
        }
    } catch (e) {
        console.error('[Recent] Add Error:', e);
    }
};

export const getRecentItems = async (): Promise<ContentItem[]> => {
    try {
        if (typeof window === 'undefined') return [];

        const content = localStorage.getItem(RECENT_STORAGE_KEY);
        if (!content) return [];

        return JSON.parse(content);
    } catch (e) {
        console.error('[Recent] Get Error:', e);
        return [];
    }
};
