"use client"
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { subscriptionServices } from '@/services/subscription';
import { Subscription } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatProgram, formatYear } from '@/lib/formatters';
import {
    User,
    ShieldCheck,
    CreditCard,
    Settings,
    LogOut,
    ChevronRight,
    Mail,
    GraduationCap,
    Clock,
    Zap,
    Key,
    Bell,
    Phone
} from 'lucide-react';

export default function ProfilePage() {
    const { profile, user, logout } = useAuthStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        async function loadProfileData() {
            if (!user) return;
            setIsLoading(true);
            try {
                const sub = await subscriptionServices.getSubscriptionStatus(user.$id);
                setSubscription(sub);
            } catch (error) {
                console.error('Error loading subscription:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProfileData();
    }, [user]);

    const handleAccessCodeChange = (val: string) => {
        // Just allow alphanumeric and hyphens, preserve characters
        setAccessCode(val.toUpperCase());
    };

    const handleRedeem = async () => {
        if (!accessCode || !user) return;
        setIsRedeeming(true);
        try {
            // INTEGRATION: Bridge between Cloud Functions and Direct DB for High-Fidelity Redemption
            const { accessCodeServices } = await import('@/services/accessCodes');
            const result = await accessCodeServices.validateAndRedeem(accessCode, user.$id);

            if (result.success) {
                alert(`✨ ${result.message}`);

                // Reload subscription status to reflect physical changes
                const updatedSub = await subscriptionServices.getSubscriptionStatus(user.$id);
                setSubscription(updatedSub);
                setAccessCode('');
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            alert(error.message || 'The secure clinical bridge failed to authorize your credential.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const isSubscriptionActive = subscriptionServices.checkSubscriptionExpiry(subscription);
    const firstName = profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Nurse';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Hero Profile Header */}
            <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-20 pb-12 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[45px] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-blue-600/30 relative group"
                    >
                        {firstName[0]}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-50 dark:border-slate-950 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={20} className="text-blue-600" />
                        </div>
                    </motion.div>

                    <div className="text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic"
                        >
                            {profile?.name || user?.name || 'Chief Clinical Expert'}
                        </motion.h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                                {profile?.program ? formatProgram(profile.program) : 'Student'} Professional
                            </span>
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Member since {new Date(user?.$createdAt || Date.now()).getFullYear()}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
                {/* Subscription Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-blue-400 font-black text-[9px] uppercase tracking-[4px] mb-2">Access Status</p>
                            <h3 className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none">
                                {isSubscriptionActive ? 'Clinical Pro Active' : 'Trial Membership'}
                            </h3>
                            {subscription?.endDate && (
                                <p className="text-slate-400 text-xs font-black mt-3 uppercase tracking-widest">
                                    Expires: {new Date(subscription.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-white font-black text-xl leading-none">
                                    {isSubscriptionActive ? 'VALID' : 'EXPIRED'}
                                </p>
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Verified License</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isSubscriptionActive ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-red-600/20 border-red-600 text-red-400'}`}>
                                <Zap size={24} className={isSubscriptionActive ? 'animate-pulse' : ''} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Account Details */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Credentials</h3>
                            <User className="text-slate-300" size={20} />
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Email</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <GraduationCap size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Academic Phase</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                                        {profile?.yearOfStudy ? formatYear(profile.yearOfStudy) : 'Not Specified'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WhatsApp Telemetry</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                                        {profile?.whatsappNumber || 'Not Connected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Codes */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Redeem Access</h3>
                            <Key className="text-blue-600" size={20} />
                        </div>
                        <p className="text-slate-500 text-xs font-medium mb-6">Enter your clinical access code to unlock institutional resources.</p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="XXXX - XXXX - XXXX"
                                value={accessCode}
                                onChange={(e) => handleAccessCodeChange(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-black text-center tracking-[0.2em] text-sm uppercase"
                            />
                            <button
                                onClick={handleRedeem}
                                disabled={!accessCode || isRedeeming}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-[4px] transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center"
                            >
                                {isRedeeming ? 'Validating...' : 'Unlock Material'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Actions */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-4">System Configurations</p>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                    <Bell size={18} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Notifications Management</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
                                    <Settings size={18} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Clinical Display Settings</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full py-6 text-red-500 font-black uppercase text-[10px] tracking-[5px] hover:bg-red-50 dark:hover:bg-red-950/20 rounded-[35px] transition-colors flex items-center justify-center gap-3 border-2 border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                    <LogOut size={16} />
                    Secure Logout
                </button>
            </main>
        </div>
    );
}
