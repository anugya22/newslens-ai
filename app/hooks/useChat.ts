'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';
import { OpenRouterAPI } from '../lib/apis';
import { ChatMessage, MarketAnalysis, SectorAnalysis, RiskFactor } from '../types';
import toast from 'react-hot-toast';

export const useChatAPI = () => {
  const { 
    addMessage, 
    setLoading, 
    settings, 
    marketMode,
    news 
  } = useStore();
  
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (content: string) => {
    if (!settings.openRouterKey) {
      toast.error('Please configure your OpenRouter API key in settings');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setLoading(true);
    setIsTyping(true);

    try {
      import { openRouterAPI } from '@/lib/api';
      
      // Get AI response
      const aiResponse = await openRouter.analyzeNews(content, marketMode);
      
      let marketAnalysis: MarketAnalysis | undefined;
      
      // Generate market analysis if in market mode
      if (marketMode) {
        marketAnalysis = await generateMarketAnalysis(content, aiResponse);
      }

      // Get relevant news context
      const newsContext = getRelevantNews(content);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        newsContext,
        marketAnalysis,
      };
      
      addMessage(assistantMessage);
      
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const parseLink = async (message: string, url: string) => {
    if (!settings.openRouterKey) {
      toast.error('Please configure your OpenRouter API key in settings');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setLoading(true);
    setIsTyping(true);

    try {
      const openRouter = new OpenRouterAPI(settings.openRouterKey);
      
      // Parse and analyze URL
      const analysis = await openRouter.parseAndAnalyzeURL(url, marketMode);
      
      let marketAnalysis: MarketAnalysis | undefined;
      
      if (marketMode) {
        marketAnalysis = await generateMarketAnalysis(url, analysis);
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: analysis,
        timestamp: new Date(),
        marketAnalysis,
      };
      
      addMessage(assistantMessage);
      
      // Try to fetch related news
      await fetchRelatedNews(extractKeywordsFromUrl(url));
      
    } catch (error) {
      console.error('Link parsing error:', error);
      toast.error('Failed to parse the link. Please try again.');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const generateMarketAnalysis = async (newsContent: string, aiResponse: string): Promise<MarketAnalysis> => {
    // Mock market analysis generation - in production, use AI
    const sectors: SectorAnalysis[] = [
      'Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'
    ].map(name => ({
      name,
      impact: (Math.random() > 0.5 ? 'positive' : Math.random() > 0.3 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      score: Math.floor(Math.random() * 10) + 1,
      reasoning: `${name} sector shows ${Math.random() > 0.5 ? 'strong' : 'moderate'} correlation with current market trends.`,
      stocks: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          predictedChange: (Math.random() - 0.5) * 10,
          reasoning: 'Based on current market sentiment and sector performance.',
          confidence: Math.floor(Math.random() * 30) + 70
        }
      ]
    }));

    const risks: RiskFactor[] = [
      {
        type: 'Market Volatility',
        severity: (Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        description: 'Potential market fluctuations based on current news sentiment.',
        probability: Math.random() * 0.8 + 0.2
      },
      {
        type: 'Regulatory Risk',
        severity: (Math.random() > 0.8 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        description: 'Policy changes may impact market sectors differently.',
        probability: Math.random() * 0.6 + 0.1
      }
    ];

    const sentiment: 'bullish' | 'bearish' | 'neutral' = Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral';

    return {
      sentiment,
      impactScore: Math.floor(Math.random() * 10) + 1,
      sectors,
      risks,
      opportunities: [
        'Monitor sector rotation opportunities',
        'Consider defensive positioning',
        'Evaluate growth vs. value allocation',
        'Watch for volatility trading opportunities'
      ],
      prediction: 'Market showing mixed signals with potential for increased volatility in the near term. Key sectors to watch include technology and healthcare.',
      confidence: Math.floor(Math.random() * 30) + 70
    };
  };

  const getRelevantNews = (query: string) => {
    // Filter current news based on relevance to query
    const keywords = query.toLowerCase().split(' ');
    return news.filter(article => {
      const titleWords = article.title.toLowerCase();
      const descWords = article.description.toLowerCase();
      return keywords.some(keyword => 
        titleWords.includes(keyword) || descWords.includes(keyword)
      );
    }).slice(0, 3);
  };

  const extractKeywordsFromUrl = (url: string): string[] => {
    // Simple keyword extraction from URL
    const urlParts = url.split('/');
    const keywords = urlParts
      .join(' ')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    return keywords;
  };

  const fetchRelatedNews = async (keywords: string[]) => {
    // This would fetch news related to the parsed content
    // For now, just a placeholder
    console.log('Fetching related news for:', keywords);
  };

  return {
    sendMessage,
    parseLink,
    isTyping,
  };
};
