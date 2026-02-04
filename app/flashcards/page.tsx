'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { flashcardServices } from '@/services/flashcards';
import { syncServices } from '@/services/sync';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Flashcard } from '@/types';

export default function FlashcardsPage() {
    const { profile } = useAuthStore();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCards() {
            try {
                const data = await flashcardServices.getFlashcards(profile?.program);
                setCards(data);
            } catch (error) {
                console.error('Error fetching cards:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCards();
    }, [profile?.program]);

    const handleMastery = async (mastered: boolean) => {
        const currentCard = cards[currentIndex];
        try {
            await flashcardServices.updateMasteryStatus(currentCard.$id, mastered);
            // Optionally update local state to reflect mastery
            const updatedCards = [...cards];
            updatedCards[currentIndex] = { ...currentCard, mastered };
            setCards(updatedCards);
            nextCard();
        } catch (error) {
            console.warn('Failed to update mastery, enqueuing:', error);
            await syncServices.enqueue('flashcard_mastery', {
                cardId: currentCard.$id,
                mastered
            });
            const updatedCards = [...cards];
            updatedCards[currentIndex] = { ...currentCard, mastered };
            setCards(updatedCards);
            nextCard();
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 150);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (cards.length === 0) return <div className="min-h-screen flex items-center justify-center">No cards found.</div>;

    const currentCard = cards[currentIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12 flex flex-col items-center">
            <div className="max-w-2xl w-full">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Review Deck</h1>
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{currentIndex + 1} / {cards.length}</span>
                    </div>
                </div>

                {/* 3D Flip Card Container */}
                <div className="perspective-1000 h-[400px] w-full cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                    <motion.div
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        className="w-full h-full relative transform-style-3d shadow-2xl rounded-[40px]"
                    >
                        {/* Front Side */}
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[40px] flex flex-col items-center justify-center p-10 text-center border-2 border-white dark:border-slate-800">
                            <span className="absolute top-8 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{currentCard.category}</span>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentCard.question}</h2>
                            <p className="absolute bottom-8 text-xs font-bold text-slate-400 uppercase tracking-tighter">Tap to reveal answer</p>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 backface-hidden bg-blue-600 rounded-[40px] flex flex-col items-center justify-center p-10 text-center transform rotate-y-180 border-2 border-blue-500">
                            <span className="absolute top-8 px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-2">Verified Outcome</span>
                            <h2 className="text-2xl font-medium text-white leading-relaxed">{currentCard.answer}</h2>
                            <div className="absolute bottom-8 flex gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMastery(false); }}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase text-white transition-colors border border-white/20"
                                >
                                    Needs Review
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMastery(true); }}
                                    className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase transition-transform hover:scale-105"
                                >
                                    Mastered
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mt-12">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevCard(); }}
                        className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                        className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                    >
                        Flip Card
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextCard(); }}
                        className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
