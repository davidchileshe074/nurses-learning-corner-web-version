import { databases, config } from '@/lib/appwrite';
import { AppNotification, Subscription, Profile } from '@/types';
import { Query, ID } from 'appwrite';
import { contentServices } from './content';

const LAST_CONTENT_ID_KEY = 'nlc_last_content_id';
const LAST_EXPIRY_CHECK_KEY = 'nlc_last_expiry_check';

export const notificationServices = {
    async getNotifications(userId: string): Promise<AppNotification[]> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.notificationsCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$createdAt')
                ]
            );
            return response.documents as unknown as AppNotification[];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    async addNotification(userId: string, notif: { title: string; message: string; type: string }) {
        try {
            return await databases.createDocument(
                config.databaseId,
                config.notificationsCollectionId,
                ID.unique(),
                {
                    userId,
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    },

    async markAsRead(notificationId: string) {
        try {
            return await databases.updateDocument(
                config.databaseId,
                config.notificationsCollectionId,
                notificationId,
                { isRead: true }
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    async checkAndGenerateNotifications(userId: string, profile: Profile | null, subscription: Subscription | null) {
        if (!userId || !profile) return;

        // 1. Subscription Expiry Warning (7 days threshold)
        if (subscription?.endDate) {
            const now = new Date();
            const expiry = new Date(subscription.endDate);
            const diffTime = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const lastCheck = localStorage.getItem(LAST_EXPIRY_CHECK_KEY);
            const today = new Date().toISOString().split('T')[0];

            if (diffDays <= 7 && diffDays > 0 && lastCheck !== today) {
                await this.addNotification(userId, {
                    title: 'Clinical Access Warning',
                    message: `Your premium repository access expires in ${diffDays} days. Please re-validate your credentials.`,
                    type: 'SUBSCRIPTION'
                });
                localStorage.setItem(LAST_EXPIRY_CHECK_KEY, today);
            }
        }

        // 2. New Research Content Detection
        try {
            const { documents: latestContent } = await contentServices.getLibraryContent(
                profile.program,
                undefined,
                undefined,
                0,
                10
            );

            if (latestContent && latestContent.length > 0) {
                const lastContentId = localStorage.getItem(LAST_CONTENT_ID_KEY);
                const mostRecent = latestContent[0];

                if (!lastContentId || lastContentId !== mostRecent.$id) {
                    let newCount = 0;
                    if (lastContentId) {
                        const lastIndex = latestContent.findIndex(c => c.$id === lastContentId);
                        newCount = lastIndex === -1 ? latestContent.length : lastIndex;
                    } else {
                        newCount = 1;
                    }

                    if (newCount > 0) {
                        await this.addNotification(userId, {
                            title: 'Laboratory Update',
                            message: `Integrated ${newCount} new diagnostic ${newCount === 1 ? 'asset' : 'assets'} into your curriculum.`,
                            type: 'CONTENT'
                        });
                    }
                    localStorage.setItem(LAST_CONTENT_ID_KEY, mostRecent.$id);
                }
            }
        } catch (error) {
            console.error('New content sync failed:', error);
        }
    }
};
