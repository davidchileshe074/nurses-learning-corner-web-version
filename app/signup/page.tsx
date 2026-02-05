"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account, databases, config } from '@/lib/appwrite';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion } from 'framer-motion';
import { ID } from 'appwrite';
import { UserPlus, Mail, Lock, ChevronRight, GraduationCap, User, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [program, setProgram] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { checkSession } = useAuthStore();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

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
                    whatsappNumber: whatsappNumber,
                    yearOfStudy: yearOfStudy,
                    subscriptionStatus: 'none',
                    isAdmin: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            );

            await checkSession();

            // 4. Handle Access Code (Optional)
            if (accessCode.trim()) {
                try {
                    const { accessCodeServices } = await import('@/services/accessCodes');
                    await accessCodeServices.validateAndRedeem(accessCode, user.$id);
                    console.log('[Signup] Access code redeemed successfully.');
                } catch (codeErr: any) {
                    console.warn('[Signup] Access code redemption failed, but account was created:', codeErr.message);
                    // We don't block registration if the optional code fails, 
                    // but we might want to notify the user later.
                }
            }

            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Registration sequence interrupted.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Architecture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] dark:opacity-[0.05]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl relative z-10"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[60px] shadow-3xl border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                    <header className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={16} className="text-blue-600 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Register</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic leading-tight">
                            Create Account
                        </h1>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed">Join us to access your specialized nursing curriculum.</p>
                    </header>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-2xl flex items-center gap-4"
                        >
                            <p className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-10">
                        {/* Section 1: Personal Information */}
                        <div>
                            <div className="flex items-center mb-6">
                                <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Personal Information</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm"
                                        placeholder="e.g. Sarah Phiri"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm"
                                        placeholder="student@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm"
                                        placeholder="+260 97..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Security */}
                        <div>
                            <div className="flex items-center mb-6">
                                <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Security</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm"
                                    placeholder="Min 8 characters"
                                    required
                                />
                            </div>
                        </div>

                        {/* Section 3: Academic Profile */}
                        <div>
                            <div className="flex items-center mb-6">
                                <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Academic Profile</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                                    <select
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Program</option>
                                        <option value="REGISTERED-NURSING">Registered Nursing</option>
                                        <option value="MIDWIFERY">Midwifery</option>
                                        <option value="PUBLIC-HEALTH">Public Health Nursing</option>
                                        <option value="MENTAL-HEALTH">Mental Health Nursing</option>
                                        <option value="ONCOLOGY">Oncology Nursing</option>
                                        <option value="PAEDIATRIC">Paediatric Nursing</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year of Study</label>
                                    <select
                                        value={yearOfStudy}
                                        onChange={(e) => setYearOfStudy(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        <option value="YEAR1">Year 1</option>
                                        <option value="YEAR2">Year 2</option>
                                        <option value="YEAR3">Year 3</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Institutional Access (Optional) */}
                        <div>
                            <div className="flex items-center mb-6">
                                <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Access Credentials</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Code (Optional)</label>
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, '').slice(0, 12);
                                        const parts = val.match(/.{1,4}/g) || [];
                                        setAccessCode(parts.join('-'));
                                    }}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all font-black text-center tracking-[0.3em] text-slate-900 dark:text-white text-sm"
                                    placeholder="XXXX-XXXX-XXXX"
                                />
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">Institutions may provide these for premium access.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black uppercase text-xs tracking-[0.5em] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all flex items-center justify-center group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : (
                                <span className="flex items-center gap-3">
                                    Sign Up
                                    <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>


                    <div className="mt-14 pt-10 border-t border-slate-50 dark:border-slate-800 text-center">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            Already have an account? <Link href="/login" title="Login" className="text-blue-600 font-black ml-2 hover:text-blue-500 underline underline-offset-4 decoration-2">Login</Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.6em] opacity-40">
                    Nurse Learning Corner . Clinical Intelligence Network
                </p>
            </motion.div>
        </div>
    );
}
