'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bot, User, TrendingUp, TrendingDown, Minus, ExternalLink, BarChart3, Activity } from 'lucide-react';
import { ChatMessage } from '../../types';
import { useStore } from '../../lib/store';
import TradingViewWidget from '../market/TradingViewWidget';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { marketMode, cryptoMode } = useStore();
  const isUser = message.type === 'user';

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSentimentGradient = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish':
        return 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-green-200 dark:border-green-800';
      case 'negative':
      case 'bearish':
        return 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30 border-red-200 dark:border-red-800';
      default:
        return 'from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/70 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-[80%]`}>
        {/* Avatar */}
        <motion.div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser
            ? 'bg-gradient-to-r from-primary-500 to-primary-600'
            : 'bg-gradient-to-r from-accent-500 to-accent-600'
            }`}
          whileHover={{ scale: 1.05 }}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </motion.div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 w-full`}>
          {/* Main Message */}
          <motion.div
            className={`px-5 py-3 rounded-2xl backdrop-blur-md border ${isUser
              ? 'bg-gradient-to-tr from-primary-600 to-primary-700 text-white border-primary-500/30'
              : `bg-white/70 dark:bg-gray-800/70 ${getSentimentGradient(message.marketAnalysis?.sentiment)} text-gray-900 dark:text-white border-gray-200/50 dark:border-white/10`
              } shadow-lg shadow-black/5 dark:shadow-white/5`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start space-x-2">
              {!isUser && message.marketAnalysis && (
                <div className="flex-shrink-0 mt-1">
                  {getSentimentIcon(message.marketAnalysis.sentiment)}
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm leading-relaxed">
                  {!isUser && !message.content ? (
                    <div className="flex items-center space-x-2 py-2 px-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Market Analysis Trigger Button - On-Demand */}
          {!isUser && message.marketAnalysis && (marketMode || cryptoMode) && (
            <div className="space-y-3 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => useStore.getState().setSelectedAnalysis(message.marketAnalysis)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${message.marketAnalysis.sentiment === 'bullish'
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    : message.marketAnalysis.sentiment === 'bearish'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View {cryptoMode ? 'Crypto' : 'Market'} Analysis</span>
                  <span className="opacity-60 text-xs ml-1">
                    ({message.marketAnalysis.impactScore}/10 Impact)
                  </span>
                </button>
              </motion.div>

              {/* Candlestick Charts (Supports Multi-Ticker) */}
              {(message.marketAnalysis.symbols || [message.marketAnalysis.symbol]).map((sym, idx) => (
                sym && (
                  <motion.div
                    key={sym + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                    className="w-full space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 uppercase tracking-wider">
                      <Activity className="w-3 h-3" />
                      <span>{sym} Live Chart</span>
                    </div>
                    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-lg bg-white dark:bg-gray-800">
                      <TradingViewWidget
                        symbol={sym}
                        height={450}
                      />
                    </div>
                  </motion.div>
                )
              ))}
            </div>
          )}

          {/* News Context Cards */}
          {!isUser && message.newsContext && message.newsContext.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full space-y-2"
            >
              {message.newsContext.slice(0, 2).map((article, index) => (
                <div
                  key={index}
                  className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all cursor-pointer"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <div className="flex items-start space-x-3">
                    {article.image && (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {article.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {article.source}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Timestamp */}
          <span className={`text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'mr-2' : 'ml-2'}`}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;