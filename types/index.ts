export type Program = 'RN' | 'RM' | 'PHN' | 'EN' | 'EM' | '';

export interface Profile {
    $id: string;
    userId: string;
    name: string;
    email: string;
    program: Program;
    school?: string;
    subscriptionStatus: 'active' | 'expired' | 'none';
    isAdmin: boolean;
    pushToken?: string;
    avatarUrl?: string;
    avatarFileId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Content {
    $id: string;
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'link' | 'flashcard';
    subject: string;
    program: Program;
    fileId?: string;
    url?: string;
    thumbnailId?: string;
    createdAt: string;
}

export interface Note {
    $id: string;
    userId: string;
    contentId: string;
    title: string;
    content: string;
    lastPosition?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Flashcard {
    $id: string;
    question: string;
    answer: string;
    category: string;
    program: Program;
    mastered: boolean;
}
