"use client"
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import {
    HelpCircle,
    Mail,
    MessageSquare,
    ChevronDown,
    ChevronLeft,
    ExternalLink,
    ShieldCheck,
    Sparkles,
    LifeBuoy,
    BookOpen,
    Zap,
    ChevronRight
} from 'lucide-react';

const FAQS = [
    {
        q: "How do I access materials offline?",
        a: "Navigate to the Library, select any resource, and click 'Download Offline'. The material will be cached in your localized clinical vault, accessible via the 'Downloads' tab even without network connectivity.",
        icon: Zap
    },
    {
        q: "Can I sync my notes across devices?",
        a: "Absolutely. All clinical observations and reading progress are synchronized in real-time with our High-Fidelity Cloud, ensuring your intelligence is available anywhere you authenticate.",
        icon: Sparkles
    },
    {
        q: "How do I redeem an institutional access code?",
        a: "Visit your Profile section and locate the 'Redeem Access' module. Input your unique code to unlock specialized curriculum modules and premium repository access.",
        icon: ShieldCheck
    },
    {
        q: "What is a Progressive Web App (PWA)?",
        a: "Nurse Corner is engineered as a PWA, allowing you to 'Install' or 'Add to Home Screen' on your mobile device for a full-screen, native-level performance experience without using an app store.",
        icon: LifeBuoy
    }
];

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12 md:py-20 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="inline-flex p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[35px] mb-8 shadow-2xl shadow-blue-600/10 relative group"
                    >
                        <div className="absolute inset-0 bg-blue-600/5 rounded-[35px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <HelpCircle size={40} className="text-blue-600 relative z-10" strokeWidth={1.5} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Concierge Support</p>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6">
                            Clinical Help Center <span className="text-blue-600">.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-xl mx-auto leading-relaxed">
                            Ensuring your academic performance remains uninterrupted with world-class technical and clinical assistance.
                        </p>
                    </motion.div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white dark:bg-slate-900 p-10 rounded-[50px] border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-3xl hover:border-blue-600/30 transition-all cursor-pointer group flex flex-col items-start"
                    >
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                            <Mail size={28} className="text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter italic">Intelligence Desk</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                            Detailed inquiries regarding curriculum content or technical architecture.
                        </p>
                        <a href="mailto:support@nursecorner.com" className="mt-auto inline-flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:gap-4 transition-all">
                            support@nursecorner.com
                            <ExternalLink size={14} />
                        </a>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white dark:bg-slate-900 p-10 rounded-[50px] border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-3xl hover:border-purple-600/30 transition-all cursor-pointer group flex flex-col items-start"
                    >
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-500">
                            <MessageSquare size={28} className="text-purple-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter italic">Live Response</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                            Immediate operational assistance for account and navigation concerns.
                        </p>
                        <button className="mt-auto inline-flex items-center gap-2 text-purple-600 font-black uppercase text-[10px] tracking-widest hover:gap-4 transition-all">
                            Initiate Protocol
                            <ChevronRight size={14} />
                        </button>
                    </motion.div>
                </section>

                <section className="mb-24">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Clinical Knowledge Base</h2>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                    </div>

                    <div className="space-y-6">
                        {FAQS.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-50 dark:border-slate-800 overflow-hidden hover:border-blue-600/20 transition-all group"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-8 text-left flex items-center justify-between group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/10 transition-colors"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${openFaq === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-600'}`}>
                                            <faq.icon size={20} />
                                        </div>
                                        <span className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none group-hover:text-blue-600 transition-colors">{faq.q}</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-all ${openFaq === i ? 'bg-blue-600 border-blue-600 rotate-180' : 'group-hover:border-blue-600 group-hover:bg-blue-50'}`}>
                                        <ChevronDown size={18} className={openFaq === i ? 'text-white' : 'text-slate-300 group-hover:text-blue-600'} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-8 pb-10 border-t border-slate-50 dark:border-slate-800"
                                        >
                                            <div className="pt-8">
                                                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-dotted border-slate-200 dark:border-slate-700">
                                                    {faq.a}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <footer className="text-center pt-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-black text-slate-400 hover:text-blue-600 hover:border-blue-600 rounded-3xl uppercase tracking-[0.3em] shadow-xl shadow-slate-200/50 dark:shadow-black/50 transition-all group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Acknowledge and Exit
                    </Link>
                </footer>
            </div>
        </div>
    );
}
