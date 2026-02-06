export type Program = 'REGISTERED-NURSING' | 'MIDWIFERY' | 'PUBLIC-HEALTH' | 'MENTAL-HEALTH' | 'ONCOLOGY' | 'PAEDIATRIC' | 'RN' | 'RM' | 'PHN' | 'EN' | 'EM' | '';
export type YearOfStudy = 'YEAR1' | 'YEAR2' | 'YEAR3';

export interface Profile {
    $id: string;
    userId: string;
    fullName: string;
    email: string;
    whatsappNumber?: string;
    bio?: string;
    profilePicture?: string;
    dateOfBirth?: string;
    program: Program;
    verified: boolean;
    adminApproved: boolean;
    createdAt: string;
    updatedAt: string;
    deviceId?: string;
    yearOfStudy?: YearOfStudy | string;
    pushToken?: string;
}

export interface Content {
    $id: string;
    title: string;
    description: string;
    type: 'pdf' | 'link' | 'flashcard' | 'marking_key' | string;
    subject: string;
    program: Program;
    fileId?: string;
    url?: string;
    thumbnailId?: string;
    createdAt: string;
}

export interface Note {
    $id: string;
    noteId: string;
    userId: string;
    contentId: string;
    text: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FlashcardDeck {
    $id: string;
    userId: string;
    title: string;
    subject: string;
    description?: string;
    visibility?: 'public' | 'private';
    createdAt: string;
    updatedAt: string;
}

export interface Flashcard {
    $id: string;
    deckId: string;
    front: string;
    back: string;
    nextReview?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Subscription {
    $id: string;
    subscriptionId: string;
    subscriptionName: string;
    userId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'NONE';
    startDate: string;
    endDate: string | null;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AppNotification {
    $id: string;
    userId: string;
    title: string;
    message: string;
    type: 'system' | 'subscription' | 'content';
    isRead: boolean;
    createdAt: string;
}

export interface AccessCode {
    $id: string;
    code: string;
    durationDays: number;
    isUsed: boolean;
    usedByUserId?: string;
    usedAt?: string;
    expirationDate?: string;
    subscriptionId?: string;
    plan?: string;
    createdAt: string;
}
