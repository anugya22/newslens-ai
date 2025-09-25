'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Grid, List, TrendingUp, Clock } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNews } from '../../hooks/useNews';
import NewsCard from './NewsCard';
import { NewsSearchParams } from '../../types';

const NewsFeed = () => {
  const { news, marketMode, isLoading, setSelectedArticle } = useStore();
  const { refreshNews, searchNews } = useNews();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'relevance' | 'popularity'>('publishedAt');
  const [filteredNews, setFilteredNews] = useState(news);

  useEffect(() => {
    let filtered = [...news];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'publishedAt':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'relevance':
          return (b.marketRelevance || 0) - (a.marketRelevance || 0);
        case 'popularity':
          // Simulate popularity based on a combination of factors
          const aPopularity = (a.marketRelevance || 0) + (Math.random() * 10);
          const bPopularity = (b.marketRelevance || 0) + (Math.random() * 10);
          return bPopularity - aPopularity;
        default:
          return 0;
      }
    });

    setFilteredNews(filtered);
  }, [news, searchQuery, sortBy]);

  const handleRefresh = async () => {
    try {
      await refreshNews();
    } catch (error) {
      console.error('Failed to refresh news:', error);
    }
  };

  const handleSearch = async (params: NewsSearchParams) => {
    try {
      await searchNews(params);
    } catch (error) {
      console.error('Failed to search news:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex flex-col space-y-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {marketMode ? 'Market News' : 'Latest News'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh news"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="publishedAt">Latest First</option>
              <option value="relevance">Most Relevant</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Technology', value: 'technology' },
              { label: 'Finance', value: 'finance' },
              { label: 'Politics', value: 'politics' },
              { label: 'Health', value: 'health' },
            ].map((filter, index) => (
              <button
                key={index}
                onClick={() => handleSearch({ query: filter.value })}
                className="px-3 py-1.5 text-sm bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && news.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading news articles...</p>
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No articles found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search terms or filters.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredNews.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NewsCard
                      article={article}
                      onClick={() => setSelectedArticle(article)}
                      showMarketData={marketMode}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredNews.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <NewsCard
                      article={article}
                      onClick={() => setSelectedArticle(article)}
                      compact={true}
                      showMarketData={marketMode}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{filteredNews.length} articles</span>
            {marketMode && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Market mode active</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;