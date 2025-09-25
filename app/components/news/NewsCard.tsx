'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Clock, Eye, Bookmark, Share2 } from 'lucide-react';
import { NewsArticle } from '../../types';
import { useStore } from '../../lib/store';
import toast from 'react-hot-toast';

interface NewsCardProps {
  article: NewsArticle;
  onClick?: () => void;
  compact?: boolean;
  showMarketData?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  onClick, 
  compact = false, 
  showMarketData = false 
}) => {
  const { marketMode } = useStore();

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentBg = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'from-green-50 to-emerald-100 dark:from-green-900/10 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50';
      case 'negative':
        return 'from-red-50 to-rose-100 dark:from-red-900/10 dark:to-rose-900/20 border-red-200 dark:border-red-800/50';
      default:
        return 'from-blue-50 to-indigo-100 dark:from-blue-900/10 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50';
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url,
        });
      } else {
        await navigator.clipboard.writeText(article.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement bookmark functionality
    toast.success('Article bookmarked!');
  };

  const handleReadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <motion.div
        onClick={onClick}
        className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 cursor-pointer transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start space-x-3">
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 text-sm">
              {article.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {article.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {article.source}
              </span>
              <div className="flex items-center space-x-2">
                {marketMode && article.sentiment && (
                  <div className={`flex items-center space-x-1 ${getSentimentColor(article.sentiment)}`}>
                    {getSentimentIcon(article.sentiment)}
                    <span className="text-xs capitalize">{article.sentiment}</span>
                  </div>
                )}
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${getSentimentBg(article.sentiment)} backdrop-blur-sm border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image */}
      {article.image && (
        <div className="relative overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleBookmark}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Sentiment Badge */}
          {marketMode && article.sentiment && (
            <div className="absolute top-4 left-4">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                article.sentiment === 'positive' 
                  ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                  : article.sentiment === 'negative'
                  ? 'bg-red-500/20 text-red-100 border border-red-400/30'
                  : 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
              }`}>
                {getSentimentIcon(article.sentiment)}
                <span className="capitalize">{article.sentiment}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-3 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm leading-relaxed">
              {article.description}
            </p>
          </div>
        </div>

        {/* Market Relevance */}
        {showMarketData && article.marketRelevance && (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Market Relevance</span>
            </h4>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${article.marketRelevance * 10}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {article.marketRelevance}/10
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <span className="font-medium">{article.source}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleReadMore}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-4 h-4" />
              <span>Read</span>
              <ExternalLink className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsCard;