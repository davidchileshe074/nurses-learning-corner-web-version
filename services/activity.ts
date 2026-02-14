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
    progress?: number; // Page number or progress percentage
    totalPages?: number; // Total pages for PDFs
    completed?: boolean; // Whether the user finished this content
}

export const activityServices = {
    async logActivity(
        userId: string,
        activity: Omit<RecentActivity, '$id' | 'userId' | 'timestamp'>,
        progressData?: { currentPage?: number; totalPages?: number; completed?: boolean }
    ) {
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

            const activityData = {
                ...activity,
                timestamp: new Date().toISOString(),
                ...(progressData && {
                    progress: progressData.currentPage,
                    totalPages: progressData.totalPages,
                    completed: progressData.completed
                })
            };

            if (existing.documents.length > 0) {
                return await databases.updateDocument(
                    config.databaseId,
                    config.recentActivityCollectionId,
                    existing.documents[0].$id,
                    activityData
                );
            }

            return await databases.createDocument(
                config.databaseId,
                config.recentActivityCollectionId,
                ID.unique(),
                {
                    ...activityData,
                    userId
                }
            );
        } catch (error: any) {
            if (error.code === 404) {
                // Collection doesn't exist yet - silently skip logging
                // console.warn('Recent activity collection not found, skipping log.');
                return;
            }
            console.error('Error logging activity:', error);
        }
    },

    async getRecentActivity(userId: string, limit = 10) {
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
        } catch (error: any) {
            if (error.code !== 404) {
                console.error('Error fetching recent activity:', error);
            }
            return [];
        }
    },

    async getActivityProgress(userId: string, contentId: string): Promise<RecentActivity | null> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.recentActivityCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('contentId', contentId),
                    Query.limit(1)
                ]
            );

            if (response.documents.length > 0) {
                return response.documents[0] as unknown as RecentActivity;
            }
            return null;
        } catch (error) {
            console.error('Error fetching activity progress:', error);
            return null;
        }
    },

    async markAsCompleted(userId: string, contentId: string) {
        try {
            const existing = await databases.listDocuments(
                config.databaseId,
                config.recentActivityCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('contentId', contentId)
                ]
            );

            if (existing.documents.length > 0) {
                return await databases.updateDocument(
                    config.databaseId,
                    config.recentActivityCollectionId,
                    existing.documents[0].$id,
                    {
                        completed: true,
                        timestamp: new Date().toISOString()
                    }
                );
            }
        } catch (error) {
            console.error('Error marking activity as completed:', error);
        }
    },

    async getCompletedCount(userId: string): Promise<number> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.recentActivityCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('completed', true)
                ]
            );
            return response.total;
        } catch (error) {
            console.error('Error fetching completed count:', error);
            return 0;
        }
    }
};
