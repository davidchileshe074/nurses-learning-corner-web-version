"use client"
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Lock, ChevronRight, ShieldCheck, Activity, Key, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Operational error: Credentials do not match.');
            return;
        }

        if (!userId || !secret) {
            setError('Authorization error: Invalid or expired restoration link.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await account.updateRecovery(userId, secret, password);
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Restoration sequence failed. Link may be invalidated.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Architecture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/[0.03] rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-3xl border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                    <header className="mb-12">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center p-3 shadow-lg border border-slate-100 dark:border-slate-800 mb-8">
                            <img src="/logo.svg" alt="NLC Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                            Reset Access
                        </h1>
                        <p className="text-slate-400 font-medium text-lg mt-4">Provision new secure access credentials.</p>
                    </header>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="mb-10 p-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-3xl text-left">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle size={18} className="text-green-600" />
                                        <h3 className="text-green-600 font-black uppercase tracking-widest text-xs">Identity Restored</h3>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                        Your access credentials have been successfully re-provisioned. You may now authenticate with your new identity.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-4 px-12 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Login with New Key
                                    <ChevronRight size={16} />
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-8">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-2xl flex items-center gap-4"
                                    >
                                        <p className="text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Key size={12} />
                                            New Access Key (8+ Characters)
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-3xl outline-none transition-all font-bold text-slate-900 dark:text-white"
                                            placeholder="••••••••••••"
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <ShieldCheck size={12} />
                                            Verify Identity Protocol (Re-enter)
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-3xl outline-none transition-all font-bold text-slate-900 dark:text-white"
                                            placeholder="••••••••••••"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[30px] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Updating Vault...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            Commit New Key
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">
                    Nurse Learning Corner . Clinical Intelligence Network
                </p>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Recovery State...</p>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
