'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { noteServices } from '@/services/notes';
import { Note } from '@/types';
import { activityServices } from '@/services/activity';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteEditor } from '@/components/NoteEditor';
import {
    Plus,
    Search,
    FileText,
    Link as LinkIcon,
    ChevronRight,
    SearchX,
    FolderPlus,
    History
} from 'lucide-react';

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
            const displayTitle = selectedNote.text.split('\n')[0] || 'Untitled Note';
            activityServices.logActivity(user!.$id, {
                contentId: selectedNote.contentId,
                type: 'note',
                title: displayTitle,
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
            text: '',
            tags: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as Note);
    };

    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-theme(spacing.24))] bg-[#F3F5F7] flex flex-col md:flex-row overflow-hidden border-t border-slate-200">
            {/* Sidebar List */}
            <aside className="w-full md:w-80 lg:w-96 border-r border-[#d5dde5] bg-white flex flex-col h-[40%] md:h-full relative z-20">
                <div className="p-6 border-b border-[#d5dde5] space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#2B669A] uppercase tracking-wide">My Notes</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notebook</h1>
                        </div>
                        <button
                            onClick={createNewNote}
                            className="w-10 h-10 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md flex items-center justify-center shadow-sm transition-all active:scale-95"
                            title="New Note"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a note..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#2B669A] focus:bg-white rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-lg border border-slate-100"></div>
                        ))
                    ) : notes.length > 0 ? (
                        notes.map((note) => (
                            <button
                                key={note.$id}
                                onClick={() => setSelectedNote(note)}
                                className={`w-full text-left p-4 rounded-lg transition-all border ${selectedNote?.$id === note.$id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'hover:bg-slate-50 border-transparent text-slate-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <div className={`flex items-center gap-2 ${selectedNote?.$id === note.$id ? 'text-[#2B669A]' : 'text-slate-400'}`}>
                                        <FileText size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">
                                            {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <h3 className={`font-bold text-sm truncate ${selectedNote?.$id === note.$id ? 'text-[#2B669A]' : 'text-slate-700'}`}>
                                    {note.text.split('\n')[0] || 'Untitled Record'}
                                </h3>
                                <p className="text-xs line-clamp-1 mt-1 opacity-70">{note.text.split('\n')[1] || 'No additional text...'}</p>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <SearchX size={24} className="text-slate-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Empty Notebook</h3>
                            <button
                                onClick={createNewNote}
                                className="mt-4 flex items-center gap-2 text-[#2B669A] font-bold text-xs uppercase tracking-wide hover:underline"
                            >
                                <Plus size={14} />
                                Create First Note
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Editor Area */}
            <main className="flex-1 p-6 md:p-10 flex flex-col h-[60%] md:h-full overflow-y-auto custom-scrollbar">
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
                                initialContent={selectedNote.text}
                                onSave={() => fetchNotes()}
                            />
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"
                            >
                                <History size={32} className="text-slate-300" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select a Note</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Choose a note from the sidebar or create a new one.</p>
                            <button
                                onClick={createNewNote}
                                className="mt-8 px-6 py-3 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-xs uppercase tracking-wide shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                New Note
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
