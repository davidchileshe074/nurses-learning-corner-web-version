
import { create } from 'zustand';
import { Profile } from '@/types';
import { account, databases, config } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

interface AuthState {
    user: Models.User<Models.Preferences> | null;
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;
    checkSession: () => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,

    checkSession: async () => {
        set({ isLoading: true, error: null });
        try {
            const user = await account.get();
            set({ user });

            // Fetch profile
            try {
                const response = await databases.listDocuments(
                    config.databaseId,
                    config.profilesCollectionId,
                    [Query.equal("userId", user.$id)]
                );

                if (response.documents.length > 0) {
                    set({ profile: response.documents[0] as unknown as Profile });
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        } catch (err: any) {
            if (err.code !== 401) {
                set({ error: err.message });
            }
            set({ user: null, profile: null });
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await account.deleteSession('current');
            set({ user: null, profile: null });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refreshProfile: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.profilesCollectionId,
                [Query.equal("userId", user.$id)]
            );

            if (response.documents.length > 0) {
                set({ profile: response.documents[0] as unknown as Profile });
            }
        } catch (err) {
            console.error('Error refreshing profile:', err);
        }
    }
}));
