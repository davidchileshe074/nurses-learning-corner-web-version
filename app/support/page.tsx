'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
    {
        q: "How do I access materials offline?",
        a: "In the Library, click the 'Download' icon on any PDF. Once downloaded, you can access it even without an internet connection via the 'Downloaded' filter."
    },
    {
        q: "Can I sync my notes across devices?",
        a: "Yes! As long as you are signed in, your notes and study progress are automatically synced to our secure clinical cloud."
    },
    {
        q: "How do I reset my progress?",
        a: "You can manage your study data from the Profile settings. Individual flashcard mastery can be reset within the Flashcard deck settings."
    },
    {
        q: "Is there a mobile app?",
        a: "You're looking at it! This web app is a Progressive Web App (PWA). You can 'Add to Home Screen' on iOS or Android for a full native-like experience."
    }
];

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block p-4 bg-blue-600 rounded-[30px] mb-6 shadow-xl shadow-blue-600/20"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Help Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">How can we assist your medical excellence journey today?</p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Email Support</h3>
                        <p className="text-sm text-slate-500 font-medium">Get a response within 24 hours from our clinical tech team.</p>
                        <a href="mailto:support@nursecorner.com" className="mt-6 block text-blue-600 font-bold text-sm">support@nursecorner.com →</a>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Live Chat</h3>
                        <p className="text-sm text-slate-500 font-medium">Quick answers for navigation and account issues.</p>
                        <button className="mt-6 text-purple-600 font-bold text-sm">Start Conversation →</button>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter">Common Questions</h2>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-6 text-left flex items-center justify-between"
                                >
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{faq.q}</span>
                                    <svg
                                        className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="px-6 pb-6 text-sm text-slate-500 leading-relaxed font-medium"
                                    >
                                        {faq.a}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="mt-20 text-center">
                    <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-500 uppercase tracking-widest">
                        Back to Dashboard
                    </Link>
                </footer>
            </div>
        </div>
    );
}
