import { databases, config } from '@/lib/appwrite';
import { Content, Program } from '@/types';
import { Query } from 'appwrite';

export const contentServices = {
    async getLibraryContent(program?: Program, subject?: string) {
        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(100),
        ];

        if (program && program !== '') {
            queries.push(Query.equal('program', program));
        }

        if (subject && subject !== '') {
            queries.push(Query.search('subject', subject));
        }

        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.contentCollectionId,
                queries
            );
            return response.documents as unknown as Content[];
        } catch (error) {
            console.error('Error fetching library content:', error);
            throw error;
        }
    },

    async getContentById(contentId: string) {
        try {
            const response = await databases.getDocument(
                config.databaseId,
                config.contentCollectionId,
                contentId
            );
            return response as unknown as Content;
        } catch (error) {
            console.error('Error fetching content by ID:', error);
            throw error;
        }
    }
};
