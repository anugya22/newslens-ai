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
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
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
  historySidebarOpen: boolean;
  marketMode: boolean;
  cryptoMode: boolean;
  selectedArticle: NewsArticle | null;
  selectedAnalysis: any | null;
  pendingExplanation: string | null;
  showLimitModal: boolean;

  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setHistorySidebarOpen: (open: boolean) => void;
  setMarketMode: (mode: boolean) => void;
  setCryptoMode: (mode: boolean) => void;
  setSelectedArticle: (article: NewsArticle | null) => void;
  setSelectedAnalysis: (analysis: any | null) => void;
  setShowLimitModal: (show: boolean) => void;
  setPendingExplanation: (text: string | null) => void;

  // Session
  sessionId: string;
  setSessionId: (id: string) => void;
}

const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial settings
      settings: {
        theme: 'light',
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
      updateMessage: (id, partial) => set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === id ? { ...msg, ...partial } : msg
        ),
      })),
      removeMessage: (id) => set((state) => ({
        messages: state.messages.filter(msg => msg.id !== id),
      })),
      clearMessages: () => set({
        messages: [],
        sessionId: generateSessionId() // Generate new session when cleared
      }),

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
      historySidebarOpen: false,
      marketMode: false,
      cryptoMode: false,
      selectedArticle: null,
      selectedAnalysis: null,
      pendingExplanation: null,
      showLimitModal: false,

      // Session
      sessionId: generateSessionId(),
      setSessionId: (id) => set({ sessionId: id, messages: [] }),

      setLoading: (loading) => set({ isLoading: loading }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHistorySidebarOpen: (open) => set({ historySidebarOpen: open }),
      setMarketMode: (mode) => set((state) => {
        if (state.marketMode === mode) return {};
        const shouldClear = state.messages.length > 0;
        return {
          marketMode: mode,
          cryptoMode: mode ? false : state.cryptoMode,
          ...(shouldClear ? { messages: [], sessionId: generateSessionId() } : {})
        };
      }),
      setCryptoMode: (mode) => set((state) => {
        if (state.cryptoMode === mode) return {};
        const shouldClear = state.messages.length > 0;
        return {
          cryptoMode: mode,
          marketMode: mode ? false : state.marketMode,
          ...(shouldClear ? { messages: [], sessionId: generateSessionId() } : {})
        };
      }),
      setSelectedArticle: (article) => set({ selectedArticle: article }),
      setSelectedAnalysis: (analysis) => set({ selectedAnalysis: analysis }),
      setPendingExplanation: (text) => set({ pendingExplanation: text }),
      setShowLimitModal: (show) => set({ showLimitModal: show }),
    }),
    {
      name: 'newslens-storage',
      partialize: (state) => ({
        settings: state.settings,
        news: state.news,
        marketMode: state.marketMode,
        cryptoMode: state.cryptoMode,
        sessionId: state.sessionId,
        messages: state.messages,
      }),
    }
  )
);