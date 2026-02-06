
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export const sendEmailOTP = async (email: string, userId: string = ID.unique()) => {
    // If userId is 'unique_temp_id' or similar placeholder, we generate a unique ID
    const targetUserId = (userId === 'unique_temp_id' || userId === 'current') ? ID.unique() : userId;
    return await account.createEmailToken(targetUserId, email);
};

export const verifyEmailOTP = async (userId: string, secret: string) => {
    return await account.createSession(userId, secret);
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        return null;
    }
};
