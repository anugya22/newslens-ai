'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PortfolioNewsService } from '../lib/portfolioNews';
import {
    PieChart, Wallet, TrendingUp, Plus, Trash2,
    ArrowUpRight, ArrowDownRight, RefreshCw, Lock,
    Bell, TrendingDown, AlertTriangle, ExternalLink,
    BrainCircuit, X
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';
import { MarketDataService } from '../lib/apis';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';
import { NotificationService } from '../lib/notifications';
import axios from 'axios';
import { AI_CONFIG } from '../lib/config';
import { useRouter } from 'next/navigation';

interface PortfolioItem {
    id: string;
    symbol: string;
    quantity: number;
    avg_price: number;
    asset_type: 'stock' | 'crypto';
    buy_date?: string;
    exchange?: string;
    current_price?: number;
    value?: number;
    gain_loss?: number;
    gain_loss_percent?: number;
    daily_change?: number;
}

interface PortfolioAlert {
    id: string;
    symbol: string;
    title: string;
    description: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
    relevanceScore: number;
}

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInWithEmail, signUpWithEmail } = useAuth();

    const validatePassword = (pw: string) => {
        const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(pw);
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setIsForgotPassword(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email address");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            toast.success('A link has been sent to your email id. Please click on it to log in back to app!', { duration: 6000 });
            setIsForgotPassword(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!isLogin && password !== confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!isLogin && !validatePassword(password)) {
            toast.error("Password must be at least 8 characters long, contain 1 uppercase letter and 1 number.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
                toast.success('Successfully signed in!');
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                // Check if user already exists (Supabase returns empty identities for security)
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    toast.error('An account with this email already exists. Please Sign In.');
                    setIsLogin(true); // Switch to login mode
                    return;
                }

                toast.success('Sign up successful! Please check your email.');
            }
        } catch (error: any) {
            if (error.message?.includes('User already registered') || error.message?.includes('unique constraint')) {
                toast.error('An account with this email already exists. Please Sign In.');
                setIsLogin(true); // Switch to login mode
            } else {
                toast.error(error.message || 'Authentication failed');
            }
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isForgotPassword) {
        return (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                        placeholder="your@email.com"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                    >
                        Back to Sign In
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                    placeholder="your@email.com"
                />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    {isLogin && (
                        <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                        >
                            Forgot pwd?
                        </button>
                    )}
                </div>
                <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                />
            </div>

            <AnimatePresence>
                {!isLogin && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required={!isLogin}
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border ${password !== confirmPassword && confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} focus:ring-2`}
                                placeholder="••••••••"
                            />
                            {password !== confirmPassword && confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Password must be at least 8 characters long, contain 1 uppercase letter and 1 number.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
            <div className="text-center">
                <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
            </div>
        </form>
    );
};

export default function PortfolioPage() {
    const { user, signInWithGoogle, signOut, isLoading: authLoading, session } = useAuth();
    const router = useRouter();

    const chatEndRef = useRef<HTMLDivElement>(null);

    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState(0);
    const [totalGain, setTotalGain] = useState(0);
    const [newsAlerts, setNewsAlerts] = useState<PortfolioAlert[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    // Multi-Currency State
    const [currency, setCurrency] = useState<'USD' | 'INR' | 'GBP' | 'EUR'>('USD');
    const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1, INR: 83.5, GBP: 0.79, EUR: 0.92 });

    // Fetch live FX rates once on mount
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await axios.get('https://api.frankfurter.app/latest?from=USD&to=INR,GBP,EUR');
                if (res.data && res.data.rates) {
                    setFxRates({ USD: 1, ...res.data.rates });
                }
            } catch (e) {
                console.warn('Failed to fetch live FX rates. Using fallbacks.');
            }
        };
        fetchRates();
    }, []);

    const formatCurrency = useCallback((usdValue: number) => {
        const rate = fxRates[currency] || 1;
        const converted = usdValue * rate;

        let prefix = '$';
        if (currency === 'INR') prefix = '₹';
        if (currency === 'GBP') prefix = '£';
        if (currency === 'EUR') prefix = '€';

        // For negative values, format securely (e.g. -₹100)
        const isNegative = converted < 0;
        const absVal = Math.abs(converted);

        return `${isNegative ? '-' : ''}${prefix}${absVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [currency, fxRates]);

    const [isAdding, setIsAdding] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [userProfile, setUserProfile] = useState<{
        full_name: string | null,
        investment_type?: 'long_term' | 'swing' | 'day_trader',
        risk_profile?: 'conservative' | 'moderate' | 'aggressive'
    } | null>(null);
    const [aiInsight, setAiInsight] = useState<string>('');
    const [dailySummary, setDailySummary] = useState<string>('Analyzing 24h shifts...');
    const [isSimpleEnglish, setIsSimpleEnglish] = useState(false);
    const [loadingInsight, setLoadingInsight] = useState(false);
    const [lastInsightHash, setLastInsightHash] = useState<string>('');

    // AI Command Center State
    const [aiStatus, setAiStatus] = useState<string>('System Ready');
    const [isScanning, setIsScanning] = useState(false);
    const [healthScore, setHealthScore] = useState<number | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatQuery, setChatQuery] = useState('');

    const [newItem, setNewItem] = useState({
        symbol: '',
        quantity: '',
        avg_price: '',
        type: 'stock' as 'stock' | 'crypto',
        buy_date: new Date().toISOString().split('T')[0],
        exchange: ''
    });

    const [selectedAdvice, setSelectedAdvice] = useState<{ title: string, content: string } | null>(null);
    const [loadingAdvice, setLoadingAdvice] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [sendingChat, setSendingChat] = useState(false);

    // Smart Deletion State
    const [assetToDelete, setAssetToDelete] = useState<any | null>(null);
    const [deletionAnalysis, setDeletionAnalysis] = useState<string | null>(null);
    const [isAnalyzingDeletion, setIsAnalyzingDeletion] = useState(false);

    // FIX: Memoize services to prevent infinite re-render loop
    const marketService = React.useMemo(() =>
        new MarketDataService(),
        []);
    const newsService = React.useMemo(() => new PortfolioNewsService(), []);

    // AI Helper: Robust call with enforced plain text
    const callAI = async (prompt: string, systemMsg: string = 'You are a professional financial assistant.') => {
        const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        const model = AI_CONFIG.MODEL;

        // Allow beautiful plain text and emojis, but no code blocks
        const formattingInstruction = " IMPORTANT: Be engaging and highly conversational! Use spacing and **bold text** to highlight key metrics. Use relevant emojis. You MAY use code blocks and raw markdown lists if appropriate.";
        const finalSystemMsg = systemMsg + formattingInstruction;

        let retries = 2;
        while (retries >= 0) {
            try {
                const res = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            { role: 'system', content: finalSystemMsg },
                            { role: 'user', content: prompt }
                        ]
                    },
                    {
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                        timeout: 20000
                    }
                );
                if (res.data?.choices?.[0]?.message?.content) {
                    return res.data.choices[0].message.content;
                }
            } catch (e: any) {
                console.warn(`Model ${model} failed:`, e.message);
                if (retries === 0) break;
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new Error('Our AI advisors are currently busy. Please try again in a few moments.');
    };

    const handleGetAIAdvice = async (stock: string, newsTitle: string, newsDesc: string) => {
        setLoadingAdvice(newsTitle);
        try {
            const asset = items.find(i => i.symbol === stock);
            const totalPortfolioValue = items.reduce((acc, i) => acc + (i.value || 0), 0);
            const assetValue = asset?.value || 0;
            const weight = totalPortfolioValue > 0 ? (assetValue / totalPortfolioValue) * 100 : 0;

            const userPersona = `Style: ${userProfile?.investment_type || 'long_term'}, Risk: ${userProfile?.risk_profile || 'moderate'}`;
            const prompt = `Analyze news for ${stock}. Headline: ${newsTitle}. 
            Context: This asset makes up ${weight.toFixed(1)}% of the user's total portfolio ($${assetValue.toFixed(0)} of $${totalPortfolioValue.toFixed(0)}).
            Persona: ${userPersona}. Position: ${asset?.quantity || 0} units. 
            Explain specifically how this news affects the user's portfolio and net worth. Suggest strategy context. 
            Confidence score 0.0-1.0. ${isSimpleEnglish ? 'Simple terminology.' : 'Professional terminology.'}`;

            const content = await callAI(prompt, 'Elite portfolio analyst. Focus on portfolio impact and capital preservation.');
            setSelectedAdvice({ title: stock, content: content });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Advisor error details:', error.response?.data || error.message);
            }
            toast.error('The Advisor is currently busy. Please try again shortly.');
        } finally {
            setLoadingAdvice(null);
        }
    };

    const generatePortfolioInsight = async (enrichedItems: PortfolioItem[]) => {
        if (!enrichedItems.length || loadingInsight) return;

        // Hash for throttling: symbol list + simple toggle
        const currentHash = `${enrichedItems.map(i => i.symbol).sort().join(',')}-${isSimpleEnglish}-${userProfile?.investment_type}`;
        if (currentHash === lastInsightHash) return;

        setLoadingInsight(true);
        try {
            const totalValueCalc = enrichedItems.reduce((acc, i) => acc + (i.value || 0), 0);
            const userPersona = `Style: ${userProfile?.investment_type || 'long_term'}, Risk: ${userProfile?.risk_profile || 'moderate'}`;
            const prompt = `Portfolio: ${enrichedItems.length} assets. Tot Val $${totalValueCalc.toFixed(0)}. Persona: ${userPersona}. 1-sentence insight. Confidence needed. ${isSimpleEnglish ? 'Simple.' : 'Pro.'}`;
            const content = await callAI(prompt, 'Finance AI. Risk focus.');
            setAiInsight(content);
            setLastInsightHash(currentHash);
        } catch (error) {
            setAiInsight('Portfolio summary active. Check assets for live details.');
        } finally {
            setLoadingInsight(false);
        }
    };

    useEffect(() => {
        if (showChat && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat, sendingChat]);

    const handleSendMessage = async () => {
        if (!chatQuery.trim() || sendingChat) return;

        const userMsg = chatQuery;
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatQuery('');
        setSendingChat(true);

        // Prepare context
        const pfContext = `Total Portfolio: $${items.reduce((acc, i) => acc + (i.value || 0), 0).toFixed(2)}\nAssets: ${items.map(i => `${i.symbol} (${i.quantity})`).join(', ')}`;
        const userPersona = `Style: ${userProfile?.investment_type || 'long_term'}, Risk: ${userProfile?.risk_profile || 'moderate'}`;
        const finalPrompt = `[CONTEXT]\n${pfContext}\n${userPersona}\n[USER QUERY]\n${userMsg}`;

        // Create empty assistant message placeholder to stream into
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: finalPrompt,
                    marketMode: false,
                    cryptoMode: false,
                    sessionId: 'portfolio-chat',
                    userId: user?.id,
                    accessToken: session?.access_token,
                    // Give recent memory context
                    history: chatMessages.slice(-6).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            if (!res.ok) throw new Error('API Error');
            if (!res.body) throw new Error('No stream body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    try {
                        const data = JSON.parse(trimmedLine);
                        if (data.type === 'content' && data.text) {
                            accumulatedContent += data.text;
                            // Update the last message in state with the new chunk
                            setChatMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: accumulatedContent };
                                return newMsgs;
                            });
                        }
                    } catch (e) {
                        // ignore parse errors for partial chunks
                    }
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            setChatMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now." };
                return newMsgs;
            });
        } finally {
            setSendingChat(false);
        }
    };

    const calculateHealthScore = (enrichedItems: PortfolioItem[], alerts: PortfolioAlert[]) => {
        if (!enrichedItems.length) return 100;

        // 1. Profitability Score (40%)
        const totalInvested = enrichedItems.reduce((acc, i) => acc + (i.avg_price * i.quantity), 0);
        const totalValue = enrichedItems.reduce((acc, i) => acc + (i.value || 0), 0);
        const portfolioPLPercent = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

        // Base 50, +/- 2 points per % gain/loss, cap 0-100
        const profitabilityScore = Math.min(Math.max(50 + (portfolioPLPercent * 2), 0), 100);

        // 2. Diversification Score (30%)
        const uniqueAssets = new Set(enrichedItems.map(i => i.symbol)).size;
        let diversificationScore = Math.min(uniqueAssets * 20, 100); // 5 assets = 100

        // Concentration Penalty: Deduct 20 points if any asset > 35%
        const maxWeight = enrichedItems.length > 0
            ? Math.max(...enrichedItems.map(i => (i.value || 0) / (totalValue || 1) * 100))
            : 0;
        if (maxWeight > 35) diversificationScore -= 20;
        diversificationScore = Math.max(diversificationScore, 0);

        // 3. Sentiment Score (30%)
        let sentimentScore = 50; // Neutral baseline
        if (alerts.length > 0) {
            const positive = alerts.filter(a => a.sentiment === 'positive').length;
            const negative = alerts.filter(a => a.sentiment === 'negative').length;
            sentimentScore = 50 + ((positive - negative) / alerts.length) * 50;
        }
        sentimentScore = Math.min(Math.max(sentimentScore, 0), 100);

        const health = (profitabilityScore * 0.4) + (diversificationScore * 0.3) + (sentimentScore * 0.3);
        return Math.round(health);
    };

    // RESTORED: Fetch News Alerts
    const fetchNewsAlerts = useCallback(async (symbols: string[], currentItems: PortfolioItem[]) => {
        if (!symbols.length) return;
        setLoadingAlerts(true);
        setIsScanning(true);
        setAiStatus(`Scanning news for ${symbols.join(', ')}...`);
        try {
            setAiStatus(`Scanning news for ${symbols.join(', ')}...`);
            const fetchedAlerts = await newsService.getNewsForSymbols(symbols);

            // --- News Persistence & Deduplication Logic ---
            const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
            const now = Date.now();

            // 1. Load existing cache
            const cachedNewsJson = typeof window !== 'undefined' ? localStorage.getItem('portfolio_news_cache') : null;
            let cachedNews: PortfolioAlert[] = cachedNewsJson ? JSON.parse(cachedNewsJson) : [];

            // 2. Filter out expired news and news for deleted assets
            cachedNews = cachedNews.filter(n => {
                const age = now - new Date(n.timestamp).getTime();
                const symbolExists = symbols.includes(n.symbol); // Only keep news for current assets
                return age < TWO_DAYS_MS && symbolExists;
            });

            // 3. Merge new alerts (avoid duplicates by ID or Title)
            const newsMap = new Map<string, PortfolioAlert>();
            [...cachedNews, ...fetchedAlerts].forEach(alert => {
                // Create a unique key
                const key = `${alert.symbol}-${alert.title}`;
                if (!newsMap.has(key)) {
                    // Normalize timestamp to string for storage consistency, then back to Date object if needed
                    // But here we just keep the object as is, just ensuring we don't duplicate
                    newsMap.set(key, alert);
                }
            });

            // 4. Convert map back to array and sort
            const allAlerts = Array.from(newsMap.values()).sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // 5. Save back to cache
            if (typeof window !== 'undefined') {
                localStorage.setItem('portfolio_news_cache', JSON.stringify(allAlerts));
            }

            // 6. Update State (Show top 20, scrollable)
            setNewsAlerts(allAlerts.slice(0, 20));

            // Update Health Score based on new alerts
            setHealthScore(calculateHealthScore(currentItems, allAlerts));

            // Trigger Notifications for high risk/opportunity news
            if (user?.email && fetchedAlerts.length > 0) {
                setAiStatus('Analyzing market risks and opportunities...');
                // Map alerts to NewsArticle type for the service
                const articles = fetchedAlerts.map(a => ({
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    url: a.url,
                    source: 'Market Feed',
                    sentiment: a.sentiment,
                    marketRelevance: a.relevanceScore * 10,
                    publishedAt: a.timestamp.toISOString(),
                    urlToImage: undefined
                }));

                // Fire and forget - don't block UI
                NotificationService.analyzeAndNotify(user.email, symbols, articles);
            }
            setAiStatus('Portfolio Scan Complete: Optimized');
            setTimeout(() => setAiStatus('System Monitoring Active'), 5000);
        } catch (error) {
            console.error('Error fetching news alerts:', error);
            setAiStatus('Scan interrupted');
        } finally {
            setLoadingAlerts(false);
            setIsScanning(false);
        }
    }, [newsService, user?.email]);
    // Note: items dependency added for health score calculation

    // RESTORED: Fetch Portfolio
    const fetchPortfolio = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile Info
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profileData) setUserProfile(profileData);

            // 2. Fetch Portfolio Items
            const { data, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // 3. Enrich with real-time price data
            const enrichedItems = await Promise.all((data || []).map(async (item: any) => {
                const quote = await marketService.getStockQuote(item.symbol);
                const currentPrice = quote?.price || item.avg_price;
                const value = currentPrice * item.quantity;
                const gainLoss = value - (item.avg_price * item.quantity);
                const gainLossPercent = item.avg_price > 0 ? ((currentPrice - item.avg_price) / item.avg_price) * 100 : 0;

                return {
                    ...item,
                    current_price: currentPrice,
                    value,
                    gain_loss: gainLoss,
                    gain_loss_percent: gainLossPercent,
                    daily_change: quote?.changePercent || 0
                };
            }));

            setItems(enrichedItems);
            generatePortfolioInsight(enrichedItems);

            const total = enrichedItems.reduce((acc: number, item: any) => acc + (item.value || 0), 0);
            const gain = enrichedItems.reduce((acc: number, item: any) => acc + (item.gain_loss || 0), 0);

            setTotalValue(total);
            setTotalGain(gain);

            if (enrichedItems.length > 0) {
                const symbols = enrichedItems.map((i: any) => i.symbol);
                fetchNewsAlerts(symbols, enrichedItems);

                // Calculate Daily Summary
                const totalDailyShift = enrichedItems.reduce((acc, i) => acc + (i.value || 0) * ((i.daily_change || 0) / 100), 0);
                const biggestGainer = [...enrichedItems].sort((a, b) => (b.daily_change || 0) - (a.daily_change || 0))[0];
                const biggestLoser = [...enrichedItems].sort((a, b) => (a.daily_change || 0) - (b.daily_change || 0))[0];
                const avgChange = enrichedItems.reduce((acc, i) => acc + (i.daily_change || 0), 0) / enrichedItems.length;

                const summary = `Since yesterday, your portfolio is ${avgChange >= 0 ? 'up' : 'down'} ${Math.abs(avgChange).toFixed(1)}% ($${Math.abs(totalDailyShift).toFixed(2)}). ${biggestGainer.symbol} is leading (+${biggestGainer.daily_change?.toFixed(1)}%), while ${biggestLoser.symbol} lags (${biggestLoser.daily_change?.toFixed(1)}%).`;
                setDailySummary(summary);
            }

        } catch (error) {
            console.error('Error fetching portfolio:', error);
            toast.error('Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    }, [user, marketService, fetchNewsAlerts]);

    useEffect(() => {
        if (user) fetchPortfolio();
    }, [user, fetchPortfolio]);

    // RESTORED: Add Asset
    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const activeCurrencyRate = fxRates[currency] || 1;
            const normalizedPrice = parseFloat(newItem.avg_price) / activeCurrencyRate;

            const { error } = await supabase.from('portfolio_items').insert({
                user_id: user.id,
                symbol: newItem.symbol.toUpperCase(),
                quantity: parseFloat(newItem.quantity),
                avg_price: normalizedPrice,
                asset_type: newItem.type,
                buy_date: newItem.buy_date,
                exchange: newItem.exchange
            });

            if (error) throw error;

            toast.success('Asset added successfully');
            setIsAdding(false);
            setNewItem({
                symbol: '',
                quantity: '',
                avg_price: '',
                type: 'stock',
                buy_date: new Date().toISOString().split('T')[0],
                exchange: ''
            });
            fetchPortfolio();
        } catch (error) {
            toast.error('Failed to add asset');
            console.error(error);
        }
    };

    // Load cached news on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const cachedNewsJson = localStorage.getItem('portfolio_news_cache');
        if (cachedNewsJson) {
            try {
                const cachedNews: PortfolioAlert[] = JSON.parse(cachedNewsJson);
                const now = Date.now();
                const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

                // Client-side filter for expiry on load
                const validNews = cachedNews.filter(n => (now - new Date(n.timestamp).getTime()) < TWO_DAYS_MS);

                if (validNews.length > 0) {
                    setNewsAlerts(validNews);
                }
            } catch (e) {
                console.error("Failed to load news cache", e);
            }
        }
    }, []);


    const initDeleteAsset = async (item: any) => {
        setAssetToDelete(item);
        setIsAnalyzingDeletion(true);
        setDeletionAnalysis(null);

        try {
            const userPersona = `Style: ${userProfile?.investment_type || 'long_term'}, Risk: ${userProfile?.risk_profile || 'moderate'}`;
            const prompt = `
            The user is about to sell/delete their entire position in ${item.symbol}.
            Asset: ${item.symbol} (${item.asset_type})
            Quantity: ${item.quantity}
            Avg Buy Price: $${item.avg_price}
            Current Price: $${item.current_price}
            Total Return: ${item.gain_loss_percent?.toFixed(2)}%
            
            Based on current market conditions and their persona (${userPersona}), provide a quick, punchy 3-bullet analysis:
            1. Market Insight (Latest sentiment/trend)
            2. Risk Summary (What happens if they sell now vs hold)
            3. Final Recommendation (Sell, Hold, or Trim)
            
            Keep it under 100 words. ${isSimpleEnglish ? 'Simple English.' : 'Professional terminology.'}
            `;
            const analysis = await callAI(prompt, 'You are an elite financial risk manager.');
            setDeletionAnalysis(analysis);
        } catch (e) {
            setDeletionAnalysis("Could not generate risk analysis at this time. Please proceed with caution.");
        } finally {
            setIsAnalyzingDeletion(false);
        }
    };

    const confirmDelete = async () => {
        if (!assetToDelete) return;
        try {
            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', assetToDelete.id);

            if (error) throw error;
            toast.success('Asset removed');
            fetchPortfolio();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete asset');
        } finally {
            setAssetToDelete(null);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6 my-8">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Sign in to NewsLens AI
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Track your assets, analyze performance, and get AI insights for your portfolio.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center space-x-2 font-medium text-gray-700 dark:text-gray-200"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
                            <span>Continue with Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with email</span>
                            </div>
                        </div>

                        <AuthForm />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-6 lg:p-10 pt-24 lg:pt-28">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* AI Thought Process Ticker */}
                <div className="bg-gray-900 dark:bg-black rounded-xl p-3 shadow-inner border border-gray-700/50 flex items-center justify-between overflow-hidden">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 truncate">
                            <span className="text-primary-500 mr-2">[AI Command]</span>
                            {aiStatus}
                        </p>
                    </div>
                    {isScanning && (
                        <div className="flex items-center space-x-1 pr-2">
                            <div className="w-1 h-3 bg-primary-500/30 rounded-full animate-[bounce_1s_infinite]"></div>
                            <div className="w-1 h-4 bg-primary-500/50 rounded-full animate-[bounce_1.2s_infinite]"></div>
                            <div className="w-1 h-3 bg-primary-500/30 rounded-full animate-[bounce_1s_infinite]"></div>
                        </div>
                    )}
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-4 mb-2">
                            <a
                                href="/dashboard"
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to News Analysis
                            </a>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Wallet className="w-8 h-8 mr-3 text-primary-500" />
                            {userProfile?.full_name ? `Welcome back, ${userProfile.full_name.split(' ')[0]}` : 'Smart Portfolio'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {userProfile?.full_name ? 'Your personalized portfolio tracking and analysis' : 'Real-time tracking and analysis of your investments'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as any)}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 cursor-pointer text-gray-700 dark:text-gray-300 shadow-sm"
                        >
                            <option value="USD">🇺🇸 USD</option>
                            <option value="INR">🇮🇳 INR</option>
                            <option value="EUR">🇪🇺 EUR</option>
                            <option value="GBP">🇬🇧 GBP</option>
                        </select>
                        <button
                            onClick={() => setShowInstructions(true)}
                            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition border border-gray-200 dark:border-gray-700 flex items-center shadow-sm"
                            title="How it Works"
                        >
                            <AlertTriangle className="w-5 h-5 mr-1" />
                            <span className="hidden sm:inline text-sm font-medium">How it Works</span>
                        </button>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="btn-primary flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition shadow-lg shadow-primary-500/20"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Asset
                        </button>
                        <button
                            onClick={signOut}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition border border-gray-200 dark:border-gray-700"
                            title="Log Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Instructions Modal */}
                <AnimatePresence>
                    {showInstructions && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto"
                            >
                                <button
                                    onClick={() => setShowInstructions(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    <Trash2 className="w-5 h-5 text-gray-400" />
                                </button>

                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400">
                                        <Wallet className="w-8 h-8" />
                                        <h2 className="text-2xl font-bold">Smart Portfolio Guide</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg flex items-center">
                                                <Plus className="w-5 h-5 mr-2 text-green-500" />
                                                Managing Stocks
                                            </h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                                                <li>Click <b>Add Asset</b> to track a new stock or crypto.</li>
                                                <li>Enter the <b>Symbol</b> (e.g., AAPL for Apple) and your average purchase price.</li>
                                                <li>Your data is securely stored and synced across your devices.</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg flex items-center">
                                                <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
                                                Analyzing Performance
                                            </h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                                                <li><b>Live Prices</b>: The dashboard fetches real-time prices to show your current value.</li>
                                                <li><b>Gain/Loss</b>: Automatically calculates your total profit or loss per asset.</li>
                                                <li><b>AI Insights</b>: Look at the top summary card for diversification advice.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                        <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center mb-2">
                                            <Bell className="w-5 h-5 mr-2" />
                                            Smart Notifications
                                        </h3>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Our AI monitors global news 24/7. If major negative news (like a lawsuit or bankruptcy) affects your stocks, we'll send an <b>Email Alert</b> immediately to help you protect your capital.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowInstructions(false)}
                                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition"
                                    >
                                        Got it!
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* AI Advice Modal */}
                <AnimatePresence>
                    {selectedAdvice && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
                            >
                                <button
                                    onClick={() => setSelectedAdvice(null)}
                                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>

                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400 border-b pb-4 dark:border-gray-700">
                                        <BrainCircuit className="w-8 h-8" />
                                        <div>
                                            <h2 className="text-xl font-bold">AI Financial Advice</h2>
                                            <p className="text-xs font-bold uppercase opacity-70">For {selectedAdvice.title}</p>
                                        </div>
                                    </div>

                                    <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                        <div className="space-y-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            {selectedAdvice.content}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t dark:border-gray-700">
                                        <button
                                            onClick={() => setSelectedAdvice(null)}
                                            className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold transition"
                                        >
                                            Close Advice
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Balance ({currency})</p>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            {formatCurrency(totalValue)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Based on real-time market data</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Gain/Loss ({currency})</p>
                                <div className={`flex items-center mt-2 ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <span className="text-2xl font-bold">
                                        {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Today</p>
                                <p className={`text-sm font-bold ${items.reduce((acc, i: any) => acc + (i.daily_change || 0), 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {items.reduce((acc, i: any) => acc + (i.daily_change || 0), 0) >= 0 ? '↑' : '↓'}
                                    {Math.abs(items.reduce((acc, i: any) => acc + (i.daily_change || 0), 0) / (items.length || 1)).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <p className={`text-xs mt-1 ${(totalGain / (totalValue - totalGain)) >= 0 ? 'text-green-600/70' : 'text-red-600/70'}`}>
                            {((totalGain / (totalValue - totalGain || 1)) * 100).toFixed(2)}% All time return
                        </p>
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">What changed since yesterday?</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight font-medium">
                                {dailySummary}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-primary-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white"
                    >
                        <div className="flex items-center justify-between">
                            <p className="font-medium opacity-90">AI Portfolio Pulse</p>
                            <div className="flex items-center space-x-2">
                                {healthScore !== null && (
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${healthScore > 75 ? 'bg-green-400/30' : healthScore > 50 ? 'bg-amber-400/30' : 'bg-red-400/30'
                                        }`}>
                                        {healthScore > 75 ? 'Stable' : healthScore > 50 ? 'Moderate' : 'High Risk'}
                                    </div>
                                )}
                                {loadingInsight || isScanning ? <RefreshCw className="w-5 h-5 animate-spin opacity-80" /> : <BrainCircuit className="w-5 h-5 opacity-80" />}
                            </div>
                        </div>

                        <div className="mt-4 flex items-end space-x-4">
                            <div className="text-5xl font-black">{healthScore || '--'}</div>
                            <div className="mb-1">
                                <div className="text-[10px] font-bold uppercase opacity-70">Health Index</div>
                                <div className={`w-12 h-1.5 rounded-full bg-white/20 overflow-hidden`}>
                                    <div
                                        className={`h-full transition-all duration-1000 ${healthScore && healthScore > 75 ? 'bg-green-400' : healthScore && healthScore > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                        style={{ width: `${healthScore || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-4 text-xs leading-relaxed opacity-90 font-medium italic min-h-[32px]">
                            {loadingInsight ? (
                                <span>Syncing analysis...</span>
                            ) : (
                                aiInsight || "Select an asset to analyze specific risk vectors and sentiment trends."
                            )}
                        </p>
                    </motion.div>
                </div>

                {/* AI Persona & Preferences */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-primary-100 dark:border-primary-900/30 flex flex-wrap items-center gap-4 mt-6"
                >
                    <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                        <BrainCircuit className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">AI Persona</span>
                    </div>

                    <div className="flex items-center space-x-4 flex-1">
                        <select
                            value={userProfile?.investment_type || 'long_term'}
                            onChange={async (e) => {
                                const val = e.target.value;
                                setUserProfile(prev => ({ ...(prev || {} as any), investment_type: val }));
                                await supabase.from('profiles').update({ investment_type: val }).eq('id', user?.id);
                                toast.success('Strategy updated');
                                generatePortfolioInsight(items);
                            }}
                            className="bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-1 focus:ring-primary-500 cursor-pointer"
                        >
                            <option value="long_term">🟢 Long-term Investor</option>
                            <option value="swing">🔵 Swing Trader</option>
                            <option value="day_trader">🔴 Day Trader</option>
                        </select>

                        <select
                            value={userProfile?.risk_profile || 'moderate'}
                            onChange={async (e) => {
                                const val = e.target.value;
                                setUserProfile(prev => ({ ...(prev || {} as any), risk_profile: val }));
                                await supabase.from('profiles').update({ risk_profile: val }).eq('id', user?.id);
                                toast.success('Risk profile updated');
                                generatePortfolioInsight(items);
                            }}
                            className="bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-1 focus:ring-primary-500 cursor-pointer"
                        >
                            <option value="conservative">Conservative</option>
                            <option value="moderate">Moderate</option>
                            <option value="aggressive">Aggressive</option>
                        </select>

                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isSimpleEnglish}
                                onChange={(e) => {
                                    setIsSimpleEnglish(e.target.checked);
                                    generatePortfolioInsight(items);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xs font-bold text-gray-500 group-hover:text-primary-600 transition-colors">
                                Explain in Simple English
                            </span>
                        </label>
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                        RESETS ON CHANGE
                    </div>
                </motion.div>

                {/* Add Asset Modal */}
                <AnimatePresence>
                    {isAdding && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
                            >
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>

                                <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400 mb-6">
                                    <Plus className="w-8 h-8" />
                                    <h2 className="text-2xl font-bold">Add New Asset</h2>
                                </div>

                                <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Symbol</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. AAPL, BTC, TSLA"
                                                value={newItem.symbol}
                                                onChange={e => setNewItem({ ...newItem, symbol: e.target.value.toUpperCase() })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all font-bold tracking-wider"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            step="any"
                                            placeholder="0.00"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avg. Buy Price</label>
                                        <input
                                            type="number"
                                            required
                                            step="any"
                                            placeholder="0.00"
                                            value={newItem.avg_price}
                                            onChange={e => setNewItem({ ...newItem, avg_price: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type</label>
                                        <select
                                            value={newItem.type}
                                            onChange={e => setNewItem({ ...newItem, type: e.target.value as 'stock' | 'crypto' })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                                        >
                                            <option value="stock">Stock / ETF</option>
                                            <option value="crypto">Cryptocurrency</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newItem.buy_date}
                                            onChange={e => setNewItem({ ...newItem, buy_date: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>

                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center space-x-2 text-lg"
                                        >
                                            <Plus className="w-6 h-6" />
                                            <span>Add Asset to Portfolio</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* News Impact Alerts */}
                {newsAlerts.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <Bell className="w-5 h-5 text-primary-500 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    News Impact Alerts
                                </h3>
                                <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    Last 48 hours
                                </span>
                            </div>
                            {loadingAlerts && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {newsAlerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 rounded-lg border-l-4 ${alert.sentiment === 'positive'
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                                        : alert.sentiment === 'negative'
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-400'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <span className="px-2 py-0.5 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded mr-2">
                                                    {alert.symbol}
                                                </span>
                                                {alert.sentiment === 'positive' && (
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                )}
                                                {alert.sentiment === 'negative' && (
                                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                                )}
                                                {alert.sentiment === 'neutral' && (
                                                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                                                )}
                                            </div>
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                                {alert.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {alert.description}
                                            </p>
                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                                <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                                                <span className="mx-2">•</span>
                                                <span>Relevance: {(alert.relevanceScore * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-3">
                                            <button
                                                onClick={() => handleGetAIAdvice(alert.symbol, alert.title, alert.description)}
                                                disabled={loadingAdvice === alert.title}
                                                className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                                                title="Get AI Advice"
                                            >
                                                {loadingAdvice === alert.title ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                                                ) : (
                                                    <BrainCircuit className="w-4 h-4" />
                                                )}
                                            </button>
                                            <a
                                                href={alert.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                                            >
                                                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Assets Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400">Asset</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-right">Price</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-right">Day Chg</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-right">Holdings</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-right">Value</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-right">Return</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-gray-500 dark:text-gray-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading your assets...
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No assets yet. Click "Add Asset" to start tracking.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item: any) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedAsset(item)}
                                            className="hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold mr-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                                                        {item.symbol[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{item.symbol}</p>
                                                        <span className="text-xs text-gray-500 capitalize">{item.asset_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(item.current_price || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`flex items-center justify-end ${item.daily_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    <span className="font-medium text-sm">{item.daily_change >= 0 ? '+' : ''}{item.daily_change.toFixed(2)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-gray-900 dark:text-white font-medium">{item.quantity}</p>
                                                <p className="text-xs text-gray-500">Avg: {formatCurrency(item.avg_price)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(item.value || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`flex items-center justify-end ${(item.gain_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(item.gain_loss || 0) >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                                                    <span className="font-medium">{formatCurrency(Math.abs(item.gain_loss || 0)).replace('-', '')}</span>
                                                </div>
                                                <p className={`text-[10px] text-right font-bold ${(item.gain_loss_percent || 0) >= 0 ? 'text-green-600/70' : 'text-red-600/70'}`}>
                                                    {item.gain_loss_percent?.toFixed(1)}% total
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-1" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleGetAIAdvice(item.symbol, `Deep Analysis: ${item.symbol}`, `Current outlook for ${item.symbol} based on market sentiment and fundamentals.`)}
                                                        className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-lg transition"
                                                        title="Get AI Advice"
                                                    >
                                                        <BrainCircuit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); initDeleteAsset(item); }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition"
                                                        title="Remove Asset"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Smart Delete Modal */}
            <AnimatePresence>
                {assetToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800"
                        >
                            <div className="p-8">
                                <div className="flex items-center space-x-3 text-red-500 mb-6">
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                                        <Trash2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Remove {assetToDelete.symbol}?</h2>
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Smart Deletion Analysis</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 relative min-h-[120px]">
                                        {isAnalyzingDeletion ? (
                                            <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                                                <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Analyzing Market Risk...</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap italic">
                                                "{deletionAnalysis || "Analysis engine is recalibrating. Standard sell caution advised."}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-3">
                                        <button
                                            onClick={confirmDelete}
                                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 text-lg flex items-center justify-center space-x-2"
                                        >
                                            <span>Confirm Final Removal</span>
                                        </button>
                                        <button
                                            onClick={() => setAssetToDelete(null)}
                                            className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Asset Intelligence Drawer */}
            <AnimatePresence>
                {selectedAsset && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAsset(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                                            {selectedAsset.symbol[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAsset.symbol}</h2>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{selectedAsset.asset_type} Intelligence</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedAsset(null)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                {/* Asset Health metrics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Risk Level</p>
                                        <div className="flex items-center mt-1">
                                            <span className={`text-lg font-bold ${(newsAlerts.filter(a => a.symbol === selectedAsset.symbol && a.sentiment === 'negative').length > 0) ? 'text-red-500' :
                                                (newsAlerts.filter(a => a.symbol === selectedAsset.symbol && a.sentiment === 'positive').length > 0) ? 'text-green-500' : 'text-primary-500'
                                                }`}>
                                                {newsAlerts.filter(a => a.symbol === selectedAsset.symbol && a.sentiment === 'negative').length > 0 ? 'High' :
                                                    newsAlerts.filter(a => a.symbol === selectedAsset.symbol && a.sentiment === 'positive').length > 0 ? 'Low' : 'Stable'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Current performance</p>
                                        <p className={`text-xl font-bold mt-1 ${selectedAsset.daily_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {selectedAsset.daily_change >= 0 ? '+' : ''}{selectedAsset.daily_change.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Return</p>
                                        <p className={`text-xl font-bold mt-1 ${selectedAsset.gain_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            ${Math.abs(selectedAsset.gain_loss || 0).toFixed(0)}
                                        </p>
                                    </div>
                                </div>

                                {/* News Impact Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                                        News Impact Timeline
                                    </h3>
                                    <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-700 space-y-6">
                                        {newsAlerts.filter(a => a.symbol === selectedAsset.symbol).length > 0 ? (
                                            newsAlerts.filter(a => a.symbol === selectedAsset.symbol).slice(0, 3).map((alert) => (
                                                <div key={alert.id} className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 bg-primary-500" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {new Date(alert.timestamp).toLocaleDateString()} &bull; {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{alert.title}</p>
                                                        <div className="flex items-center space-x-3 mt-2">
                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${alert.sentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                                                alert.sentiment === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                                                                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30'
                                                                }`}>
                                                                {alert.sentiment?.toUpperCase()} IMPACT
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 flex items-center">
                                                                <BrainCircuit className="w-3 h-3 mr-1" />
                                                                Rel: {(alert.relevanceScore * 100).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-4 text-xs text-gray-400 italic">No timeline events captured in this cycle.</div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Insight Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                            <BrainCircuit className="w-5 h-5 mr-2 text-primary-500" />
                                            Advisory Analysis
                                        </h3>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">Market Sentiment Trend</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${newsAlerts.find(a => a.symbol === selectedAsset.symbol)?.sentiment === 'positive' ? 'bg-green-500 text-white' :
                                                newsAlerts.find(a => a.symbol === selectedAsset.symbol)?.sentiment === 'negative' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                                                }`}>
                                                {newsAlerts.find(a => a.symbol === selectedAsset.symbol)?.sentiment || 'Neutral'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                            The AI has detected {newsAlerts.filter(a => a.symbol === selectedAsset.symbol).length} recent news events affecting {selectedAsset.symbol}.
                                            The overall outlook remains {newsAlerts.find(a => a.symbol === selectedAsset.symbol)?.sentiment || 'stable'} based on latest fundamental data.
                                        </p>
                                        <button
                                            onClick={() => handleGetAIAdvice(selectedAsset.symbol, `Deep Analysis: ${selectedAsset.symbol}`, `Latest status for ${selectedAsset.symbol} holdings.`)}
                                            className="mt-4 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/25"
                                        >
                                            Generate Strategy Advice
                                        </button>
                                    </div>
                                </div>

                                {/* Related News Impact */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                        <Bell className="w-5 h-5 mr-2 text-amber-500" />
                                        Relevant News Alerts
                                    </h3>
                                    <div className="space-y-3">
                                        {newsAlerts.filter(a => a.symbol === selectedAsset.symbol).length > 0 ? (
                                            newsAlerts.filter(a => a.symbol === selectedAsset.symbol).map(alert => (
                                                <div key={alert.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">{alert.title}</h4>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(alert.timestamp).toLocaleDateString()}</span>
                                                        <a href={alert.url} target="_blank" className="text-xs text-primary-500 font-bold flex items-center hover:underline">
                                                            Read <ExternalLink className="w-3 h-3 ml-1" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                                <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-400 font-medium">No urgent news detected for this asset in the last scanning cycle.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 border-t dark:border-gray-700">
                                    <button
                                        onClick={() => initDeleteAsset(selectedAsset)}
                                        className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition flex items-center justify-center space-x-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        <span>Remove from Portfolio</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Ask Portfolio AI FAB & Overlay */}
            <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end">
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white/80 dark:bg-[#1A1D24]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 dark:border-gray-800 w-[380px] sm:w-[420px] mb-4 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]"
                        >
                            {/* Header - Sleek & Minimal */}
                            <div className="p-5 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 flex-shrink-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                        <BrainCircuit className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">AI Commander</h3>
                                        <span className="text-[10px] font-bold text-green-500 dark:text-green-400 uppercase tracking-widest flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                                            Active Intelligence
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-5 pt-4 flex flex-col overflow-hidden min-h-[300px]">
                                <div className="flex-1 space-y-6 overflow-y-auto mb-6 scrollbar-hide">
                                    {chatMessages.length === 0 && (
                                        <div className="bg-primary-50/50 dark:bg-primary-900/10 p-5 rounded-3xl text-gray-800 dark:text-gray-200 border border-primary-100/50 dark:border-primary-900/20 text-sm font-medium leading-relaxed">
                                            <p className="mb-2">Hello! I'm your AI Portfolio Commander. 🫡</p>
                                            <p className="opacity-70 text-xs">Ask me anything about your {items.length} assets, risk exposure, or market trends.</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all overflow-hidden ${msg.role === 'user'
                                                ? 'bg-primary-600 text-white rounded-tr-sm'
                                                : 'bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700/50 rounded-tl-sm'
                                                }`}>
                                                <MarkdownRenderer content={msg.content} />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {sendingChat && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-gray-800/80 p-4 rounded-3xl border border-gray-200 dark:border-gray-700/50 flex items-center space-x-2">
                                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Command AI..."
                                        className="w-full bg-gray-100 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white transition-all shadow-inner placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        value={chatQuery}
                                        onChange={(e) => setChatQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sendingChat}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingChat || !chatQuery.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center active:scale-90"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setShowChat(!showChat)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center text-white active:scale-95 ${showChat
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rotate-90 scale-90'
                        : 'bg-gradient-to-br from-primary-600 to-indigo-700 text-white hover:scale-110 shadow-primary-500/40'
                        }`}
                >
                    {showChat ? <X className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6 sm:w-7 sm:h-7" />}
                </button>
            </div>
        </div>
    );
}
