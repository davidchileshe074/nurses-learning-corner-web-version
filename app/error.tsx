"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[App Error Boundary]", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-8 h-8 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Something went wrong
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                    A temporary issue occurred. Please try again.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full py-3 bg-[#2B669A] hover:bg-[#1e4a72] text-white rounded-md font-bold text-sm uppercase tracking-wide transition-all"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-sm uppercase tracking-wide transition-all"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
