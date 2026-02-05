import { databases, config, functions } from '@/lib/appwrite';
import { Subscription } from '@/types';
import { Query } from 'appwrite';

export const subscriptionServices = {
    async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.subscriptionsCollectionId,
                [Query.equal('userId', userId)]
            );

            if (response.documents.length > 0) {
                return response.documents[0] as unknown as Subscription;
            }
            return null;
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            return null;
        }
    },

    async redeemAccessCode(code: string, userId: string) {
        try {
            const result = await functions.createExecution(
                '696d86190027bc7e3e2a', // Institutional Access Redemption Function
                JSON.stringify({ code, userId })
            );

            if (!result.responseBody) {
                throw new Error(`Cloud sequence returned null state. Status: ${result.status}`);
            }

            return JSON.parse(result.responseBody);
        } catch (error: any) {
            console.error('Redeem access code fatal error:', error);
            throw new Error(error.message || 'Redemption sequence failed.');
        }
    },

    checkSubscriptionExpiry(subscription: Subscription | null): boolean {
        if (!subscription || subscription.status !== 'ACTIVE' || !subscription.endDate) return false;
        const endDate = new Date(subscription.endDate);
        return endDate > new Date();
    }
};
