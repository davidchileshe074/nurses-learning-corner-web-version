"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { sendEmailOTP, verifyEmailOTP, getCurrentUser } from '@/services/auth';
import { databases, config } from '@/lib/appwrite';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, ChevronRight, AlertCircle, RefreshCw, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Query } from 'appwrite';

function VerifyOTPForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshProfile } = useAuthStore();

    // Get email from search params or current user
    const paramEmail = searchParams.get('email');
    const email = user?.email || paramEmail;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [tempUserId, setTempUserId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const sendCode = async () => {
            if (!email) return;
            // Avoid sending immediately if we suspect it was already sent by signup/login flow
            // But if we are here, likely we need a code.
            // We can check searchParams for 'sent=true' if we wanted.
            // For now, let's trigger it if we don't have a tempUserId and not verified.

            try {
                const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
                setTempUserId(token.userId);
            } catch (err: any) {
                console.error("Failed to send code", err);
            }
        };

        // Only send if we have an email and haven't sent yet in this session (simplified)
        // Ideally we check if 'code' was just sent.
        if (email && !tempUserId) {
            sendCode();
        }
    }, [email, user?.$id]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await verifyEmailOTP(tempUserId || user?.$id || 'current', code);

            const freshAccount = await getCurrentUser();
            const targetId = freshAccount?.$id || user?.$id;

            if (targetId) {
                try {
                    const profiles = await databases.listDocuments(
                        config.databaseId,
                        config.profilesCollectionId,
                        [Query.equal("userId", targetId)]
                    );

                    if (profiles.documents.length > 0) {
                        await databases.updateDocument(
                            config.databaseId,
                            config.profilesCollectionId,
                            profiles.documents[0].$id,
                            { verified: true }
                        );
                    }
                } catch (dbError) {
                    console.error("DB Update failed", dbError);
                }

                await refreshProfile();
                setSuccess('Account verified successfully!');

                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                throw new Error("Could not retrieve user session");
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Code may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setResendLoading(true);
        setError('');
        try {
            const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
            setTempUserId(token.userId);
            setSuccess('A new verification code has been sent.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setResendLoading(false);
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

                    <header className="mb-10 text-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center p-3 shadow-lg border border-blue-100 dark:border-blue-800/50 mx-auto mb-6">
                            <Mail className="text-blue-600 dark:text-blue-400" size={36} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-3">
                            Verify Email
                        </h1>
                        <p className="text-slate-500 font-medium text-base">
                            Enter the 6-digit code sent to <br />
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{email || 'your email'}</span>
                        </p>
                    </header>

                    <AnimatePresence mode="wait">
                        {success && !resendLoading && success !== 'A new verification code has been sent.' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="mb-6 inline-flex items-center justifying-center p-4 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600">
                                    <CheckCircle size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verified!</h3>
                                <p className="text-slate-500">Redirecting to dashboard...</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-8">
                                {(error || (success && success === 'A new verification code has been sent.')) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-2xl flex items-center gap-3 ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}
                                    >
                                        {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                                        <p className="text-xs font-bold uppercase tracking-wide">{error || success}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            className="w-full h-20 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-3xl outline-none transition-all font-black text-center text-4xl tracking-[0.5em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                            placeholder="000000"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Security Code Validity: 15 Minutes
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || code.length < 6}
                                    className="w-full py-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[30px] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Verifying...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            Verify Identity
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendLoading}
                                        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        {resendLoading ? (
                                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        Resend Code
                                    </button>
                                </div>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">
                    Nurse Learning Corner . Clinical Security
                </p>
            </motion.div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <VerifyOTPForm />
        </Suspense>
    );
}
