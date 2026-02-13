import { databases, config } from '@/lib/appwrite';
import { Content, Program } from '@/types';
import { Query } from 'appwrite';

export const contentServices = {
    async getLibraryContent(
        program?: Program | string,
        subject?: string,
        type?: string,
        offset: number = 0,
        limit: number = 20
    ) {
        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset(offset),
        ];

        if (program && program !== '' && program !== 'ALL' && program !== 'undefined' && program !== 'null') {
            // Mapping to ensure compatibility between new high-fidelity mobile codes and legacy database values
            const p = (program || '').toUpperCase();
            let variants = new Set<string>([program, p, program.toLowerCase()]);

            if (p === 'REGISTERED-NURSING' || p === 'RN') {
                ['REGISTERED-NURSING', 'RN', 'Registered Nursing', 'rn', 'registered-nursing', 'REGISTERED NURSING'].forEach(v => variants.add(v));
            } else if (p === 'MIDWIFERY' || p === 'RM') {
                ['MIDWIFERY', 'RM', 'Midwifery', 'rm', 'midwifery', 'Midwife'].forEach(v => variants.add(v));
            } else if (p === 'PUBLIC-HEALTH' || p === 'PHN' || p === 'PUBLIC-HEALTH-NURSING') {
                ['PUBLIC-HEALTH', 'PHN', 'Public Health Nursing', 'phn', 'public-health-nursing', 'Public Health', 'PH'].forEach(v => variants.add(v));
            } else if (p === 'MENTAL-HEALTH' || p === 'MHN') {
                ['MENTAL-HEALTH', 'MHN', 'Mental Health Nursing', 'mhn', 'mental-health', 'Mental Health', 'MH'].forEach(v => variants.add(v));
            } else if (p === 'ENROLLED-NURSING' || p === 'EN') {
                ['ENROLLED-NURSING', 'EN', 'Enrolled Nursing', 'en', 'enrolled-nursing', 'ENROLLED NURSING'].forEach(v => variants.add(v));
            } else if (p === 'ENROLLED-MIDWIFERY' || p === 'EM') {
                ['ENROLLED-MIDWIFERY', 'EM', 'Enrolled Midwifery', 'em', 'enrolled-midwifery', 'ENROLLED MIDWIFERY'].forEach(v => variants.add(v));
            }

            const programCodes = Array.from(variants).filter(Boolean);
            if (programCodes.length > 0) {
                console.log(`[ContentService] Executing Precision Search: Source=${program} -> Targets=[${programCodes.join(', ')}]`);
                queries.push(Query.equal('program', programCodes));
            }
        }

        if (subject && subject !== '' && subject !== 'All Courses') {
            queries.push(Query.equal('subject', subject));
        }

        if (type && type !== '' && type !== 'All') {
            // Map web filter labels to DB types if necessary, or use as is
            // Based on RN: filterOptions = ['All', 'Downloads', 'PDF', 'Audio', 'Past Paper', 'Marking Key', 'Others'];
            if (type === 'PDF') queries.push(Query.equal('type', 'PDF'));
            else if (type === 'Past Paper') queries.push(Query.equal('type', 'PAST_PAPER'));
            else if (type === 'Marking Key') queries.push(Query.equal('type', 'MARKING_KEY'));
            else if (type === 'Others') queries.push(Query.notEqual('type', ['PDF', 'PAST_PAPER', 'MARKING_KEY']));
        }

        if (!config.databaseId || !config.contentCollectionId) {
            console.error('[ContentService] Database credentials missing. Initialization required.');
            return { documents: [], total: 0 };
        }

        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.contentCollectionId,
                queries
            );
            return {
                documents: response.documents as unknown as Content[],
                total: response.total
            };
        } catch (error: any) {
            console.error('[ContentService] Query Aborted:', error.message);
            // Return safe state to avoid UI disruptions
            return { documents: [], total: 0 };
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
