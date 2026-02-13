'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { useRouter, usePathname } from 'next/navigation';

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // 1. Initialize Status Bar
        const initStatusBar = async () => {
            try {
                await StatusBar.setStyle({ style: Style.Light });
                if (Capacitor.getPlatform() === 'android') {
                    await StatusBar.setBackgroundColor({ color: '#F3F5F7' });
                }
            } catch (e) {
                console.warn('StatusBar error:', e);
            }
        };

        // 2. Handle Hardware Back Button (Android)
        const initBackButton = () => {
            App.addListener('backButton', ({ canGoBack }) => {
                if (pathname === '/' || pathname === '/login') {
                    App.exitApp();
                } else {
                    router.back();
                }
            });
        };

        // 3. Keyboard Handling
        const initKeyboard = () => {
            if (Capacitor.getPlatform() === 'ios') {
                Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => { });
            }
        };

        // 4. Hide Splash Screen
        const hideSplash = async () => {
            try {
                await SplashScreen.hide();
            } catch (e) {
                console.warn('SplashScreen hide error:', e);
            }
        };

        initStatusBar();
        initBackButton();
        initKeyboard();
        hideSplash();

        return () => {
            App.removeAllListeners();
        };
    }, [router, pathname]);

    return <>{children}</>;
}
