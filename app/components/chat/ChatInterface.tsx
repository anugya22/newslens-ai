'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, MessageSquare } from 'lucide-react';

const ChatInterface = () => {
  const { messages, isLoading, marketMode } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                NewsLens AI
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {marketMode ? 'Market Analysis Mode' : 'News Analysis Mode'}
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 text-primary-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to NewsLens AI
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {marketMode 
                  ? 'Ask about news and I\'ll provide market analysis with trends, risks, and opportunities.'
                  : 'Share a news link or ask about current events. I\'ll analyze and explain the news for you.'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-2xl">
                {[
                  "What's the latest tech news?",
                  "Analyze this article: [paste URL]",
                  marketMode ? "Market impact of recent inflation data" : "Explain blockchain technology",
                  marketMode ? "Which sectors are trending today?" : "Latest climate change news"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    className="p-3 text-sm text-left bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-200"
                    onClick={() => {
                      // Add to input (you'll implement this in ChatInput)
                    }}
                  >
                    {suggestion}
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
    </div>
  );
};

export default ChatInterface;