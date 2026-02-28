'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ChatSession {
    session_id: string;
    mode: string;
    created_at: string;
    preview: string;
}

export default function HistorySidebar() {
    const { historySidebarOpen, setHistorySidebarOpen, setSessionId, clearMessages, sessionId } = useStore();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (historySidebarOpen && user) {
            fetchHistory();
        }
    }, [historySidebarOpen, user]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Group chat history by session_id and get the first message as preview
            const { data, error } = await supabase
                .from('chat_history')
                .select('session_id, mode, content, created_at, role')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true }); // Ascending to get the first message of each session easily

            if (error) throw error;

            if (data) {
                // Manually group since Supabase RPC/distinct can be tricky without custom SQL
                const grouped = new Map<string, ChatSession>();

                // Reverse to process newest first, but the query gave oldest first so the first message inserted per session is the title
                data.forEach((msg) => {
                    if (msg.role === 'user' && !grouped.has(msg.session_id)) {
                        grouped.set(msg.session_id, {
                            session_id: msg.session_id,
                            mode: msg.mode,
                            created_at: msg.created_at,
                            preview: msg.content.substring(0, 40) + (msg.content.length > 40 ? '...' : '')
                        });
                    }
                });

                // Sort by newest session
                const sortedSessions = Array.from(grouped.values()).sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setSessions(sortedSessions);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
            toast.error('Failed to load chat history');
        } finally {
            setLoading(false);
        }
    };

    const loadSession = async (oldSessionId: string) => {
        if (oldSessionId === sessionId) {
            setHistorySidebarOpen(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('chat_history')
                .select('*')
                .eq('session_id', oldSessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setSessionId(oldSessionId);
                // Clear existing messages implicitly handled by store but let's be explicit
                useStore.setState({ messages: [] });

                // Add messages locally
                data.forEach(msg => {
                    useStore.getState().addMessage({
                        id: msg.id,
                        type: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content,
                        timestamp: new Date(msg.created_at).toISOString()
                    });
                });

                setHistorySidebarOpen(false);
            }
        } catch (error) {
            console.error('Error loading session:', error);
            toast.error('Failed to load session');
        }
    };

    const startNewChat = () => {
        clearMessages(); // This automatically generates a new session id inside store
        setHistorySidebarOpen(false);
    };

    const deleteSession = async (e: React.MouseEvent, sid: string) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('chat_history')
                .delete()
                .eq('session_id', sid);

            if (error) throw error;

            setSessions(prev => prev.filter(s => s.session_id !== sid));
            if (sid === sessionId) {
                startNewChat();
            }
            toast.success('Session deleted');
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Failed to delete session');
        }
    };

    return (
        <>
            {/* Dark Overlay */}
            <AnimatePresence>
                {historySidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setHistorySidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-[120] w-64 bg-gray-50 dark:bg-[#171717] border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out flex flex-col
                    lg:relative lg:z-[10] lg:shadow-none lg:flex-shrink-0 lg:h-full lg:transform-none
                    ${historySidebarOpen ? 'translate-x-0 lg:w-64 lg:opacity-100' : '-translate-x-full lg:hidden lg:w-0'}
                `}
            >
                <div className="flex flex-col h-full bg-transparent lg:pt-24">
                    {/* Header & New Chat Button combined */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
                        <button
                            onClick={startNewChat}
                            className="flex-1 flex items-center justify-between px-3 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg transition group font-medium"
                        >
                            <div className="flex items-center space-x-2">
                                <Plus className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition" />
                                <span className="text-sm">New chat</span>
                            </div>
                            <Clock className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <button
                            onClick={() => setHistorySidebarOpen(false)}
                            className="ml-2 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {!user ? (
                            <div className="text-center p-6 text-gray-500 text-sm">
                                <p>Please log in to view and save your chat history.</p>
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center p-6">
                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center p-6 text-gray-500 text-sm">
                                <p>No chat history available.</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.session_id}
                                    onClick={() => loadSession(session.session_id)}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${session.session_id === sessionId
                                        ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start space-x-3 overflow-hidden">
                                        <MessageSquare className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {session.preview}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-[10px] uppercase font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40 px-1.5 py-0.5 rounded">
                                                    {session.mode}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(e, session.session_id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
