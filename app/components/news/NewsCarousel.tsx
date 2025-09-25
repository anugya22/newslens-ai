'use client';

import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Newspaper, TrendingUp } from 'lucide-react';
import { useStore } from '../../lib/store';
import NewsCard from './NewsCard';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const NewsCarousel = () => {
  const { news, marketMode, isLoading, setSelectedArticle } = useStore();
  const swiperRef = useRef<any>(null);

  const relevantNews = news.slice(0, 10); // Limit to top 10 articles

  useEffect(() => {
    // Auto-refresh logic could be added here
  }, []);

  if (isLoading && news.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No News Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start a conversation to get relevant news articles and analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 flex items-center justify-center">
              {marketMode ? (
                <TrendingUp className="w-4 h-4 text-white" />
              ) : (
                <Newspaper className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {marketMode ? 'Market-Relevant News' : 'Latest News'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {relevantNews.length} articles
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 p-4">
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          effect="coverflow"
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1.2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 1.5,
              spaceBetween: 25,
            },
            1024: {
              slidesPerView: 2,
              spaceBetween: 30,
            },
          }}
          className="h-full news-swiper"
        >
          {relevantNews.map((article, index) => (
            <SwiperSlide key={article.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <NewsCard
                  article={article}
                  onClick={() => setSelectedArticle(article)}
                  compact={false}
                  showMarketData={marketMode}
                />
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom CSS for Swiper */}
      <style jsx global>{`
        .news-swiper .swiper-pagination-bullet {
          background: rgba(59, 130, 246, 0.5);
          opacity: 1;
        }
        .news-swiper .swiper-pagination-bullet-active {
          background: #3b82f6;
          transform: scale(1.2);
        }
        .news-swiper .swiper-slide {
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default NewsCarousel;