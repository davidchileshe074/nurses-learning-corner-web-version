"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCacheStats } from '@/hooks/useContentOptimization';
import { downloadServices } from '@/services/download';
import { Database, Trash2, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';

export function CacheManager() {
    const { count, formattedSize, isLoading, refresh } = useCacheStats();
    const [isClearing, setIsClearing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [clearSuccess, setClearSuccess] = useState(false);

    const handleClearCache = async () => {
        setIsClearing(true);
        const success = await downloadServices.purgeAllDownloads();
        setIsClearing(false);
        setShowConfirm(false);

        if (success) {
            setClearSuccess(true);
            await refresh();
            setTimeout(() => setClearSuccess(false), 3000);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Database className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Storage Management</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Offline Content Cache</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <HardDrive size={16} className="text-slate-400" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Items Cached</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{count}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Database size={16} className="text-slate-400" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Storage Used</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{formattedSize}</p>
                        </div>
                    </div>

                    {/* Success Message */}
                    <AnimatePresence>
                        {clearSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
                            >
                                <CheckCircle className="text-green-600" size={20} />
                                <p className="text-sm font-bold text-green-800">Cache cleared successfully!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">About Offline Storage</p>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Downloaded content is stored locally for offline access. Clearing the cache will remove all downloaded files but won't affect your reading progress or activity history.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={count === 0 || isClearing}
                            className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Clear All Cache
                        </button>
                        <button
                            onClick={refresh}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-200 transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="text-red-600" size={28} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 text-center mb-3">Clear All Cache?</h3>
                            <p className="text-slate-600 text-center mb-8 leading-relaxed">
                                This will remove all {count} downloaded {count === 1 ? 'file' : 'files'} ({formattedSize}). You'll need to download them again for offline access.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearCache}
                                    disabled={isClearing}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isClearing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Clearing...
                                        </>
                                    ) : (
                                        'Clear Cache'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
