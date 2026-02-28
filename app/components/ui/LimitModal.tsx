'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogIn, X, Infinity as InfinityIcon, Zap } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useRouter } from 'next/navigation';

const LimitModal = () => {
    const { showLimitModal, setShowLimitModal } = useStore();
    const router = useRouter();

    if (!showLimitModal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10"
                >
                    {/* Header Background */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-transparent" />

                    <div className="relative p-8 pt-10 text-center">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* Icon Banner */}
                        <div className="relative mb-6 inline-flex p-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-4 ring-primary-50 dark:ring-primary-900/10">
                            <ShieldAlert className="w-8 h-8" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Daily Limit Reached
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            You've hit the 10-message daily limit for guest access in <span className="text-primary-600 font-semibold text-sm">Advanced Market Modes</span>.
                        </p>

                        {/* Feature Highlights */}
                        <div className="grid grid-cols-1 gap-4 mb-8 text-left">
                            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                                    <InfinityIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Unlimited Access</p>
                                    <p className="text-xs text-gray-500">Ask as many questions as you want.</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Real-time Grounding</p>
                                    <p className="text-xs text-gray-500">Full stock and crypto analysis unlocked.</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowLimitModal(false);
                                    router.push('/login');
                                }}
                                className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <LogIn className="w-5 h-5" />
                                <span>Log In to Continue</span>
                            </button>

                            <button
                                onClick={() => setShowLimitModal(false)}
                                className="w-full py-3 px-6 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LimitModal;
