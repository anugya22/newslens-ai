'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, LineChart, Shield, Zap, Globe, MessageSquare, Sun, Moon } from 'lucide-react';
import { useStore } from './lib/store';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const { settings } = useStore();
    const { user, isLoading: loading } = useAuth();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [settings.theme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Search the URL for intentional navigation
        const params = new URLSearchParams(window.location.search);
        const isManualHome = params.get('v') === 'home';

        // Only redirect if: 
        // 1. User is logged in
        // 2. Auth finished loading
        // 3. This is NOT a "Return to Home" click (?v=home)
        if (user && !loading && !isManualHome) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="min-h-screen bg-white dark:bg-[#0B0C10]"></div>;
    }

    return (
        <div className="min-h-screen text-slate-900 dark:text-white selection:bg-primary-500/30">
            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">NewsLens <span className="text-blue-600">AI</span></span>
                    </div>

                    <div className="hidden md:flex flex-1 justify-center space-x-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Features</a>
                        <a href="#markets" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Markets</a>
                        <a href="/portfolio" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Portfolio</a>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={() => useStore.getState().updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                            className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Toggle theme"
                        >
                            {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {user ? (
                            <Link href="/dashboard" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold transition shadow-lg shadow-primary-500/25 flex items-center group">
                                Go to App
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition">
                                    Sign In
                                </Link>
                                <Link href="/dashboard" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full font-bold transition shadow-lg hover:scale-105 active:scale-95 flex items-center group">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/20 dark:bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm mb-6 border border-primary-100 dark:border-primary-800/50"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        <span>NewsLens AI is Live</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]"
                    >
                        Market Intelligence,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">
                            Powered by AI.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        Chat with real-time global news, analyze stock trends, and manage your portfolio with an intelligent, autonomous financial agent.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                    >
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] hover:-translate-y-1 flex items-center justify-center group"
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Start Chatting Free
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white/40 dark:bg-black/20 backdrop-blur-md border-y border-gray-100 dark:border-gray-800/60 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">Everything you need to trade smarter.</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Say goodbye to dozens of confusing tabs. NewsLens AI merges news, charts, and analysis into one beautiful conversational interface.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800/50 hover:border-primary-500/50 transition-colors group shadow-xl">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Global News Aggregation</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                Curated RSS feeds scanning hundreds of trusted sources 24/7. Never miss a breaking headline.
                            </p>
                        </div>
                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800/50 hover:border-primary-500/50 transition-colors group shadow-xl">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LineChart className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Real-Time Market Data</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                Live prices, charts, and intelligent ticker extraction for Stocks, ETFs, and Cryptocurrencies.
                            </p>
                        </div>
                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800/50 hover:border-primary-500/50 transition-colors group shadow-xl">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Portfolio Tracking</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                Track your assets with multi-currency support and receive automated AI alerts when news impacts your holdings.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Showcase */}
            <section className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-800/30">
                            <Zap className="w-4 h-4" />
                            <span>Powered by OpenRouter Edge</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black leading-tight">
                            Like having a senior quantitative analyst by your side.
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex flex-shrink-0 items-center justify-center">
                                    <span className="text-primary-600 font-bold">1</span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold">Paste a URL, get immediate analysis.</h4>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">Our AI scrapes the article, extracts bias, key facts, and market impact automatically.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex flex-shrink-0 items-center justify-center">
                                    <span className="text-primary-600 font-bold">2</span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold">Interactive data visualizations.</h4>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">Ask "How is Apple doing?" and receive a beautiful real-time chart rendered right in the chat.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-lg lg:max-w-none">
                        {/* Mockup visual */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-[#0F1115]">
                            <div className="px-4 py-3 border-b border-gray-800 flex items-center space-x-2 bg-[#1A1D24]">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-end justify-end">
                                    <div className="max-w-[80%] bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
                                        Analyze the latest news on NVDA and tell me if I should trim my position.
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 mr-3 flex items-center justify-center shadow-lg">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 max-w-[85%] bg-gray-100 dark:bg-[#1A1D24] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm p-4 text-sm font-medium">
                                        <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-3" />
                                        <div className="space-y-2">
                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                                            <div className="w-5/6 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                                            <div className="w-4/6 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-600/5 dark:bg-primary-500/5 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to upgrade your workflow?</h2>
                    <Link
                        href="/dashboard"
                        className="px-10 py-5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-full font-bold text-xl transition-transform hover:scale-105 inline-flex items-center shadow-2xl"
                    >
                        Enter NewsLens AI
                        <ArrowRight className="w-6 h-6 ml-3" />
                    </Link>
                </div>
            </section>

            <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm font-bold text-gray-500">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                    <p>© 2026 NewsLens AI. All rights reserved.</p>
                    <div className="space-x-4 mt-4 md:mt-0">
                        <a href="#" className="hover:text-primary-500 transition">Privacy</a>
                        <a href="#" className="hover:text-primary-500 transition">Terms</a>
                        <a href="#" className="hover:text-primary-500 transition">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
