'use client';

import { useAuthStore } from '@/hooks/useAuthStore';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { profile, user, logout } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center">
            <div className="max-w-xl w-full">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-blue-600/20">
                        {profile?.name?.[0] || user?.name?.[0] || 'M'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{profile?.name || user?.name || 'Medical Student'}</h1>
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">{profile?.program || 'RN Candidate'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Account Information</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Email</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Subscription</span>
                                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {profile?.subscriptionStatus || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Settings</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">Push Notifications</span>
                                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </button>
                            <button className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">Dark Mode</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">System</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-[30px] font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-colors border-2 border-transparent hover:border-red-200"
                    >
                        Secure Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
