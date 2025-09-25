'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bot, User, TrendingUp, TrendingDown, Minus, ExternalLink, BarChart3 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { useStore } from '../../lib/store';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { marketMode } = useStore();
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
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
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
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}>
          {/* Main Message */}
          <motion.div
            className={`px-4 py-3 rounded-2xl backdrop-blur-sm border ${
              isUser
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500/30'
                : `bg-gradient-to-r ${getSentimentGradient(message.marketAnalysis?.sentiment)} text-gray-900 dark:text-white`
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start space-x-2">
              {!isUser && message.marketAnalysis && (
                <div className="flex-shrink-0 mt-1">
                  {getSentimentIcon(message.marketAnalysis.sentiment)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Market Analysis Card */}
          {!isUser && message.marketAnalysis && marketMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Market Analysis</span>
                </h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  message.marketAnalysis.sentiment === 'bullish' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : message.marketAnalysis.sentiment === 'bearish'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {message.marketAnalysis.sentiment.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Impact Score:</span>
                  <span className="font-medium">{message.marketAnalysis.impactScore}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium">{message.marketAnalysis.confidence}%</span>
                </div>
              </div>

              {/* Top Sectors */}
              {message.marketAnalysis.sectors.slice(0, 3).map((sector, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-t border-gray-200/50 dark:border-gray-700/50 first:border-t-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{sector.name}</span>
                  <div className="flex items-center space-x-2">
                    {getSentimentIcon(sector.impact)}
                    <span className="text-xs font-medium">{sector.score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* News Context Cards */}
          {!isUser && message.newsContext && message.newsContext.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md space-y-2"
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
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;