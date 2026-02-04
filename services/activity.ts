import { databases, config } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

export type ActivityType = 'pdf' | 'flashcard' | 'note';

export interface RecentActivity {
    $id: string;
    userId: string;
    contentId: string;
    type: ActivityType;
    title: string;
    subject: string;
    timestamp: string;
}

export const activityServices = {
    async logActivity(userId: string, activity: Omit<RecentActivity, '$id' | 'userId' | 'timestamp'>) {
        try {
            // Check if activity for this contentId already exists to update it instead of creating new
            const existing = await databases.listDocuments(
                config.databaseId,
                config.recentActivityCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('contentId', activity.contentId)
                ]
            );

            if (existing.documents.length > 0) {
                return await databases.updateDocument(
                    config.databaseId,
                    config.recentActivityCollectionId,
                    existing.documents[0].$id,
                    {
                        timestamp: new Date().toISOString()
                    }
                );
            }

            return await databases.createDocument(
                config.databaseId,
                config.recentActivityCollectionId,
                ID.unique(),
                {
                    ...activity,
                    userId,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    async getRecentActivity(userId: string, limit = 5) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.recentActivityCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('timestamp'),
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as RecentActivity[];
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }
};
