import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  BookmarkPlus,
  Share2,
  BarChart3
} from 'lucide-react';
import { GlassCard, Badge, Button } from '../ui/Button';
import { NewsArticle } from '../../types';
import { useStore } from '../../lib/store';
import { NewsService } from '../../lib/apis';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface NewsSidebarProps {
  relatedTopic?: string;
}

const NewsSidebar: React.FC<NewsSidebarProps> = ({ relatedTopic }) => {
  const { news, setNews, marketMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const newsService = new NewsService();

  useEffect(() => {
    loadTrendingTopics();
    if (relatedTopic) {
      loadRelatedNews(relatedTopic);
    } else {
      loadDefaultNews();
    }
  }, [relatedTopic]);

  const loadTrendingTopics = async () => {
    try {
      const topics = await newsService.getTrendingTopics();
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    }
  };

  const loadRelatedNews = async (topic: string) => {
    setLoading(true);
    try {
      const articles = await newsService.getNewsByTopic(topic);
      setNews(articles);
    } catch (error) {
      console.error('Failed to load related news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultNews = async () => {
    setLoading(true);
    try {
      const articles = await newsService.getNewsByTopic('breaking news');
      setNews(articles);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    loadRelatedNews(topic);
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
    <div className="h-full flex flex-col space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <h2 className="text-gray-900 dark:text-white font-semibold mb-5 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-500 dark:text-primary-400" />
            Trending Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, index) => (
              <motion.button
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 border border-white/30 rounded-full text-white hover:text-primary-200 transition-all duration-200 font-medium"
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
        className="flex-1"
      >
        <GlassCard className="p-6 h-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              {relatedTopic ? `Related: ${relatedTopic}` : 'Latest News'}
            </h2>
            {marketMode && (
              <Badge variant="info" size="sm">
                <BarChart3 className="w-3 h-3 mr-1" />
                Market Focus
              </Badge>
            )}
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
            <div className="h-full overflow-hidden">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                direction="vertical"
                spaceBetween={16}
                slidesPerView="auto"
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                className="h-full news-swiper"
              >
                {news.map((article, index) => (
                  <SwiperSlide key={article.id} className="!h-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="p-5 bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer rounded-xl border border-white/20 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-gray-900 dark:text-white font-semibold leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors line-clamp-2 mb-3">
                              {article.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-1 bg-gray-700/50 text-gray-200 rounded-md text-xs font-medium">
                                {article.source}
                              </span>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                article.sentiment === 'positive' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : article.sentiment === 'negative'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              }`}>
                                {article.sentiment || 'neutral'}
                              </span>
                              {marketMode && article.marketRelevance && (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md text-xs font-medium border border-amber-500/30">
                                  Relevance: {article.marketRelevance}/10
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {article.image && (
                            <div className="ml-4 flex-shrink-0">
                              <img
                                src={article.image}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-200 leading-relaxed line-clamp-3 mb-4">
                          {article.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-300">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{formatTimeAgo(article.publishedAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<BookmarkPlus className="w-3 h-3" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmark(article);
                              }}
                              className="p-2 hover:bg-white/20 rounded-lg"
                            />
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
                  </SwiperSlide>
                ))}
              </Swiper>
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
