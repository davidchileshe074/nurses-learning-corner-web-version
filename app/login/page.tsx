"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ChevronRight, Fingerprint, Activity } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { checkSession } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await account.createEmailPasswordSession(email, password);
            await checkSession();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Authentication sequence failed.');
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
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] dark:opacity-[0.05]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                    <header className="mb-14">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center p-3 shadow-lg border border-slate-100 dark:border-slate-800 mb-8">
                            <img src="/logo.svg" alt="NLC Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic leading-none uppercase">
                            Nurse Corner
                        </h1>
                        <p className="text-slate-400 font-medium text-lg mt-2 leading-relaxed">Your expert companion in excellence</p>
                    </header>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-10 p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-2xl flex items-center gap-4"
                        >
                            <p className="text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-[25px] outline-none transition-all font-bold text-slate-900 dark:text-white text-lg"
                                placeholder="nurse@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Password
                                </label>
                                <Link href="/forgot-password" title="Recover Access" className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-500 underline underline-offset-4 decoration-2">Forgot Password?</Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-[25px] outline-none transition-all font-bold text-slate-900 dark:text-white text-lg"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black uppercase text-xs tracking-[0.5em] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all flex items-center justify-center group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    Synchronizing...
                                </div>
                            ) : (
                                <span className="flex items-center gap-3">
                                    Sign In
                                    <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-16 pt-10 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                        <Link href="/signup" title="Create Account" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose mx-auto">
                            Don't have an account? <span className="text-blue-600 font-black ml-2 hover:text-blue-500 underline underline-offset-4 decoration-2">Create One</span>
                        </Link>
                    </div>
                </div>

                <p className="text-center mt-12 text-[9px] font-black text-slate-400 uppercase tracking-[0.7em] opacity-40">
                    Nurse Learning Corner . Clinical Intelligence Network
                </p>
            </motion.div>
        </div>
    );
}
