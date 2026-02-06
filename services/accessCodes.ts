import { databases, config } from '@/lib/appwrite';
import { AccessCode, Subscription } from '@/types';
import { Query, ID } from 'appwrite';
import { notificationServices } from './notifications';

export const accessCodeServices = {
    async generateCodes(count: number, durationDays: number, plan: string = 'PREMIUM'): Promise<string[]> {
        const generated: string[] = [];
        for (let i = 0; i < count; i++) {
            const raw = Math.random().toString(36).substring(2, 14).toUpperCase();
            const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;

            await databases.createDocument(
                config.databaseId,
                config.accessCodesCollectionId,
                ID.unique(),
                {
                    code: raw,
                    durationDays,
                    plan,
                    isUsed: false,
                    createdAt: new Date().toISOString()
                }
            );
            generated.push(formatted);
        }
        return generated;
    },

    async validateAndRedeem(code: string, userId: string): Promise<{ success: boolean; message: string; durationDays?: number }> {
        try {
            // 1. Normalize the code
            const input = code.trim().toUpperCase();

            // If the user forgot 'NLC-', add it. Otherwise, use as is.
            const searchCode = input.startsWith('NLC-') ? input : `NLC-${input.replace('NLC', '')}`;

            console.log(`[AccessCode] Attempting redemption: Input="${code}" | Searching for="${searchCode}"`);

            // 2. Find the code
            let response;
            try {
                response = await databases.listDocuments(
                    config.databaseId,
                    config.accessCodesCollectionId,
                    [Query.equal('code', searchCode)]
                );
            } catch (dbError: any) {
                console.error('[AccessCode] Appwrite Database Error:', dbError);
                throw new Error(`Cloud verification failed: ${dbError.message}`);
            }

            if (response.documents.length === 0) {
                // Final fallback: search for original input without transformation
                response = await databases.listDocuments(
                    config.databaseId,
                    config.accessCodesCollectionId,
                    [Query.equal('code', input)]
                );
            }

            if (response.documents.length === 0) {
                throw new Error('Credential mismatch: This access key is invalid. Please verify your institutional credentials.');
            }

            const accessCode = response.documents[0] as unknown as AccessCode;

            // Multi-device synchronization: Handle same-account re-entry
            if (accessCode.isUsed) {
                if (accessCode.usedByUserId === userId) {
                    await this._syncProfileStatus(userId);
                    return {
                        success: true,
                        message: `Clinical access is already active on your profile. State synchronized successfully.`,
                        durationDays: accessCode.durationDays
                    };
                } else {
                    throw new Error('Credential mismatch: This access key has already been bound to another clinician.');
                }
            }

            // 3. Update or Create Subscription
            const subResponse = await databases.listDocuments(
                config.databaseId,
                config.subscriptionsCollectionId,
                [Query.equal('userId', userId)]
            );

            const durationMs = (accessCode.durationDays || 30) * 24 * 60 * 60 * 1000;
            const now = new Date();
            let startDate = now;
            let endDate = new Date(now.getTime() + durationMs);

            if (subResponse.documents.length > 0) {
                const existingSub = subResponse.documents[0] as unknown as Subscription;
                const currentEnd = existingSub.endDate ? new Date(existingSub.endDate) : now;

                if (currentEnd > now) {
                    startDate = new Date(existingSub.startDate);
                    endDate = new Date(currentEnd.getTime() + durationMs);
                }

                await databases.updateDocument(
                    config.databaseId,
                    config.subscriptionsCollectionId,
                    existingSub.$id,
                    {
                        status: 'ACTIVE',
                        subscriptionId: accessCode.$id, // Link to the access code ID or use a generic one
                        subscriptionName: 'Premium Nurse Learning Corner',
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        autoRenew: false,
                        updatedAt: now.toISOString()
                    }
                );
            } else {
                await databases.createDocument(
                    config.databaseId,
                    config.subscriptionsCollectionId,
                    ID.unique(),
                    {
                        userId,
                        subscriptionId: accessCode.$id,
                        subscriptionName: 'Premium Nurse Learning Corner',
                        status: 'ACTIVE',
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        autoRenew: false,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                    }
                );
            }

            // 4. Finalize: Mark code as used
            await databases.updateDocument(
                config.databaseId,
                config.accessCodesCollectionId,
                accessCode.$id,
                {
                    isUsed: true,
                    usedByUserId: userId,
                    usedAt: now.toISOString()
                }
            );

            // 5. Sync Profile Status
            const profResponse = await databases.listDocuments(
                config.databaseId,
                config.profilesCollectionId,
                [Query.equal('userId', userId)]
            );

            if (profResponse.documents.length > 0) {
                await databases.updateDocument(
                    config.databaseId,
                    config.profilesCollectionId,
                    profResponse.documents[0].$id,
                    {
                        updatedAt: now.toISOString()
                    }
                );
            }

            // 6. Trigger System Notification
            await notificationServices.addNotification(userId, {
                title: 'Premium Activated',
                message: `Your account has been upgraded. ${accessCode.durationDays} days of premium access added. 🎓`,
                type: 'subscription'
            });

            return {
                success: true,
                message: `Success! Your ${accessCode.plan || 'Premium'} membership is now active.`,
                durationDays: accessCode.durationDays
            };
        } catch (error: any) {
            console.error('[AccessCode] Redemption failure:', error.message);
            throw new Error(error.message || 'The secure redemption sequence was interrupted. Please check your connectivity.');
        }
    },

    async _syncProfileStatus(userId: string): Promise<void> {
        const now = new Date().toISOString();
        const profResponse = await databases.listDocuments(
            config.databaseId,
            config.profilesCollectionId,
            [Query.equal('userId', userId)]
        );

        if (profResponse.documents.length > 0) {
            await databases.updateDocument(
                config.databaseId,
                config.profilesCollectionId,
                profResponse.documents[0].$id,
                {
                    updatedAt: now
                }
            );
        }
    }
};
