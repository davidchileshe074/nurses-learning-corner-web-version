'use client';

import { useState, useEffect, use } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { flashcardServices } from '@/services/flashcards';
import { Flashcard } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ChevronLeft,
    Trash2,
    Zap,
    PencilLine,
    X,
    MessageSquareQuote,
    ClipboardCheck,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FlashcardListContent() {
    const searchParams = useSearchParams();
    const deckId = searchParams.get('deckId');
    const { user } = useAuthStore();
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deckTitle, setDeckTitle] = useState('Memory Deck');

    // Add Card Modal State
    const [isAddVisible, setIsAddVisible] = useState(false);
    const [frontText, setFrontText] = useState('');
    const [backText, setBackText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (user && deckId) {
            fetchCards();
            fetchDeckInfo();
        } else if (!deckId) {
            // Prevent infinite loading if deckId is missing
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [user, deckId]);

    async function fetchDeckInfo() {
        try {
            const decks = await flashcardServices.getUserDecks(user!.$id);
            const currentDeck = decks.find(d => d.$id === deckId);
            if (currentDeck) {
                setDeckTitle(currentDeck.title);
            }
        } catch (error) {
            console.error(error);
        }
    };

    async function fetchCards() {
        setIsLoading(true);
        try {
            const data = await flashcardServices.getFlashcards(deckId!);
            setFlashcards(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!frontText.trim() || !backText.trim() || !deckId) return;

        setIsAdding(true);
        try {
            const card = await flashcardServices.addFlashcard(deckId, frontText, backText);
            if (card) {
                setFlashcards([...flashcards, card]);
                setIsAddVisible(false);
                setFrontText('');
                setBackText('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (confirm("Delete this card forever?")) {
            try {
                const success = await flashcardServices.deleteFlashcard(cardId);
                if (success) {
                    setFlashcards(prev => prev.filter(c => c.$id !== cardId));
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!deckId) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-slate-300 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Invalid Access</h3>
                <p className="text-slate-500 mt-2">No deck identifier was provided for this clinical session.</p>
                <button onClick={() => router.back()} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Return to Laboratory</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/flashcards"
                            className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <ChevronLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1 italic">
                                {deckTitle} <span className="text-blue-600 italic">.</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {flashcards.length} Knowledge Assets Found
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddVisible(true)}
                        className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Study Action Banner */}
                {flashcards.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-[28px] flex items-center justify-center backdrop-blur-md">
                                <Zap size={32} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none mb-1 text-white">Ready for battle?</h3>
                                <p className="text-blue-100 font-medium text-xs">Simulate clinical questions with randomized shuffling.</p>
                            </div>
                        </div>
                        <Link
                            href={`/flashcards/study_session?deckId=${deckId}`}
                            className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-transform shadow-xl whitespace-nowrap"
                        >
                            Begin Session
                        </Link>
                    </motion.div>
                )}

                {/* Cards List */}
                {flashcards.length > 0 ? (
                    <div className="space-y-6">
                        {flashcards.map((card, index) => (
                            <motion.div
                                key={card.$id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Clinical Inquiry</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCard(card.$id)}
                                        className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-red-100 dark:border-red-800"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-relaxed mb-6">
                                    {card.front}
                                </h4>

                                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-6 rounded-2xl border-l-4 border-blue-600">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ClipboardCheck size={12} />
                                        Expected Outcome
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium italic text-sm leading-relaxed">
                                        {card.back}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] flex items-center justify-center mb-8 border border-white dark:border-slate-800 shadow-xl">
                            <PencilLine size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Deck Empty</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">This deck hasn't been populated with knowledge yet. Add your first card to begin prep.</p>
                        <button
                            onClick={() => setIsAddVisible(true)}
                            className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Plus size={18} />
                            Deploy First Card
                        </button>
                    </div>
                )}
            </div>

            {/* Add Card Modal */}
            <AnimatePresence>
                {isAddVisible && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-0 md:px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddVisible(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[48px] md:rounded-[48px] p-8 md:p-12 shadow-2xl relative z-10 border border-white dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 md:hidden" />

                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-2">New Asset</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Knowledge Quantization</p>
                                </div>
                                <button
                                    onClick={() => setIsAddVisible(false)}
                                    className="hidden md:flex w-12 h-12 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddCard} className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 ml-1">
                                        <MessageSquareQuote size={14} className="text-blue-600" />
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Card Front (Clinical Inquiry)</label>
                                    </div>
                                    <textarea
                                        placeholder="e.g. Describe the early signs of maternal shock during postpartum hemorrhage..."
                                        value={frontText}
                                        onChange={(e) => setFrontText(e.target.value)}
                                        className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 rounded-[32px] outline-none transition-all text-base font-bold min-h-[140px] resize-none shadow-inner"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 ml-1">
                                        <ClipboardCheck size={14} className="text-green-600" />
                                        <label className="text-[10px] font-black text-green-600 uppercase tracking-widest">Card Back (Clinical Outcome)</label>
                                    </div>
                                    <textarea
                                        placeholder="e.g. Tachycardia, Hypotension, Altered mental state, Pale/Cool skin..."
                                        value={backText}
                                        onChange={(e) => setBackText(e.target.value)}
                                        className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-600 rounded-[32px] outline-none transition-all text-base font-bold min-h-[140px] resize-none shadow-inner"
                                    />
                                </div>

                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-4">
                                    <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider leading-relaxed">
                                        Active Recall Tip: Focus on key medical terms and definitive clinical actions for better retention.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full py-6 bg-slate-900 dark:bg-blue-600 text-white rounded-[32px] font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isAdding ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Plus size={20} />
                                    )}
                                    {isAdding ? 'Quantizing...' : 'Deploy Knowledge Asset'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsAddVisible(false)}
                                    className="w-full py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 md:hidden"
                                >
                                    Dismiss Draft
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FlashcardListPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <FlashcardListContent />
        </Suspense>
    );
}
