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
                        <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
                        <p className="text-slate-500 text-sm mt-1">Access your professional dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-3">
                            <div className="text-red-600 text-xs font-bold uppercase tracking-wide">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    Password
                                </label>
                                <Link href="/forgot-password" title="Recover Access" className="text-xs font-medium text-[#2B669A] hover:underline">Forgot password?</Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-sm uppercase tracking-wide shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            Don't have an account? <Link href="/signup" title="Create Account" className="text-[#2B669A] font-bold hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
