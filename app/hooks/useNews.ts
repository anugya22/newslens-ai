import { useEffect, useCallback } from 'react';
import { useStore } from '../lib/store';
import { NewsService } from '../lib/apis';
import { NewsSearchParams, TrendingTopic } from '../types';
import toast from 'react-hot-toast';

export const useNews = () => {
  const { 
    news, 
    setNews, 
    trendingTopics, 
    setTrendingTopics,
    settings,
    setLoading,
    marketMode 
  } = useStore();

  const newsService = new NewsService();

  const fetchNews = useCallback(async (params: NewsSearchParams = {}) => {
    setLoading(true);
    try {
      const topic = params.query || 'latest news';
      const articles = await newsService.getNewsByTopic(topic);
      
      // Sort by relevance and date
      const sortedArticles = articles.sort((a, b) => {
        if (marketMode) {
          // In market mode, prioritize by market relevance
          const aRelevance = a.marketRelevance || 0;
          const bRelevance = b.marketRelevance || 0;
          if (aRelevance !== bRelevance) {
            return bRelevance - aRelevance;
          }
        }
        
        // Then by date
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
      
      setNews(sortedArticles);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  }, [setNews, setLoading, marketMode, newsService]);

  const searchNews = useCallback(async (params: NewsSearchParams) => {
    await fetchNews(params);
  }, [fetchNews]);

  const refreshNews = useCallback(async () => {
    await fetchNews({ query: 'breaking news' });
  }, [fetchNews]);

  const fetchTrendingTopics = useCallback(async () => {
    try {
      const topics = await newsService.getTrendingTopics();
      const trendingData: TrendingTopic[] = topics.map((topic, index) => ({
        id: `topic-${index}`,
        topic,
        count: Math.floor(Math.random() * 1000) + 100,
        sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.3 ? 'negative' : 'neutral',
        articles: news.filter(article => 
          article.title.toLowerCase().includes(topic.toLowerCase()) ||
          article.description.toLowerCase().includes(topic.toLowerCase())
        ).slice(0, 3)
      }));
      
      setTrendingTopics(trendingData);
    } catch (error) {
      console.error('Failed to fetch trending topics:', error);
    }
  }, [news, setTrendingTopics, newsService]);

  const getNewsByCategory = useCallback(async (category: string) => {
    const categoryQueries = {
      technology: 'technology AI software hardware',
      finance: 'finance banking investment stock market',
      politics: 'politics government policy election',
      health: 'health medicine healthcare coronavirus',
      business: 'business economy corporate earnings',
      science: 'science research discovery innovation',
      sports: 'sports football basketball baseball',
      entertainment: 'entertainment movies music celebrity'
    };

    const query = categoryQueries[category as keyof typeof categoryQueries] || category;
    await fetchNews({ query });
  }, [fetchNews]);

  const getMarketRelevantNews = useCallback(async () => {
    const marketKeywords = [
      'stock market',
      'Federal Reserve',
      'inflation',
      'earnings',
      'cryptocurrency',
      'economy',
      'GDP',
      'unemployment',
      'interest rates',
      'trade war'
    ];
    
    const randomKeyword = marketKeywords[Math.floor(Math.random() * marketKeywords.length)];
    await fetchNews({ query: randomKeyword });
  }, [fetchNews]);

  // Auto-refresh functionality
  useEffect(() => {
    if (settings.autoRefresh) {
      const interval = setInterval(() => {
        refreshNews();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, refreshNews]);

  // Initial load
  useEffect(() => {
    if (news.length === 0) {
      if (marketMode) {
        getMarketRelevantNews();
      } else {
        fetchNews({ query: 'breaking news' });
      }
    }
    
    if (trendingTopics.length === 0) {
      fetchTrendingTopics();
    }
  }, []);

  // Update news when market mode changes
  useEffect(() => {
    if (marketMode) {
      getMarketRelevantNews();
    } else {
      fetchNews({ query: 'latest news' });
    }
  }, [marketMode]);

  return {
    news,
    trendingTopics,
    fetchNews,
    searchNews,
    refreshNews,
    fetchTrendingTopics,
    getNewsByCategory,
    getMarketRelevantNews,
  };
};