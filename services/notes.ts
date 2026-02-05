import { databases, config } from '@/lib/appwrite';
import { Note } from '@/types';
import { ID, Query } from 'appwrite';

export const noteServices = {
    async getUserNotes(userId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.notesCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$updatedAt')
                ]
            );
            return response.documents.map(doc => ({
                ...doc,
                content: (doc as any).text || (doc as any).content || ''
            })) as unknown as Note[];
        } catch (error) {
            console.error('Error fetching user notes:', error);
            throw error;
        }
    },

    async getNoteByContent(userId: string, contentId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.notesCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.equal('contentId', contentId)
                ]
            );
            if (response.documents.length > 0) {
                const doc = response.documents[0];
                return {
                    ...doc,
                    content: (doc as any).text || (doc as any).content || ''
                } as unknown as Note;
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

            const payload = {
                userId: note.userId,
                contentId: note.contentId,
                text: note.text || '',
                tags: note.tags || '',
                updatedAt: new Date().toISOString()
            };

            if (existingNote) {
                return await databases.updateDocument(
                    config.databaseId,
                    config.notesCollectionId,
                    existingNote.$id,
                    {
                        ...payload,
                        noteId: existingNote.noteId
                    }
                );
            } else {
                const noteId = ID.unique();
                return await databases.createDocument(
                    config.databaseId,
                    config.notesCollectionId,
                    noteId,
                    {
                        ...payload,
                        noteId: noteId,
                        createdAt: new Date().toISOString(),
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
                config.notesCollectionId,
                noteId
            );
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }
};
