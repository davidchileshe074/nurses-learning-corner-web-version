'use client';

import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Shuffle,
    Trophy,
    Flame,
    CheckCircle2,
    XCircle,
    Play,
    Timer
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Flashcard } from '@/types';
import { useState,useEffect } from 'react';
import { flashcardServices } from '@/services/flashcards';
import { syncServices } from '@/services/sync';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlashcardsPage() {
    const { profile, user } = useAuthStore();
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [deck, setDeck] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ mastered: 0, pending: 0 });
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);

    useEffect(() => {
        async function fetchCards() {
            try {
                const data = await flashcardServices.getFlashcards(profile?.program);
                setAllCards(data);
                setDeck(data);
                setStats({
                    mastered: data.filter(c => c.mastered).length,
                    pending: data.filter(c => !c.mastered).length
                });

                // Check for saved session
                const savedIndex = localStorage.getItem(`flashcard_session_${user?.$id}`);
                if (savedIndex && parseInt(savedIndex) > 0 && parseInt(savedIndex) < data.length) {
                    setShowResumeModal(true);
                }
            } catch (error) {
                console.error('Error fetching cards:', error);
            } finally {
                setIsLoading(false);
            }
        }
        if (user) fetchCards();
    }, [profile?.program, user]);

    // Save progress
    useEffect(() => {
        if (user && currentIndex > 0) {
            localStorage.setItem(`flashcard_session_${user.$id}`, currentIndex.toString());
        }
    }, [currentIndex, user]);

    const handleShuffle = () => {
        const newIsShuffled = !isShuffled;
        setIsShuffled(newIsShuffled);
        if (newIsShuffled) {
            const shuffled = [...deck].sort(() => Math.random() - 0.5);
            setDeck(shuffled);
        } else {
            setDeck(allCards);
        }
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const handleMastery = async (mastered: boolean) => {
        const currentCard = deck[currentIndex];
        try {
            await flashcardServices.updateMasteryStatus(currentCard.$id, mastered);

            // Update stats
            setStats(prev => ({
                mastered: mastered ? prev.mastered + (currentCard.mastered ? 0 : 1) : prev.mastered - (currentCard.mastered ? 1 : 0),
                pending: mastered ? prev.pending - (currentCard.mastered ? 0 : 1) : prev.pending + (currentCard.mastered ? 1 : 0)
            }));

            nextCard();
        } catch (error) {
            console.warn('Sync delayed, using offline mode');
            await syncServices.enqueue('flashcard_mastery', { cardId: currentCard.$id, mastered });
            nextCard();
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % deck.length);
        }, 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
        }, 150);
    };

    const resetSession = () => {
        localStorage.removeItem(`flashcard_session_${user?.$id}`);
        setCurrentIndex(0);
        setShowResumeModal(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Preparing Deck...</p>
            </div>
        );
    }

    if (deck.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <XCircle size={64} className="text-slate-300 dark:text-slate-800 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Cards Available</h3>
                <p className="text-slate-500 font-medium mt-2">Check back later for updated medical decks.</p>
            </div>
        );
    }

    const currentCard = deck[currentIndex];
    const progress = ((currentIndex + 1) / deck.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12 flex flex-col items-center transition-all">
            <div className="max-w-3xl w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active Revision</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Medical <span className="text-indigo-500 italic">Quest .</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleShuffle}
                            className={`p-3 rounded-2xl border-2 transition-all ${isShuffled ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                            title="Shuffle Deck"
                        >
                            <Shuffle size={20} className={isShuffled ? 'animate-spin-slow' : ''} />
                        </button>
                        <button
                            onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}
                            className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all shadow-sm"
                            title="Restart"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{currentIndex + 1} / {deck.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mastered</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.mastered}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
                            <Timer size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subject</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px]">{currentCard.category || 'Clinical'}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-12 overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                    />
                </div>

                {/* 3D Flip Card */}
                <div className="perspective-1000 h-[450px] w-full cursor-pointer relative group" onClick={() => setIsFlipped(!isFlipped)}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ x: 300, opacity: 0, rotateY: 0 }}
                            animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
                            className="w-full h-full relative transform-style-3d shadow-2xl rounded-[40px]"
                        >
                            {/* Card Front */}
                            <div className="absolute inset-0 backface-hidden glass dark:bg-slate-900 rounded-[40px] flex flex-col items-center justify-center p-12 text-center border-4 border-white dark:border-slate-800">
                                <span className="absolute top-10 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-900/50">
                                    {currentCard.category || 'Anatomy'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                    {currentCard.question}
                                </h2>
                                <div className="absolute bottom-10 flex items-center gap-2 text-slate-400">
                                    <Play size={14} className="animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-widest">Tap to reveal answer</p>
                                </div>
                            </div>

                            {/* Card Back */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] flex flex-col items-center justify-center p-12 text-center transform rotate-y-180 border-4 border-white/20">
                                <div className="absolute top-10 flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full border border-white/20">
                                    <CheckCircle2 size={12} className="text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Clinical Outcome</span>
                                </div>
                                <div className="custom-scrollbar overflow-y-auto max-h-[250px] w-full">
                                    <h2 className="text-2xl font-bold text-white leading-relaxed">
                                        {currentCard.answer}
                                    </h2>
                                </div>

                                <div className="absolute bottom-10 flex gap-4 w-full px-12">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMastery(false); }}
                                        className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-3xl text-[10px] font-black uppercase text-white transition-all border border-white/20 backdrop-blur-md flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={16} />
                                        Review
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMastery(true); }}
                                        className="flex-1 py-4 bg-white text-indigo-600 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <Trophy size={16} />
                                        Mastered
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Session Controls */}
                <div className="flex items-center justify-center gap-8 mt-12">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevCard(); }}
                        className="w-16 h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                        className="h-16 px-10 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
                    >
                        {isFlipped ? 'Show Question' : 'Reveal Answer'}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextCard(); }}
                        className="w-16 h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Resume Session Modal */}
            <AnimatePresence>
                {showResumeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-white dark:border-slate-800 text-center"
                        >
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[35%] flex items-center justify-center mx-auto mb-6 text-indigo-600">
                                <RotateCcw size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Resume Quest?</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">You were studying this deck previously. Would you like to pick up where you left off?</p>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button
                                    onClick={resetSession}
                                    className="py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Fresh Start
                                </button>
                                <button
                                    onClick={() => {
                                        const saved = localStorage.getItem(`flashcard_session_${user?.$id}`);
                                        if (saved) setCurrentIndex(parseInt(saved));
                                        setShowResumeModal(false);
                                    }}
                                    className="py-4 bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
