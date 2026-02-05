'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Library,
    Download,
    Notebook,
    User,
    Menu,
    X,
    ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const NAV_ITEMS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/downloads', label: 'Downloads', icon: Download },
    { href: '/notebook', label: 'Notebook', icon: Notebook },
    { href: '/profile', label: 'Profile', icon: User }
];

export function Navigation() {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Handle screen resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Don't show navigation on specific pages
    const hiddenPages = ['/login', '/signup', '/reset-password', '/forgot-password', '/onboarding'];
    if (hiddenPages.some(page => pathname.startsWith(page))) return null;

    if (isMobile) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-around items-center">
                <div className="max-w-xl mx-auto w-full flex justify-around items-center">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative group p-2 outline-none"
                            >
                                <div className={`relative z-10 p-2.5 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'text-white bg-blue-600 shadow-lg shadow-blue-600/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-dot-mobile"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        );
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 88 }}
                className="fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden"
            >
                <div className="flex flex-col h-full p-4">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-3 py-6 mb-8 group cursor-pointer" onClick={() => (window.location.href = '/')}>
                        <div className="w-11 h-11 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-110">
                            <Image src="/logo.svg" alt="NLC Logo" width={44} height={44} className="w-full h-full object-contain" />
                        </div>
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Nurse Corner</span>
                                    <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Clinical Portal</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="shrink-0">
                                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="font-bold text-sm whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {isActive && isSidebarOpen && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="ml-auto"
                                        >
                                            <ChevronRight size={16} />
                                        </motion.div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="mt-auto flex items-center gap-4 px-3 py-3 rounded-2xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                    >
                        <div className="shrink-0">
                            {isSidebarOpen ? <Menu size={24} /> : <Menu size={24} />}
                        </div>
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-bold text-sm whitespace-nowrap"
                                >
                                    Collapse Sidebar
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>

            {/* Content Offset for Desktop */}
            <div className="hidden md:block transition-all duration-300" style={{ marginLeft: isSidebarOpen ? 280 : 88 }}></div>
        </>
    );
}
