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
    const [fullName, setfullName] = useState('');
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
            const user = await account.create(ID.unique(), email, password, fullName);

            // 2. Create Session
            await account.createEmailPasswordSession(email, password);

            // 3. Create Profile Document
            await databases.createDocument(
                config.databaseId,
                config.profilesCollectionId,
                ID.unique(),
                {
                    userId: user.$id,
                    fullName: fullName,
                    email: email,
                    program: program,
                    whatsappNumber: whatsappNumber,
                    yearOfStudy: yearOfStudy,
                    verified: false,
                    adminApproved: false,
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
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-slate-50 rounded-lg flex items-center justify-center mb-4">
                            <img src="/logo.svg" alt="NLC Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                        <p className="text-slate-500 text-sm mt-1">Join the professional nursing network</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-3">
                            <p className="text-red-600 text-xs font-bold uppercase tracking-wide">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-8">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#2B669A] uppercase tracking-wide border-b border-slate-100 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setfullName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="e.g. Sarah Phiri"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="student@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-full">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="+260 97..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#2B669A] uppercase tracking-wide border-b border-slate-100 pb-2">Security</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900"
                                    placeholder="Min 8 characters"
                                    required
                                />
                            </div>
                        </div>

                        {/* Academic Profile */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#2B669A] uppercase tracking-wide border-b border-slate-100 pb-2">Academic Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Program</label>
                                    <select
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900 appearance-none"
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
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Year of Study</label>
                                    <select
                                        value={yearOfStudy}
                                        onChange={(e) => setYearOfStudy(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-medium text-slate-900 appearance-none"
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

                        {/* Institutional Access */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#2B669A] uppercase tracking-wide border-b border-slate-100 pb-2">Access Credentials</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Access Code (Optional)</label>
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, '').slice(0, 12);
                                        const parts = val.match(/.{1,4}/g) || [];
                                        setAccessCode(parts.join('-'));
                                    }}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-[#2B669A] rounded-md outline-none transition-all text-sm font-bold text-slate-900 tracking-wider text-center"
                                    placeholder="XXXX-XXXX-XXXX"
                                />
                                <p className="text-[10px] font-medium text-slate-400">Institutions may provide these for premium access.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-sm uppercase tracking-wide shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>


                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account? <Link href="/login" title="Login" className="text-[#2B669A] font-bold hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
