"use client";

import { useEffect } from "react";

/**
 * Catches unhandled promise rejections and errors globally.
 * On iOS Safari, uncaught errors from WebSocket disconnections
 * (Appwrite Realtime) can crash the entire app. This component
 * silently catches those non-critical errors.
 */
export function GlobalErrorCatcher() {
    useEffect(() => {
        // 1. Monkey-patch console.error to silence the "Realtime got disconnected" log
        // This log comes directly from Appwrite SDK's internal client and can't be caught by event listeners.
        const originalConsoleError = console.error;
        console.error = (...args) => {
            let message = "";
            try {
                if (args[0] !== null && args[0] !== undefined) {
                    // Safe string conversion even for objects with no prototype
                    if (typeof args[0] === 'string') {
                        message = args[0];
                    } else if (typeof args[0] === 'symbol') {
                        message = args[0].toString();
                    } else {
                        // For objects, try to satisfy string requirement for .includes()
                        message = JSON.stringify(args[0]);
                    }
                }
            } catch (e) {
                // Final fallback if stringify or toString fails
                message = "error_payload";
            }

            if (
                message.includes("Realtime got disconnected") ||
                message.includes("Reconnect will be attempted") ||
                message.includes("WebSocket is already in CLOSING") ||
                message.includes("closed before a close frame") ||
                message === "{}" ||
                (args[0] && typeof args[0] === 'object' && Object.keys(args[0]).length === 0)
            ) {
                // Silently drop these expected SDK-level logs
                return;
            }
            originalConsoleError.apply(console, args);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Prevent the browser from showing the default error
            event.preventDefault();

            const reason = event.reason;
            const message =
                reason instanceof Error ? reason.message : String(reason);

            // Log but don't crash for known non-critical errors
            if (
                message.includes("Realtime") ||
                message.includes("WebSocket") ||
                message.includes("network") ||
                message.includes("Failed to fetch") ||
                message.includes("NetworkError") ||
                message.includes("AbortError")
            ) {
                console.warn(
                    "[GlobalErrorCatcher] Non-critical async error suppressed:",
                    message
                );
                return;
            }

            console.error("[GlobalErrorCatcher] Unhandled rejection:", reason);
        };

        const handleError = (event: ErrorEvent) => {
            const message = event.message || "";

            // Suppress known non-critical errors
            if (
                message.includes("Realtime") ||
                message.includes("WebSocket") ||
                message.includes("ResizeObserver")
            ) {
                event.preventDefault();
                console.warn(
                    "[GlobalErrorCatcher] Non-critical error suppressed:",
                    message
                );
                return;
            }
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window.addEventListener("error", handleError);

        return () => {
            // Restore original console.error
            console.error = originalConsoleError;
            window.removeEventListener(
                "unhandledrejection",
                handleUnhandledRejection
            );
            window.removeEventListener("error", handleError);
        };
    }, []);

    return null;
}
