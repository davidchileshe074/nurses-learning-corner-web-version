'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { noteServices } from '@/services/notes';
import { Note } from '@/types';
import { activityServices } from '@/services/activity';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteEditor } from '@/components/NoteEditor';

export default function NotebookPage() {
    const { user } = useAuthStore();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotes();
        }
    }, [user]);

    useEffect(() => {
        if (selectedNote && selectedNote.$id !== 'new') {
            activityServices.logActivity(user!.$id, {
                contentId: selectedNote.contentId,
                type: 'note',
                title: selectedNote.title || 'Untitled Note',
                subject: 'Digital Notebook'
            });
        }
    }, [selectedNote, user]);

    const fetchNotes = async () => {
        try {
            const data = await noteServices.getUserNotes(user!.$id);
            setNotes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewNote = () => {
        setSelectedNote({
            $id: 'new',
            userId: user!.$id,
            contentId: 'general',
            title: '',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as Note);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
            {/* Sidebar List */}
            <aside className="w-full md:w-80 lg:w-96 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[40vh] md:h-screen">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Notes</h1>
                    <button
                        onClick={createNewNote}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-2xl"></div>
                        ))
                    ) : notes.length > 0 ? (
                        notes.map((note) => (
                            <button
                                key={note.$id}
                                onClick={() => setSelectedNote(note)}
                                className={`w-full text-left p-4 rounded-2xl transition-all ${selectedNote?.$id === note.$id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
                                    }`}
                            >
                                <h3 className={`font-bold text-sm truncate ${selectedNote?.$id === note.$id ? 'text-blue-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {note.title || 'Untitled Note'}
                                </h3>
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">{note.content || 'Empty note...'}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                    {note.contentId !== 'general' && (
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">Linked</span>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-slate-400 text-sm font-bold">No notes yet</p>
                            <p className="text-[10px] text-slate-500 mt-1">Start your clinical reflection today.</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Editor Area */}
            <main className="flex-1 p-6 md:p-10 flex flex-col h-[60vh] md:h-screen">
                <AnimatePresence mode="wait">
                    {selectedNote ? (
                        <motion.div
                            key={selectedNote.$id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full"
                        >
                            <NoteEditor
                                userId={user!.$id}
                                contentId={selectedNote.contentId}
                                initialTitle={selectedNote.title}
                                initialContent={selectedNote.content}
                                onSave={() => fetchNotes()}
                            />
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[30px] flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Select a note to edit</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2">Choose from the list or create a new entry.</p>
                            <button
                                onClick={createNewNote}
                                className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20"
                            >
                                Create New Entry
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
