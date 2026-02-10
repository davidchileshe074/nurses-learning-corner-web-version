
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

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,

    checkSession: async () => {
        // 1. Initial hydration from localStorage for instant offline access
        if (typeof window !== 'undefined') {
            try {
                const cachedUser = localStorage.getItem('nlc_user');
                const cachedProfile = localStorage.getItem('nlc_profile');
                if (cachedUser) {
                    set({
                        user: JSON.parse(cachedUser),
                        profile: cachedProfile ? JSON.parse(cachedProfile) : null,
                        isLoading: false
                    });
                }
            } catch (e) {
                console.error('Failed to parse cached user data', e);
                localStorage.removeItem('nlc_user');
                localStorage.removeItem('nlc_profile');
            }
        }

        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

        // If we have cached data and we're offline, stop here
        if (isOffline && get().user) {
            set({ isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const user = await account.get();
            set({ user });
            localStorage.setItem('nlc_user', JSON.stringify(user));

            // Fetch profile
            try {
                const response = await databases.listDocuments(
                    config.databaseId,
                    config.profilesCollectionId,
                    [Query.equal("userId", user.$id)]
                );

                if (response.documents.length > 0) {
                    const profile = response.documents[0] as unknown as Profile;
                    set({ profile });
                    localStorage.setItem('nlc_profile', JSON.stringify(profile));
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        } catch (err: any) {
            // If offline, don't clear the session, keep the cached one
            if (isOffline && get().user) {
                set({ isLoading: false });
                return;
            }

            if (err.code !== 401) {
                set({ error: err.message });
            }
            set({ user: null, profile: null });
            localStorage.removeItem('nlc_user');
            localStorage.removeItem('nlc_profile');
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await account.deleteSession('current');
            localStorage.removeItem('nlc_user');
            localStorage.removeItem('nlc_profile');
            set({ user: null, profile: null });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refreshProfile: async () => {
        const user = get().user;
        if (!user) return;

        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.profilesCollectionId,
                [Query.equal("userId", user.$id)]
            );

            if (response.documents.length > 0) {
                const profile = response.documents[0] as unknown as Profile;
                set({ profile });
                localStorage.setItem('nlc_profile', JSON.stringify(profile));
            }
        } catch (err) {
            console.error('Error refreshing profile:', err);
        }
    }
}));
