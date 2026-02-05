"use client"
import { motion } from 'framer-motion';
import Link from 'next/link';
import { WifiOff, RefreshCcw, BookOpen, ChevronRight } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center relative overflow-hidden">
            {/* Background Decorative Blur */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-[45px] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative group">
                    <div className="absolute inset-0 bg-blue-600/10 rounded-[45px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <WifiOff size={48} className="text-blue-600 relative z-10" />
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter italic">Signal Loss <span className="text-blue-600">.</span></h1>
                <p className="text-slate-500 dark:text-slate-400 mb-12 font-medium text-lg leading-relaxed px-4">
                    Clinical systems are detecting a connectivity gap. Access your <span className="text-blue-600 font-bold italic uppercase">Offline Vault</span> for uninterrupted study.
                </p>

                <div className="space-y-4 px-4">
                    <Link
                        href="/downloads"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all group"
                    >
                        <BookOpen size={18} />
                        Access Offline Vault
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-3 w-full py-5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-500 rounded-3xl font-black uppercase text-xs tracking-[0.2em] border-2 border-slate-100 dark:border-slate-800 hover:border-blue-600/30 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCcw size={18} />
                        Sync Connection
                    </button>
                </div>

                <div className="mt-16">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Nurse Learning Corner . Clinical Intelligence</p>
                </div>
            </motion.div>
        </div>
    );
}
