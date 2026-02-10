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
            window.removeEventListener(
                "unhandledrejection",
                handleUnhandledRejection
            );
            window.removeEventListener("error", handleError);
        };
    }, []);

    return null;
}
