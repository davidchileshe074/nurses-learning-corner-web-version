import Dexie, { Table } from 'dexie';
import { Content } from '@/types';

export interface CachedContent extends Content {
    blob: Blob;
    downloadedAt: string;
}

export class MyDatabase extends Dexie {
    cachedContent!: Table<CachedContent>;
    syncQueue!: Table<{
        id?: number;
        type: string;
        payload: any;
        timestamp: number;
    }>;

    constructor() {
        super('NurseCornerDB');
        this.version(1).stores({
            cachedContent: '$id, title, subject, program, type',
            syncQueue: '++id, type, payload, timestamp'
        });
    }
}

export const db = new MyDatabase();
