'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { useChatAPI } from '../../hooks/useChat';
import LimitModal from '../ui/LimitModal';

const ChatInterface = () => {
  const { messages, isLoading, marketMode, cryptoMode, clearMessages, setPendingExplanation, setSelectedAnalysis } = useStore();
  const { sendMessage } = useChatAPI();
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;

    const container = messagesEndRef.current.parentElement;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (force || isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Only force scroll if the last message is from the user
    // Otherwise, only scroll if they were already at the bottom
    const lastMessage = messages[messages.length - 1];
    scrollToBottom(lastMessage?.type === 'user');
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-transparent min-h-0 relative">
      {/* Header - Simplified to avoid double header with main layout */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                NewsLens AI
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Indicator & Loading Status - Visible on Desktop */}
      <div className="hidden lg:flex flex-shrink-0 px-6 py-3 items-center justify-between border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
            {marketMode ? '📊 Market Analysis Mode' : cryptoMode ? '₿ Crypto Advisory Mode' : '📰 News Analysis Mode'}
          </span>
          <button
            onClick={() => useStore.getState().clearMessages()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 transition-all font-sans"
            title="Start a new conversation"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
        {isLoading && (
          <div className="flex items-center space-x-2 text-primary-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Analysing...</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-12 flex flex-col items-center justify-center max-w-4xl mx-auto text-center"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-6 shadow-xl"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <MessageSquare className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </motion.div>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                How can I help you today?
              </h3>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-12 leading-relaxed">
                {marketMode
                  ? 'Real-time market impact analysis, trend detection, and opportunity scoring powered by NewsLens AI.'
                  : cryptoMode
                    ? 'Expert crypto market analysis, coin sentiment tracking, and investment opportunities.'
                    : 'Get deep insights into global events. Share a link or ask about anything happening in the world.'
                }
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { text: "What's the latest tech news?", icon: "🚀", show: !marketMode && !cryptoMode },
                  { text: "Analyze this article: [paste URL]", icon: "🔗", show: !marketMode && !cryptoMode },
                  { text: "Market impact of recent inflation data", icon: "📊", show: marketMode },
                  { text: "Which sectors are trending today?", icon: "🔥", show: marketMode },
                  { text: "Is Bitcoin a good buy right now?", icon: "💰", show: cryptoMode },
                  { text: "Analyze Ethereum's recent price action", icon: "📉", show: cryptoMode }
                ].filter(item => item.show).map((item, index) => (
                  <button
                    key={index}
                    className="group relative p-4 text-left bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5"
                    onClick={() => {
                      setPendingExplanation(item.text);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary-500 transition-colors">
                        {item.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <ChatInput />
      </div>

      <LimitModal />
    </div>
  );
};

export default ChatInterface;