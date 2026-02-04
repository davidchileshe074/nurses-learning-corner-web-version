import { db } from '@/lib/db';
import { noteServices } from './notes';
import { flashcardServices } from './flashcards';
import { activityServices } from './activity';

export type SyncAction = {
    type: 'note_upsert' | 'flashcard_mastery' | 'activity_log';
    payload: any;
    timestamp: number;
};

export const syncServices = {
    async enqueue(type: SyncAction['type'], payload: any) {
        await db.syncQueue.add({
            type,
            payload,
            timestamp: Date.now()
        });

        // Try to trigger background sync if supported, otherwise try immediate sync
        if (typeof window !== 'undefined' && navigator.onLine) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (typeof window !== 'undefined' && !navigator.onLine) return;

        const queue = await db.syncQueue.orderBy('timestamp').toArray();
        if (queue.length === 0) return;

        console.log(`Processing ${queue.length} queued sync actions...`);

        for (const action of queue) {
            try {
                switch (action.type) {
                    case 'note_upsert':
                        await noteServices.upsertNote(action.payload);
                        break;
                    case 'flashcard_mastery':
                        await flashcardServices.updateMasteryStatus(action.payload.cardId, action.payload.mastered);
                        break;
                    case 'activity_log':
                        await activityServices.logActivity(action.payload.userId, action.payload.activity);
                        break;
                }
                // If successful, remove from queue
                await db.syncQueue.delete(action.id!);
            } catch (error) {
                console.error(`Failed to process sync action ${action.id}:`, error);
                // Keep in queue for next try
            }
        }
    }
};

// Initial sync attempt if online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => syncServices.processQueue());
}
