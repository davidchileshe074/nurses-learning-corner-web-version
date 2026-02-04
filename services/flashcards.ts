import { databases, config } from '@/lib/appwrite';
import { Flashcard, Program } from '@/types';
import { Query, ID } from 'appwrite';

export const flashcardServices = {
    async getFlashcards(program?: Program, category?: string) {
        const queries = [
            Query.limit(100),
        ];

        if (program) {
            queries.push(Query.equal('program', program));
        }

        if (category && category !== '') {
            queries.push(Query.equal('category', category));
        }

        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.flashcardsCollectionId,
                queries
            );
            return response.documents as unknown as Flashcard[];
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            throw error;
        }
    },

    async updateMasteryStatus(cardId: string, mastered: boolean) {
        try {
            return await databases.updateDocument(
                config.databaseId,
                config.flashcardsCollectionId,
                cardId,
                { mastered }
            );
        } catch (error) {
            console.error('Error updating mastery status:', error);
            throw error;
        }
    }
};
