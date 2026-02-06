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
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-slate-50 rounded-lg flex items-center justify-center mb-4">
                            <img src="/logo.svg" alt="NLC Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Reset Access</h1>
                        <p className="text-slate-500 text-sm mt-1">Enter your email to receive recovery instructions.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-[#2B669A] rounded text-left">
                                    <h3 className="text-[#2B669A] font-bold text-xs uppercase tracking-wide mb-1">Instructions Sent</h3>
                                    <p className="text-slate-600 text-sm">
                                        Recovery instructions have been dispatched to <span className="font-bold text-[#2B669A]">{email}</span>.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="w-full inline-flex items-center justify-center py-2.5 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-sm uppercase tracking-wide shadow-sm transition-all"
                                >
                                    Return to Login
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-3">
                                        <p className="text-red-600 text-xs font-bold uppercase tracking-wide">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        Verified Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="nurse@example.com"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-sm uppercase tracking-wide shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Sending...' : 'Send Recovery Link'}
                                </button>

                                <div className="text-center">
                                    <Link href="/login" className="text-xs font-medium text-slate-500 hover:text-[#2B669A] flex items-center justify-center gap-1">
                                        <ChevronLeft size={14} />
                                        Cancel Recovery
                                    </Link>
                                </div>
                            </form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
