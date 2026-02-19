'use client';

import { useState, useEffect, use } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { flashcardServices } from '@/services/flashcards';
import { Flashcard } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Flame,
    Play,
    CheckCircle2 as CircleCheck,
    XCircle,
    Timer,
    Shuffle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FlashcardStudyContent() {
    const searchParams = useSearchParams();
    const deckId = searchParams.get('deckId');
    const { user } = useAuthStore();
    const router = useRouter();

    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [deck, setDeck] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ mastered: 0, pending: 0 });
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [deckTitle, setDeckTitle] = useState('Study Session');

    useEffect(() => {
        if (!deckId) {
            // Prevent infinite loading if deckId is missing
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }

        async function fetchData() {
            try {
                // Fetch cards
                const data = await flashcardServices.getFlashcards(deckId!);
                setAllCards(data);
                setDeck(data);
                setStats({
                    mastered: 0, // We'll use this for 'Reviewed this session'
                    pending: data.length
                });

                // Fetch deck title
                if (user) {
                    const decks = await flashcardServices.getUserDecks(user.$id);
                    const currentDeck = decks.find(d => d.$id === deckId);
                    if (currentDeck) {
                        setDeckTitle(currentDeck.title);
                    }
                }

                // Check for saved session
                const savedIndex = localStorage.getItem(`fc_pos_${deckId}`);
                if (savedIndex && parseInt(savedIndex) > 0 && parseInt(savedIndex) < data.length) {
                    setShowResumeModal(true);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        if (deckId) fetchData();
    }, [deckId, user]);

    // Save progress
    useEffect(() => {
        if (user && currentIndex > 0 && deckId) {
            localStorage.setItem(`fc_pos_${deckId}`, currentIndex.toString());
        }
    }, [currentIndex, deckId, user]);

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

            // Update session stats
            setStats(prev => ({
                mastered: prev.mastered + 1,
                pending: Math.max(0, prev.pending - 1)
            }));

            nextCard();
        } catch (error) {
            console.error('Error updating mastery:', error);
            nextCard();
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex < deck.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // Completed session
                router.push(`/flashcards/deck?deckId=${deckId}`);
            }
        }, 150);
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
            }, 150);
        }
    };

    const resetSession = () => {
        if (deckId) localStorage.removeItem(`fc_pos_${deckId}`);
        setCurrentIndex(0);
        setShowResumeModal(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Assembling Deck Assets...</p>
            </div>
        );
    }

    if (!deckId || deck.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <XCircle size={64} className="text-slate-300 dark:text-slate-800 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {!deckId ? 'Invalid Access' : 'No Cards Found'}
                </h3>
                <p className="text-slate-500 font-medium mt-2">
                    {!deckId ? 'No deck identifier was provided.' : 'Add cards to this deck before starting a study session.'}
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest"
                >
                    Go Back
                </button>
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
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all shadow-sm shrink-0"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Live Session</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic line-clamp-1">
                                {deckTitle} <span className="text-blue-600 italic">.</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleShuffle}
                            className={`p-3 rounded-2xl border-2 transition-all ${isShuffled ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                            title="Shuffle Deck"
                        >
                            <Shuffle size={20} className={isShuffled ? 'animate-spin-slow' : ''} />
                        </button>
                        <button
                            onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}
                            className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                            title="Restart"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{currentIndex + 1} / {deck.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reviewed</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.mastered}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500">
                            <Timer size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Success Rate</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                {Math.round((stats.mastered / deck.length) * 100)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-12 overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    />
                </div>

                {/* 3D Flip Card */}
                <div className="perspective-1000 h-[450px] w-full cursor-pointer relative group" onClick={() => setIsFlipped(!isFlipped)}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ x: 300, opacity: 0 }}
                            animate={{
                                x: 0,
                                opacity: 1,
                                rotateY: isFlipped ? 180 : 0
                            }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{
                                duration: 0.6,
                                type: "spring",
                                stiffness: 200,
                                damping: 25
                            }}
                            className="w-full h-full relative preserve-3d"
                        >
                            {/* Card Front */}
                            <div className={`absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[40px] flex flex-col items-center justify-center p-12 text-center border-4 border-white dark:border-slate-800 shadow-2xl transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="absolute top-10 flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Clinical Query</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-relaxed tracking-tight max-h-full overflow-y-auto custom-scrollbar pr-2">
                                    {currentCard.front}
                                </h2>
                                <div className="absolute bottom-10 flex items-center gap-3 text-slate-400">
                                    <Play size={14} className="animate-pulse fill-current" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Reveal Clinical Outcome</p>
                                </div>
                            </div>

                            {/* Card Back */}
                            <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] flex flex-col items-center justify-center p-12 text-center transform rotate-y-180 border-4 border-white/20 shadow-2xl transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute top-10 flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full border border-white/20">
                                    <CircleCheck size={12} className="text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified Protocol</span>
                                </div>
                                <div className="custom-scrollbar overflow-y-auto max-h-[250px] w-full pr-2">
                                    <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed uppercase tracking-tight">
                                        {currentCard.back}
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
                                        className="flex-1 py-4 bg-white text-blue-600 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
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
                        onClick={prevCard}
                        disabled={currentIndex === 0}
                        className="w-16 h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 disabled:opacity-20 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="h-16 px-12 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all"
                    >
                        {isFlipped ? 'Show Query' : 'Reveal Outcome'}
                    </button>

                    <button
                        onClick={nextCard}
                        className="w-16 h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Resume Session Modal */}
            <AnimatePresence>
                {showResumeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetSession}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[48px] p-12 max-w-md w-full shadow-2xl border border-white dark:border-slate-800 text-center relative z-10"
                        >
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[35%] flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner">
                                <RotateCcw size={40} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">Resume Study?</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">You have a previous session saved for this deck. Would you like to pick up where you left off?</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={resetSession}
                                    className="py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Fresh Start
                                </button>
                                <button
                                    onClick={() => {
                                        const saved = localStorage.getItem(`fc_pos_${deckId}`);
                                        if (saved) setCurrentIndex(parseInt(saved));
                                        setShowResumeModal(false);
                                    }}
                                    className="py-5 bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
}

export default function FlashcardStudyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Session Reader...</p>
            </div>
        }>
            <FlashcardStudyContent />
        </Suspense>
    );
}
