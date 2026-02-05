import { Client, Account, Databases, Storage, Avatars, Functions } from "appwrite";

export const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
  profilesCollectionId: process.env.NEXT_PUBLIC_COL_PROFILES!,
  contentCollectionId: process.env.NEXT_PUBLIC_COL_CONTENT!,
  subscriptionsCollectionId: process.env.NEXT_PUBLIC_COL_SUBSCRIPTIONS!,
  adminsCollectionId: process.env.NEXT_PUBLIC_COL_ADMINS!,
  accessCodesCollectionId: process.env.NEXT_PUBLIC_COL_ACCESS_CODES!,
  notificationsCollectionId: process.env.NEXT_PUBLIC_COL_NOTIFICATIONS || 'notifications',
  flashcardsCollectionId: process.env.NEXT_PUBLIC_COL_FLASHCARDS || 'flashcards',
  recentActivityCollectionId: process.env.NEXT_PUBLIC_COL_RECENT_ACTIVITY || 'recent_activity',
  notesCollectionId: process.env.NEXT_PUBLIC_COL_NOTES || 'notes',
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export const functions = new Functions(client);

export { client };
