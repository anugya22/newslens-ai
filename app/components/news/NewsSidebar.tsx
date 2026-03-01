'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  ExternalLink,
  BookmarkPlus,
  Share2,
  BarChart3,
  Bitcoin,
  Globe,
  Tag,
  RefreshCw,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useChatAPI } from '../../hooks/useChat';
import { GlassCard, Badge, Button } from '../ui/Button';
import { NewsArticle } from '../../types';
import { useStore } from '../../lib/store';
import { NewsService } from '../../lib/apis';
import { SentimentHeatmap } from './SentimentHeatmap';

interface NewsSidebarProps {
  relatedTopic?: string;
}

const NewsSidebar: React.FC<NewsSidebarProps> = ({ relatedTopic }) => {
  const { news, setNews, marketMode, cryptoMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('global');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States for dropdown arrow animation
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const newsService = new NewsService();
  const chatAPI = useChatAPI();

  const COUNTRIES = [
    { id: 'global', name: 'Global' },
    { id: 'us', name: 'United States' },
    { id: 'in', name: 'India' },
    { id: 'uk', name: 'United Kingdom' },
    { id: 'eu', name: 'Europe' }
  ];

  const TOPICS = [
    { id: 'all', name: 'All Topics' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'finance', name: 'Finance' },
    { id: 'crypto', name: 'Crypto' }
  ];

  useEffect(() => {
    loadTrendingTopics();
  }, []);

  useEffect(() => {
    let query = relatedTopic || '';

    if (selectedTopic !== 'all') {
      query += ` ${selectedTopic}`;
    }

    if (selectedCountry !== 'global') {
      const countryName = COUNTRIES.find(c => c.id === selectedCountry)?.name || '';
      query += ` ${countryName}`;
    }

    if (query.trim()) {
      loadRelatedNews(query.trim(), selectedCountry);
    } else {
      loadDefaultNews(selectedCountry);
    }
  }, [relatedTopic, selectedCountry, selectedTopic]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [relatedTopic, selectedCountry, selectedTopic]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    let query = relatedTopic || '';
    if (selectedTopic !== 'all') query += ` ${selectedTopic}`;

    if (query.trim()) {
      await loadRelatedNews(query.trim(), selectedCountry);
    } else {
      await loadDefaultNews(selectedCountry);
    }
    setIsRefreshing(false);
  };


  const loadTrendingTopics = async () => {
    try {
      const topics = await newsService.getTrendingTopics();
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    }
  };

  const loadRelatedNews = async (topic: string, country: string) => {
    setLoading(true);
    try {
      const articles = await newsService.getNewsByTopic(topic, country);
      setNews(articles);
    } catch (error) {
      console.error('Failed to load related news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultNews = async (country: string) => {
    setLoading(true);
    try {
      const articles = await newsService.getNewsByTopic('breaking news', country);
      setNews(articles);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    // If user clicks a trending topic, we temporarily override the dropdowns
    loadRelatedNews(topic, selectedCountry);
  };

  const handleBookmark = (article: NewsArticle) => {
    console.log('Bookmarked:', article.title);
  };

  const handleShare = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
      });
    } else {
      navigator.clipboard.writeText(article.url);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="flex flex-col space-y-6 pt-6 px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-4">
          <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
            Trending Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, index) => (
              <motion.button
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 rounded-full text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 font-medium backdrop-blur-md shadow-sm"
                onClick={() => handleTopicClick(topic)}
              >
                {topic}
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-0"
      >
        <GlassCard className="p-4 flex flex-col h-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {relatedTopic ? `Latest: ${relatedTopic}` : 'Latest News'}
              </h2>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Refresh News"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex gap-2">
              {marketMode && (
                <Badge variant="info" size="sm">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Market Focus
                </Badge>
              )}
              {cryptoMode && (
                <Badge variant="warning" size="sm">
                  <Bitcoin className="w-3 h-3 mr-1" />
                  Crypto Focus
                </Badge>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[120px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedCountry}
                onFocus={() => setIsCountryOpen(true)}
                onBlur={() => setIsCountryOpen(false)}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setIsCountryOpen(false);
                }}
                className="block w-full pl-9 pr-10 py-2 text-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer outline-none transition-all"
              >
                {COUNTRIES.map(country => (
                  <option key={country.id} value={country.id} className="bg-white dark:bg-gray-800">
                    {country.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <motion.div animate={{ rotate: isCountryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </motion.div>
              </div>
            </div>

            <div className="relative flex-1 min-w-[120px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedTopic}
                onFocus={() => setIsTopicOpen(true)}
                onBlur={() => setIsTopicOpen(false)}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setIsTopicOpen(false);
                }}
                className="block w-full pl-9 pr-10 py-2 text-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer outline-none transition-all"
              >
                {TOPICS.map(topic => (
                  <option key={topic.id} value={topic.id} className="bg-white dark:bg-gray-800">
                    {topic.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <motion.div animate={{ rotate: isTopicOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </motion.div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/15 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/15 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 space-y-4 pr-2">

              {/* newly added Sentiment Heatmap */}
              {news.length > 0 && (
                <div className="mb-6">
                  <SentimentHeatmap news={news} />
                </div>
              )}

              {news.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div
                    onClick={() => window.open(article.url, '_blank')}
                    className="p-5 bg-white/60 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/80 transition-all duration-300 cursor-pointer rounded-2xl border border-gray-200/60 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:-translate-y-1 group"
                  >
                    {/* Article Header */}
                    <div className="flex flex-col mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-gray-900 dark:text-white font-bold leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors text-base line-clamp-2">
                          {article.title}
                        </h3>
                        {article.image && (
                          <div className="ml-3 flex-shrink-0">
                            <img
                              src={article.image}
                              alt=""
                              className="w-16 h-16 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                          {article.source}
                        </span>
                        <Badge variant={getSentimentColor(article.sentiment) as any} size="sm">
                          {article.sentiment || 'neutral'}
                        </Badge>
                        <Badge variant="warning" size="sm">
                          Rel: {article.marketRelevance}/10
                        </Badge>
                      </div>
                    </div>

                    {/* Article Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4 font-medium">
                      {article.description}
                    </p>

                    {/* Article Footer */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{formatTimeAgo(article.publishedAt)}</span>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<MessageSquare className="w-3 h-3 text-primary-500" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            chatAPI.sendMessage(`Explain this news piece to me in easy terms and tell me what will be impacted: ${article.url}`);
                          }}
                          className="p-2 py-1 hover:bg-white/20 rounded-lg text-xs font-bold"
                        >
                          Explain this
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Share2 className="w-3 h-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(article);
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ExternalLink className="w-3 h-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(article.url, '_blank');
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <style jsx global>{`
        .news-swiper .swiper-button-next,
        .news-swiper .swiper-button-prev {
          color: rgba(255, 255, 255, 0.8);
          scale: 0.7;
        }
        
        .news-swiper .swiper-button-next:hover,
        .news-swiper .swiper-button-prev:hover {
          color: rgb(255, 255, 255);
        }
        
        .news-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.4);
          opacity: 0.7;
        }
        
        .news-swiper .swiper-pagination-bullet-active {
          background: rgb(255, 255, 255);
          opacity: 1;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default NewsSidebar;
