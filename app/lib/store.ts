import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, AppSettings, NewsArticle, TrendingTopic, MarketData } from '../types';

interface AppStore {
  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  // News
  news: NewsArticle[];
  trendingTopics: TrendingTopic[];
  setNews: (articles: NewsArticle[]) => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  
  // Market Data
  marketData: MarketData[];
  setMarketData: (data: MarketData[]) => void;
  
  // UI State
  isLoading: boolean;
  sidebarOpen: boolean;
  marketMode: boolean;
  selectedArticle: NewsArticle | null;
  
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setMarketMode: (mode: boolean) => void;
  setSelectedArticle: (article: NewsArticle | null) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial settings
      settings: {
        theme: 'dark',
        marketMode: false,
        autoRefresh: true,
        notifications: true,
      },
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
      
      // Chat state
      messages: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),
      clearMessages: () => set({ messages: [] }),
      
      // News state
      news: [],
      trendingTopics: [],
      setNews: (articles) => set({ news: articles }),
      setTrendingTopics: (topics) => set({ trendingTopics: topics }),
      
      // Market data
      marketData: [],
      setMarketData: (data) => set({ marketData: data }),
      
      // UI state
      isLoading: false,
      sidebarOpen: false,
      marketMode: false,
      selectedArticle: null,
      
      setLoading: (loading) => set({ isLoading: loading }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMarketMode: (mode) => set({ marketMode: mode }),
      setSelectedArticle: (article) => set({ selectedArticle: article }),
    }),
    {
      name: 'newslens-storage',
      partialize: (state) => ({
        settings: state.settings,
        messages: state.messages,
      }),
    }
  )
);