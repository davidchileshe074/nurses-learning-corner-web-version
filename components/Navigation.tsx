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
    ChevronRight,
    Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const NAV_ITEMS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/recent', label: 'Recent', icon: Clock },
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
    const hiddenPages = ['/login', '/signup', '/reset-password', '/forgot-password', '/onboarding', '/verify-otp', '/pending-approval'];
    if (hiddenPages.some(page => pathname.startsWith(page))) return null;

    if (isMobile) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
                <div className="flex justify-around items-center h-20 px-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 gap-1.5 py-2 transition-colors ${isActive
                                    ? 'text-[#2B669A]'
                                    : 'text-slate-400 hover:text-[#2B669A]'
                                    }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[9px] font-bold uppercase tracking-tight text-center ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                                    {item.label}
                                </span>
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
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-[#d5dde5] transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16'
                    }`}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-center border-b border-[#d5dde5] mb-2 cursor-pointer" onClick={() => (window.location.href = '/')}>
                    <div className="w-8 h-8 relative flex items-center justify-center">
                        <Image src="/logo.svg" alt="NLC" width={32} height={32} className="object-contain" />
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 rounded-md transition-all group overflow-hidden ${isActive
                                    ? 'bg-[#E3F2FD] text-[#1976D2]'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#2B669A]'
                                    }`}
                            >
                                <div className="shrink-0 flex items-center justify-center w-6 h-6">
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {isSidebarOpen && (
                                    <span className="ml-3 font-medium text-sm whitespace-nowrap">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-4 border-t border-[#d5dde5] text-slate-400 hover:text-[#2B669A] flex items-center justify-center transition-colors"
                >
                    {isSidebarOpen ? <ChevronRight className="rotate-180" size={20} /> : <ChevronRight size={20} />}
                </button>
            </aside>

            {/* Content Offset for Desktop */}
            <div className={`hidden md:block transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}></div>
        </>
    );
}
