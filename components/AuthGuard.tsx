'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';

const publicRoutes = ['/login', '/signup', '/forgot-password', '/onboarding', '/reset-password', '/verify-otp', '/pending-approval'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, isLoading, checkSession } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (!isLoading) {
            const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

            if (!user) {
                if (!isPublicRoute) {
                    router.push('/login');
                }
            } else {
                // User is logged in
                const isVerified = profile?.verified || user.emailVerification;
                const isAdminApproved = profile?.adminApproved;

                if (!isVerified && pathname !== '/verify-otp') {
                    router.push('/verify-otp');
                } else if (isVerified && pathname === '/verify-otp') {
                    router.push('/');
                } else if (isVerified && !isAdminApproved && !isPublicRoute && pathname !== '/pending-approval' && pathname !== '/support') {
                    router.push('/pending-approval');
                } else if (isVerified && isAdminApproved && pathname === '/pending-approval') {
                    router.push('/');
                } else if (isVerified && isPublicRoute && pathname !== '/verify-otp' && pathname !== '/pending-approval') {
                    router.push('/');
                }
            }
        }
    }, [user, profile, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your medical corner...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
