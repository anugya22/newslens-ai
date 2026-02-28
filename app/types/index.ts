export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: string;
  content?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  marketRelevance?: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  newsContext?: NewsArticle[];
  marketAnalysis?: MarketAnalysis;
}

export interface MarketAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impactScore: number;
  sectors: SectorAnalysis[];
  risks: RiskFactor[];
  opportunities: string[];
  prediction: string;
  confidence: number;
  symbol?: string;
  symbols?: string[];
}

export interface SectorAnalysis {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  score: number;
  reasoning: string;
  stocks?: StockImpact[];
}

export interface StockImpact {
  symbol: string;
  name: string;
  price?: number;
  currency?: string;
  predictedChange: number;
  reasoning: string;
  confidence: number;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  probability: number;
}

export interface AppSettings {
  openRouterKey?: string;
  newsApiKey?: string;
  alphaVantageKey?: string;
  economicDataKey?: string; // FRED API Key
  selectedModel?: string; // New field for model selection
  theme: 'light' | 'dark';
  marketMode: boolean;
  autoRefresh: boolean;
  notifications: boolean;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  articles: NewsArticle[];
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface NewsSearchParams {
  query?: string;
  category?: string;
  sources?: string[];
  sortBy?: 'relevance' | 'popularity' | 'publishedAt';
  pageSize?: number;
  page?: number;
}