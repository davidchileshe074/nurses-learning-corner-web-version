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
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-theme(spacing.24))] bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar List */}
            <aside className="w-full md:w-80 lg:w-96 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[40%] md:h-full relative z-20">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Clinical Log</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Notebook <span className="text-purple-600 italic">.</span></h1>
                        </div>
                        <button
                            onClick={createNewNote}
                            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 transition-all active:scale-95 group"
                            title="New Note"
                        >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search notes..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-3xl border border-slate-100/50 dark:border-slate-800/50"></div>
                        ))
                    ) : notes.length > 0 ? (
                        notes.map((note) => (
                            <button
                                key={note.$id}
                                onClick={() => setSelectedNote(note)}
                                className={`w-full text-left p-5 rounded-[28px] transition-all relative overflow-hidden group border-2 ${selectedNote?.$id === note.$id
                                    ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-600 shadow-xl shadow-purple-600/5'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent text-slate-400'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-2 rounded-xl transition-colors ${selectedNote?.$id === note.$id ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                                        <FileText size={14} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className={`font-black text-sm truncate uppercase tracking-tight ${selectedNote?.$id === note.$id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                                    {note.text.split('\n')[0] || 'Untitled Record'}
                                </h3>
                                <p className="text-[11px] line-clamp-1 mt-1 font-medium opacity-60">{note.text.split('\n')[1] || 'Drafting clinical points...'}</p>

                                {note.contentId !== 'general' && (
                                    <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 w-fit rounded-lg border border-slate-100 dark:border-slate-700">
                                        <LinkIcon size={8} className="text-purple-600" />
                                        <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Resource Linked</span>
                                    </div>
                                )}

                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${selectedNote?.$id === note.$id ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                                    <ChevronRight size={16} className="text-purple-600" />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-[35%] flex items-center justify-center mb-6 border border-white dark:border-slate-800 shadow-xl">
                                <SearchX size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Empty Archive</h3>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Your medical journey starts with a single observation.</p>
                            <button
                                onClick={createNewNote}
                                className="mt-6 flex items-center gap-2 text-purple-600 font-black uppercase text-[10px] tracking-widest hover:gap-3 transition-all"
                            >
                                <FolderPlus size={14} />
                                Initialize First Note
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
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[40px] flex items-center justify-center mb-8 border border-white dark:border-slate-800 shadow-2xl relative"
                            >
                                <div className="absolute inset-0 bg-purple-600/5 blur-2xl rounded-full"></div>
                                <History size={40} className="text-slate-300 dark:text-slate-700 relative z-10" />
                            </motion.div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Select a Record</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Access your clinical insights or create a new entry to document your findings.</p>
                            <button
                                onClick={createNewNote}
                                className="mt-10 px-10 py-4 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-purple-600/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
                            >
                                <Plus size={18} />
                                Create New Record
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
