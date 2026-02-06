
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export const sendEmailOTP = async (email: string, userId: string = ID.unique()) => {
    // If userId is 'unique_temp_id' or similar placeholder, we generate a unique ID
    const targetUserId = (userId === 'unique_temp_id' || userId === 'current') ? ID.unique() : userId;
    return await account.createEmailToken(targetUserId, email);
};

export const verifyEmailOTP = async (userId: string, secret: string) => {
    try {
        // Clear existing session if any to avoid "session already active" error
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore if no session exists
        }
        return await account.createSession(userId, secret);
    } catch (error: any) {
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        return null;
    }
};
