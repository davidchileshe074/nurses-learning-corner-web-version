"use client"
import { useState } from 'react';
import { account } from '@/lib/appwrite';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Key, Mail, ChevronLeft, ShieldCheck, Activity, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const url = `${window.location.origin}/reset-password`;
            await account.createRecovery(email, url);
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Recovery sequence failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Architecture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/[0.03] rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[60px] shadow-3xl border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                    <header className="mb-12">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center p-3 shadow-lg border border-slate-100 dark:border-slate-800 mb-8">
                            <img src="/logo.svg" alt="NLC Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic leading-none uppercase">
                            Reset Access
                        </h1>
                        <p className="text-slate-400 font-medium text-lg mt-2 leading-relaxed">Enter your email to receive recovery instructions.</p>
                    </header>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="mb-10 p-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-3xl text-left">
                                    <h3 className="text-blue-600 font-black uppercase tracking-widest text-xs mb-2">Instructions Sent</h3>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                        Recovery instructions have been dispatched to <span className="font-bold italic text-blue-600">{email}</span>.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <ChevronLeft size={16} />
                                    Return to Login
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-2xl flex items-center gap-4"
                                    >
                                        <p className="text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Verified Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-3xl outline-none transition-all font-bold text-slate-900 dark:text-white"
                                        placeholder="nurse@example.com"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            Send Recovery Link
                                            <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                    )}
                                </button>

                                <div className="text-center">
                                    <Link href="/login" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                        <ChevronLeft size={14} />
                                        Cancel Recovery
                                    </Link>
                                </div>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] opacity-40">
                    Nurse Learning Corner . Clinical Intelligence Network
                </p>
            </motion.div>
        </div>
    );
}
