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
  cryptoMode: boolean;
  selectedArticle: NewsArticle | null;
  selectedAnalysis: any | null;
  pendingExplanation: string | null;

  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setMarketMode: (mode: boolean) => void;
  setCryptoMode: (mode: boolean) => void;
  setSelectedArticle: (article: NewsArticle | null) => void;
  setSelectedAnalysis: (analysis: any | null) => void;
  setPendingExplanation: (text: string | null) => void;
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
        selectedModel: 'stepfun/step-3.5-flash:free',
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
      cryptoMode: false,
      selectedArticle: null,
      selectedAnalysis: null,
      pendingExplanation: null,

      setLoading: (loading) => set({ isLoading: loading }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMarketMode: (mode) => set({ marketMode: mode, cryptoMode: mode ? false : false }), // Disable cryptoMode if marketMode is enabled
      setCryptoMode: (mode) => set({ cryptoMode: mode, marketMode: mode ? false : false }), // Disable marketMode if cryptoMode is enabled
      setSelectedArticle: (article) => set({ selectedArticle: article }),
      setSelectedAnalysis: (analysis) => set({ selectedAnalysis: analysis }),
      setPendingExplanation: (text) => set({ pendingExplanation: text }),
    }),
    {
      name: 'newslens-storage',
      partialize: (state) => ({
        settings: state.settings,
        // messages: state.messages, // Commented out to prevent persistence of chat history
      }),
    }
  )
);