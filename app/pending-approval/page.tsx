"use client"
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, LogOut, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import Image from 'next/image';

export default function PendingApprovalPage() {
    const { profile, logout } = useAuthStore();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl"
            >
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>

                    <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-amber-600 shadow-lg shadow-amber-200/50">
                        <Clock size={48} />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
                        Approval Pending
                    </h1>

                    <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                        Hello, <span className="text-[#2B669A] font-bold">{profile?.fullName || 'Nurse'}</span>. Your clinical credentials have been received and are currently being verified by our administration team.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 italic text-sm text-slate-500">
                        "To maintain the highest standards of professional content, we verify all new members before granting access to our premium clinical repository."
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.location.href = 'mailto:support@nursecorner.com'}
                            className="flex-1 py-4 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#2B669A]/20 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            Contact Support
                        </button>
                        <button
                            onClick={logout}
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Nurse Learning Corner . Standards of Excellence
                </p>
            </motion.div>
        </div>
    );
}
