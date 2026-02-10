"use client";

import { useState, useEffect } from 'react';

/**
 * Hook for monitoring the device's clinical connectivity status.
 */
export function useOffline() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Initial check - guard for SSR
        if (typeof navigator !== 'undefined') {
            setIsOffline(!navigator.onLine);
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOffline;
}
