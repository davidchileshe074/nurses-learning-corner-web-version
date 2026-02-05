import { databases, config } from '@/lib/appwrite';
import { Flashcard, FlashcardDeck } from '@/types';
import { Query, ID } from 'appwrite';

export const flashcardServices = {
    // Deck Management
    async getUserDecks(userId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.flashcardDecksCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$updatedAt')
                ]
            );
            return response.documents as unknown as FlashcardDeck[];
        } catch (error) {
            console.error('Error fetching decks:', error);
            return [];
        }
    },

    async createDeck(userId: string, title: string, subject: string) {
        try {
            const deck = await databases.createDocument(
                config.databaseId,
                config.flashcardDecksCollectionId,
                ID.unique(),
                {
                    userId,
                    title,
                    subject,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
            return deck as unknown as FlashcardDeck;
        } catch (error) {
            console.error('Error creating deck:', error);
            return null;
        }
    },

    // Card Management
    async getFlashcards(deckId: string) {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.flashcardsCollectionId,
                [
                    Query.equal('deckId', deckId),
                    Query.limit(100)
                ]
            );
            return response.documents as unknown as Flashcard[];
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    },

    async addFlashcard(deckId: string, front: string, back: string) {
        try {
            const now = new Date().toISOString();
            const card = await databases.createDocument(
                config.databaseId,
                config.flashcardsCollectionId,
                ID.unique(),
                {
                    deckId,
                    front,
                    back,
                    createdAt: now,
                    updatedAt: now
                }
            );

            // Update deck's updatedAt
            await databases.updateDocument(
                config.databaseId,
                config.flashcardDecksCollectionId,
                deckId,
                { updatedAt: now }
            );

            return card as unknown as Flashcard;
        } catch (error) {
            console.error('Error adding card:', error);
            return null;
        }
    },

    async deleteFlashcard(cardId: string) {
        try {
            await databases.deleteDocument(
                config.databaseId,
                config.flashcardsCollectionId,
                cardId
            );
            return true;
        } catch (error) {
            console.error('Error deleting card:', error);
            return false;
        }
    },

    async updateMasteryStatus(cardId: string, mastered: boolean) {
        try {
            return await databases.updateDocument(
                config.databaseId,
                config.flashcardsCollectionId,
                cardId,
                {
                    updatedAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error updating mastery status:', error);
            throw error;
        }
    }
};
