'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-3.674m0 0L3 21m0-18l18 18" />
                    </svg>
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Connection Lost</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                    It seems you&apos;re currently offline. You can still access your <span className="text-blue-600 font-bold">Downloaded Resources</span> in the library.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/library"
                        className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Go to Offline Library
                    </Link>

                    <button
                        onClick={() => window.location.reload()}
                        className="block w-full py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
