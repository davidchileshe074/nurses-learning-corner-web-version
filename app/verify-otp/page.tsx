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

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [tempUserId, setTempUserId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const sendCode = async () => {
            if (!email) return;
            try {
                const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
                setTempUserId(token.userId);
            } catch (err: any) {
                console.error("Failed to send code", err);
            }
        };

        if (email && !tempUserId) {
            sendCode();
        }
    }, [email, user?.$id]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        if (data.every(char => /^\d$/.test(char))) {
            const newCode = Array(6).fill('');
            data.forEach((char, i) => newCode[i] = char);
            setCode(newCode);
            document.getElementById(`otp-${Math.min(data.length, 5)}`)?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await verifyEmailOTP(tempUserId || user?.$id || 'current', fullCode);

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
                        const { getWebDeviceId } = await import('@/services/device');
                        const deviceId = getWebDeviceId();

                        await databases.updateDocument(
                            config.databaseId,
                            config.profilesCollectionId,
                            profiles.documents[0].$id,
                            {
                                verified: true,
                                deviceId: deviceId,
                                updatedAt: new Date().toISOString()
                            }
                        );
                    }
                } catch (dbError) {
                    console.error("DB Update failed", dbError);
                }

                await refreshProfile();
                setSuccess('Security verification finalized');

                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                throw new Error("Security handshake failed");
            }
        } catch (err: any) {
            setError(err.message || 'The provided security code is invalid or has expired.');
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
            setSuccess('Secondary authentication code dispatched');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to dispatch new code.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] p-4 font-sans selection:bg-blue-600/20">
            {/* Ultra-Modern Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-lg z-10"
            >
                {/* Brand Identity */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-[#2B669A] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">
                        Nurse Corner <span className="text-[#2B669A]">Security</span>
                    </span>
                </div>

                <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 md:p-14 relative group overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                        <motion.div
                            initial={{ width: "33.3%" }}
                            animate={{ width: success ? "100%" : "66.6%" }}
                            className="h-full bg-[#2B669A] transition-all duration-1000"
                        />
                    </div>

                    <header className="mb-12 text-center">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
                            Identify <span className="text-[#2B669A]">Verification</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">
                            A secure clinical access code has been dispatched to:
                            <br />
                            <span className="text-slate-900 font-bold underline decoration-blue-600/30 decoration-2 underline-offset-4">{email}</span>
                        </p>
                    </header>

                    <AnimatePresence mode="wait">
                        {success && !resendLoading && !error ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-6"
                            >
                                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-600 shadow-xl shadow-green-200/50">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Authenticated</h3>
                                <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse uppercase">Finalizing clinical environment...</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-10">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3"
                                    >
                                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-xs font-bold text-red-700 uppercase tracking-tight leading-normal">
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                <div className="space-y-6">
                                    <div className="flex justify-between gap-2 md:gap-4" onPaste={handlePaste}>
                                        {code.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`otp-${idx}`}
                                                type="text"
                                                inputMode="numeric"
                                                value={digit}
                                                onChange={(e) => handleChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                className={`w-full h-16 md:h-20 bg-slate-50 border-2 rounded-2xl text-center text-3xl font-black text-slate-900 shadow-sm transition-all focus:bg-white outline-none ${digit ? 'border-[#2B669A]' : 'border-slate-100 focus:border-[#2B669A]'}`}
                                                placeholder="•"
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <Lock size={10} />
                                            End-to-End Encrypted
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Expires in: 14:59
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="submit"
                                        disabled={loading || code.join('').length < 6}
                                        className="w-full py-5 bg-slate-900 hover:bg-[#2B669A] text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center group disabled:opacity-30 disabled:hover:bg-slate-900"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span className="opacity-70 italic tracking-widest">Verifying Identity...</span>
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-3">
                                                Verify Credentials
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resendLoading}
                                            className="inline-flex items-center gap-2 group"
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${resendLoading ? 'text-slate-300' : 'text-slate-400 group-hover:text-[#2B669A]'}`}>
                                                {resendLoading ? 'Dispatched' : "Haven't received the code?"}
                                            </span>
                                            {!resendLoading && <span className="text-[10px] font-black text-[#2B669A] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Resend</span>}
                                            {resendLoading && <RefreshCw size={12} className="text-slate-300 animate-spin" />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.4em] italic">
                        Standards of clinical excellence
                    </p>
                    <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-50"></div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F5F7]">
                <div className="w-12 h-12 border-4 border-[#2B669A] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Security...</p>
            </div>
        }>
            <VerifyOTPForm />
        </Suspense>
    );
}
