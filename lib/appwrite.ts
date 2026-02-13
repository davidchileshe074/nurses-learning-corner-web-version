import { Client, Account, Databases, Storage, Avatars, Functions } from "appwrite";

export const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim()!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim()!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID?.trim()!,
  profilesCollectionId: (process.env.NEXT_PUBLIC_COL_PROFILES || '').trim()!,
  contentCollectionId: (process.env.NEXT_PUBLIC_COL_CONTENT || '').trim()!,
  subscriptionsCollectionId: (process.env.NEXT_PUBLIC_COL_SUBSCRIPTIONS || '').trim()!,
  adminsCollectionId: (process.env.NEXT_PUBLIC_COL_ADMINS || '').trim()!,
  accessCodesCollectionId: (process.env.NEXT_PUBLIC_COL_ACCESS_CODES || '').trim()!,
  notificationsCollectionId: (process.env.NEXT_PUBLIC_COL_NOTIFICATIONS || 'notifications').trim(),
  flashcardsCollectionId: (process.env.NEXT_PUBLIC_COL_FLASHCARDS || 'flashcards').trim(),
  flashcardDecksCollectionId: (process.env.NEXT_PUBLIC_COL_FLASHCARD_DECKS || 'flashcard_decks').trim(),
  recentActivityCollectionId: (process.env.NEXT_PUBLIC_COL_RECENT_ACTIVITY || 'recent_activity').trim(),
  notesCollectionId: (process.env.NEXT_PUBLIC_COL_NOTES || 'notes').trim(),
};

const client = new Client();

if (config.endpoint && config.projectId) {
  client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);
} else {
  console.warn('[Appwrite] Client initialized without endpoint or project ID. This is expected during build time if env vars are not provided.');
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export const functions = new Functions(client);

export { client };
