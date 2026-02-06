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
   
    Settings,
    LogOut,
    ChevronRight,
    Mail,
    GraduationCap,
    Zap,
    Key,
    Bell,
    Phone,

    Sparkles,
    DownloadCloud
} from 'lucide-react';

export default function ProfilePage() {
    const { profile, user, logout } = useAuthStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

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

        // PWA Install Logic
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [user]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

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
                // Success celebration sequence
                setShowSuccess(true);

                // Refresh global profile state
                const { refreshProfile } = useAuthStore.getState();
                await refreshProfile();

                // Reload subscription status to reflect physical changes
                const updatedSub = await subscriptionServices.getSubscriptionStatus(user.$id);
                setSubscription(updatedSub);
                setAccessCode('');

                // Auto-dismiss success after 4 seconds
                setTimeout(() => setShowSuccess(false), 4000);
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
    const firstName = profile?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Nurse';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F5F7] pb-20">
            {/* Hero Profile Header */}
            <section className="bg-white border-b border-[#d5dde5] pt-20 pb-12 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden"
                    >
                        {profile?.profilePicture ? (
                            <img src={profile.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <span className="text-2xl font-bold text-[#2B669A] tracking-tight">
                                {(profile?.fullName || user?.name || 'N')
                                    .split(' ')
                                    .slice(0, 2)
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()}
                            </span>
                        )}
                    </motion.div>

                    <div className="text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold text-slate-800 tracking-tight"
                        >
                            {profile?.fullName || user?.name || 'NLC Learner'}
                        </motion.h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                            <span className="px-3 py-1 bg-blue-50 text-[#2B669A] rounded text-xs font-bold uppercase tracking-wide border border-blue-100">
                                {profile?.program ? formatProgram(profile.program) : 'Student'} Professional
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold uppercase tracking-wide border border-slate-200">
                                Since {new Date(user?.$createdAt || Date.now()).getFullYear()}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Subscription Card */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {isSubscriptionActive ? 'Premium Member' : 'Standard Member'}
                            </h3>
                            {isSubscriptionActive && subscription?.endDate && (
                                <p className="text-[#2B669A] font-medium text-sm mt-1">
                                    Expires: {new Date(subscription.endDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isSubscriptionActive ? 'bg-blue-50 text-[#2B669A]' : 'bg-slate-50 text-slate-400'}`}>
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Details */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Details</h3>
                            <User className="text-slate-400" size={18} />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Email</p>
                                    <p className="font-medium text-slate-900 text-sm truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                    <GraduationCap size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Phase</p>
                                    <p className="font-medium text-slate-900 text-sm">
                                        {profile?.yearOfStudy ? formatYear(profile.yearOfStudy) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Contact</p>
                                    <p className="font-medium text-slate-900 text-sm">
                                        {profile?.whatsappNumber || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isSubscriptionActive && (
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Activation</h3>
                                    <Key className="text-[#2B669A]" size={18} />
                                </div>
                                <p className="text-slate-500 text-xs mb-4">Redeem an access code to unlock features.</p>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="NLC-XXXX-XXXX"
                                            value={accessCode}
                                            onChange={(e) => handleAccessCodeChange(e.target.value)}
                                            className="w-full bg-transparent outline-none font-medium text-slate-900 text-sm uppercase"
                                        />
                                    </div>
                                    <button
                                        onClick={handleRedeem}
                                        disabled={!accessCode || isRedeeming}
                                        className="w-full py-3 bg-[#2B669A] hover:bg-[#1e4a72] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-md font-bold text-xs uppercase tracking-wide transition-all shadow-sm"
                                    >
                                        {isRedeeming ? 'Processing...' : 'Redeem Code'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Actions */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Settings</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-[#2B669A]" />
                                <span className="font-medium text-slate-700 text-sm">Notifications</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-[#2B669A]" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Settings size={18} className="text-slate-600" />
                                <span className="font-medium text-slate-700 text-sm">Preferences</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600" />
                        </button>

                        {isInstallable && (
                            <button
                                onClick={handleInstallClick}
                                className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <DownloadCloud size={18} className="text-[#2B669A]" />
                                    <div className="text-left">
                                        <span className="font-medium text-slate-700 text-sm block">Install Application</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#2B669A]" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full py-4 text-red-600 font-bold uppercase text-xs tracking-wider hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </main>

            {/* Premium Success Notification & Celebration */}
            <AnimatePresence>
                {showSuccess && (
                    <>
                        {/* Celebration Sparkles */}
                        <div className="fixed inset-0 pointer-events-none z-[60]">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        opacity: 1,
                                        scale: 0,
                                        x: "50vw",
                                        y: "50vh"
                                    }}
                                    animate={{
                                        opacity: 0,
                                        scale: Math.random() * 1.5 + 0.5,
                                        x: `${Math.random() * 100}vw`,
                                        y: `${Math.random() * 100}vh`,
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        ease: "easeOut"
                                    }}
                                    className="absolute w-4 h-4"
                                >
                                    <Sparkles
                                        className={i % 2 === 0 ? "text-blue-500" : "text-indigo-400"}
                                        fill="currentColor"
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className="fixed bottom-10 left-6 right-6 md:left-auto md:right-10 md:w-[450px] z-50"
                        >
                            <div className="bg-slate-900 border-2 border-blue-500/50 p-10 rounded-[45px] shadow-[0_25px_70px_rgba(37,99,235,0.4)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

                                <div className="flex items-center gap-8 relative z-10">
                                    <motion.div
                                        initial={{ rotate: -20, scale: 0.5 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", damping: 12 }}
                                        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30"
                                    >
                                        <ShieldCheck size={40} className="text-white" />
                                    </motion.div>
                                    <div>
                                        <h4 className="text-white font-black text-2xl italic uppercase tracking-tighter leading-none mb-2">Membership Active</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                            <p className="text-blue-400 font-black text-[10px] uppercase tracking-[4px]">NLC Premium Unlocked</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                    <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                                        "Your Premium Membership is now active. All institutional resources, flashcards, and e-books have been unlocked for your profile."
                                    </p>
                                </div>

                                <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: 0 }}
                                    transition={{ duration: 4, ease: "linear" }}
                                    className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
