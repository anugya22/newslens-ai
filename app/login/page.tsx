'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, RefreshCw, ArrowLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../lib/store';

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

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    toast.error('An account with this email already exists. Please Sign In.');
                    setIsLogin(true);
                    return;
                }

                toast.success('Sign up successful! Please check your email.');
            }
        } catch (error: any) {
            if (error.message?.includes('User already registered') || error.message?.includes('unique constraint')) {
                toast.error('An account with this email already exists. Please Sign In.');
                setIsLogin(true);
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

export default function LoginPage() {
    const { user, signInWithGoogle, isLoading } = useAuth();
    const router = useRouter();
    const { settings } = useStore();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }, [settings.theme]);

    useEffect(() => {
        if (user && !isLoading) {
            window.location.href = '/dashboard';
        }
    }, [user, isLoading]);


    if (isLoading || user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 opacity-10 bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition mb-8 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
                    Back to Home
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-100 dark:border-gray-700">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Sign in to Access Global Intelligence
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center space-x-3 font-semibold text-gray-700 dark:text-gray-200"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
                            <span>Continue with Google</span>
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Or continue with email
                            </span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>

                        <AuthForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
