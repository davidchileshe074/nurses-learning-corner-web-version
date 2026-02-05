'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { flashcardServices } from '@/services/flashcards';
import { FlashcardDeck } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Layers,
    Search,
    Calendar,
    Play,
    SearchX,
    FolderPlus,
    X,
    Settings2
} from 'lucide-react';
import Link from 'next/link';

export default function FlashcardsPage() {
    const { user } = useAuthStore();
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create Deck Modal State
    const [isCreateVisible, setIsCreateVisible] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckSubject, setNewDeckSubject] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchDecks();
        }
    }, [user]);

    const fetchDecks = async () => {
        setIsLoading(true);
        try {
            const data = await flashcardServices.getUserDecks(user!.$id);
            setDecks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newDeckTitle.trim()) return;

        setIsCreating(true);
        try {
            const deck = await flashcardServices.createDeck(
                user.$id,
                newDeckTitle,
                newDeckSubject
            );
            if (deck) {
                setDecks([deck, ...decks]);
                setIsCreateVisible(false);
                setNewDeckTitle('');
                setNewDeckSubject('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredDecks = decks.filter(deck =>
        (deck.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (deck.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Retentive Memory</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Flashcard <span className="text-blue-600 italic">Decks .</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search decks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateVisible(true)}
                            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-900/50 animate-pulse rounded-[40px] border border-slate-100 dark:border-slate-800"></div>
                        ))}
                    </div>
                ) : filteredDecks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDecks.map((deck, index) => (
                            <motion.div
                                key={deck.$id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="group bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all relative overflow-hidden h-full flex flex-col">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>

                                    <div className="relative z-10 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">{deck.subject || 'Revision'}</p>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight line-clamp-2">{deck.title}</h3>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                                <Layers size={24} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-400 mb-8">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                Updated {new Date(deck.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-6 border-t border-slate-50 dark:border-slate-800 relative z-10">
                                        <Link
                                            href={`/flashcards/${deck.$id}`}
                                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Settings2 size={12} />
                                            Manage
                                        </Link>
                                        <Link
                                            href={`/flashcards/${deck.$id}/study`}
                                            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Play size={12} fill="currentColor" />
                                            Study
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[40px] flex items-center justify-center mb-8 border border-white dark:border-slate-800 shadow-xl">
                            <SearchX size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Decks Found</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Create your first revision deck to start mastering concepts with Spaced Repetition.</p>
                        <button
                            onClick={() => setIsCreateVisible(true)}
                            className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <FolderPlus size={18} />
                            Create Your First Deck
                        </button>
                    </div>
                )}
            </div>

            {/* Create Deck Modal */}
            <AnimatePresence>
                {isCreateVisible && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateVisible(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[48px] p-10 shadow-2xl relative z-10 border border-white dark:border-slate-800"
                        >
                            <button
                                onClick={() => setIsCreateVisible(false)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-2">New Deck</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Memory Organization</p>
                            </div>

                            <form onSubmit={handleCreateDeck} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deck Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Clinical Pharmacology"
                                        value={newDeckTitle}
                                        onChange={(e) => setNewDeckTitle(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-3xl outline-none transition-all text-sm font-bold shadow-inner"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Year 2 Semester 1"
                                        value={newDeckSubject}
                                        onChange={(e) => setNewDeckSubject(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-3xl outline-none transition-all text-sm font-bold shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isCreating ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Plus size={18} />
                                    )}
                                    {isCreating ? 'Deploying...' : 'Establish Deck'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
