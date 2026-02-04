'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
    {
        title: "Intelligent Library",
        description: "Access curated medical manuals, e-books, and study guides tailored to your nursing program.",
        icon: (
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        )
    },
    {
        title: "Flashcard Mastery",
        description: "Memorize complex clinical concepts with our 3D active recall engine. Track what you've mastered.",
        icon: (
            <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        title: "Digital Notebook",
        description: "Take clinical notes directly alongside your study materials. Safe, secure, and always synced.",
        icon: (
            <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    }
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col items-center"
                    >
                        <div className="mb-12 relative">
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                            <div className="relative z-10 w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-[45px] flex items-center justify-center shadow-2xl border border-white dark:border-slate-800">
                                {STEPS[currentStep].icon}
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">
                            {STEPS[currentStep].title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">
                            {STEPS[currentStep].description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="flex gap-2 justify-center mb-12">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-500 ${currentStep === i ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleNext}
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95"
                    >
                        {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
                    </button>

                    <Link
                        href="/login"
                        className="block w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-blue-600 transition-colors"
                    >
                        Skip Walkthrough
                    </Link>
                </div>
            </div>
        </div>
    );
}
