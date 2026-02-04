import { databases, config } from '@/lib/appwrite';
import { Note } from '@/types';
import { ID, Query } from 'appwrite';

export const noteServices = {
    async getUserNotes(userId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                'notes', // Assuming collection ID is 'notes'
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$updatedAt')
                ]
            );
            return response.documents as unknown as Note[];
        } catch (error) {
            console.error('Error fetching user notes:', error);
            throw error;
        }
    },

    async getNoteByContent(userId: string, contentId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                'notes',
                [
                    Query.equal('userId', userId),
                    Query.equal('contentId', contentId)
                ]
            );
            if (response.documents.length > 0) {
                return response.documents[0] as unknown as Note;
            }
            return null;
        } catch (error) {
            console.error('Error fetching note by content:', error);
            throw error;
        }
    },

    async upsertNote(note: Partial<Note> & { userId: string; contentId: string }) {
        try {
            const existingNote = await this.getNoteByContent(note.userId, note.contentId);

            if (existingNote) {
                return await databases.updateDocument(
                    config.databaseId,
                    'notes',
                    existingNote.$id,
                    {
                        title: note.title,
                        content: note.content,
                        lastPosition: note.lastPosition,
                        updatedAt: new Date().toISOString()
                    }
                );
            } else {
                return await databases.createDocument(
                    config.databaseId,
                    'notes',
                    ID.unique(),
                    {
                        ...note,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                );
            }
        } catch (error) {
            console.error('Error upserting note:', error);
            throw error;
        }
    },

    async deleteNote(noteId: string) {
        try {
            await databases.deleteDocument(
                config.databaseId,
                'notes',
                noteId
            );
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }
};
