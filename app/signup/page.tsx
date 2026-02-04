'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account, databases, config } from '@/lib/appwrite';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion } from 'framer-motion';
import { ID } from 'appwrite';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [program, setProgram] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { checkSession } = useAuthStore();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Create Account
            const user = await account.create(ID.unique(), email, password, name);

            // 2. Create Session
            await account.createEmailPasswordSession(email, password);

            // 3. Create Profile Document
            await databases.createDocument(
                config.databaseId,
                config.profilesCollectionId,
                ID.unique(),
                {
                    userId: user.$id,
                    name: name,
                    email: email,
                    program: program,
                    subscriptionStatus: 'none',
                    isAdmin: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            );

            await checkSession();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-blue-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col items-center mb-6">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-center px-4">Begin your journey towards professional nursing excellence.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider text-[10px]">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="Florence Nightingale"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider text-[10px]">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="florence@hospital.org"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider text-[10px]">Program</label>
                                    <select
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white appearance-none"
                                        required
                                    >
                                        <option value="">Select Specialization</option>
                                        <option value="RN">Registered Nursing (RN)</option>
                                        <option value="RM">Registered Midwifery (RM)</option>
                                        <option value="PHN">Public Health Nursing (PHN)</option>
                                        <option value="EN">Enrolled Nursing (EN)</option>
                                        <option value="EM">Enrolled Midwifery (EM)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider text-[10px]">Security Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 uppercase tracking-widest text-xs"
                            >
                                {isLoading ? 'Processing Registration...' : 'Create Professional Account'}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Already have an account?{' '}
                            <a href="/login" title="login" className="text-blue-600 hover:text-blue-500 font-black">Sign In</a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
