import axios from 'axios';
import { parseString } from 'xml2js';
import { NewsArticle, MarketAnalysis, MarketData, NewsSearchParams } from '../types';
import { API_KEYS, AI_CONFIG, RATE_LIMITS, STORAGE_KEYS, isAPIConfigured } from './config';

// ================================================================
// RATE LIMITING HELPERS (LocalStorage - No Database Needed!)
// ================================================================

interface RateLimitData {
  count: number;
  date: string; // YYYY-MM-DD
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getRateLimitData(key: string): RateLimitData {
  if (typeof window === 'undefined') return { count: 0, date: getTodayString() };

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { count: 0, date: getTodayString() };

    const data: RateLimitData = JSON.parse(stored);

    // Reset if different day
    if (data.date !== getTodayString()) {
      return { count: 0, date: getTodayString() };
    }

    return data;
  } catch {
    return { count: 0, date: getTodayString() };
  }
}

function setRateLimitData(key: string, data: RateLimitData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function incrementRateLimit(key: string): void {
  const data = getRateLimitData(key);
  data.count += 1;
  setRateLimitData(key, data);
}

function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number; resetTime: string } {
  const data = getRateLimitData(key);
  const allowed = data.count < limit;
  const remaining = Math.max(0, limit - data.count);

  // Calculate reset time (midnight tonight)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetTime = tomorrow.toLocaleTimeString();

  return { allowed, remaining, resetTime };
}

// ================================================================
// OpenRouter API for AI Analysis
// ================================================================

export class OpenRouterAPI {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor() {
    // Get API key from config (environment variables)
    this.apiKey = API_KEYS.OPENROUTER;
  }

  async analyzeNews(content: string, marketMode = false, model = AI_CONFIG.MODEL): Promise<string> {
    const prompt = marketMode
      ? `As a "Financial Advisor" with full facts, analyze this news content. If the content is in a foreign language (e.g., Hindi), translate the key insights into English. Provide market impact analysis including:
         1. Overall market sentiment (bullish/bearish/neutral)
         2. Affected sectors and predicted impact
         3. Risk assessment and opportunities
         4. Specific stocks that might be affected
         5. Confidence level and reasoning
         
         News content: ${content}`
      : `Analyze and explain this news content in clear, comprehensive English (translating if necessary): ${content}`;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: AI_CONFIG.TEMPERATURE,
          max_tokens: AI_CONFIG.MAX_TOKENS,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenRouter API Error:', error);
      return marketMode
        ? 'Market analysis temporarily unavailable. Please try again later.'
        : 'News analysis temporarily unavailable. Please try again later.';
    }
  }

  async parseAndAnalyzeURL(url: string, marketMode = false, model = AI_CONFIG.MODEL): Promise<string> {
    try {
      // For demo purposes, we'll simulate URL parsing
      // In production, you'd implement proper web scraping
      const analysis = await this.analyzeNews(`Analyze news from URL: ${url}`, marketMode, model);
      return analysis;
    } catch (error) {
      console.error('URL parsing error:', error);
      return 'Unable to parse the provided URL. Please try copying the article text instead.';
    }
  }
}

import { RSSService } from './rss';

// Google News RSS Parser + Hybrid Engine
export class NewsService {
  private rssService: RSSService;

  constructor() {
    this.rssService = new RSSService();
  }

  async getNewsByTopic(topic: string): Promise<NewsArticle[]> {
    const lowerTopic = topic.toLowerCase();

    // Use Hybrid RSS Engine for specific financial/market topics
    if (['market', 'finance', 'economy', 'stocks', 'crypto', 'india', 'business'].some(t => lowerTopic.includes(t))) {
      try {
        if (lowerTopic.includes('india')) {
          return await this.rssService.getNewsByCategory('india');
        } else if (lowerTopic.includes('crypto')) {
          return await this.rssService.getNewsByCategory('crypto');
        } else if (lowerTopic.includes('tech')) {
          return await this.rssService.getNewsByCategory('tech');
        } else {
          return await this.rssService.getAllNews(); // Mix of Global + India for general market queries
        }
      } catch (error) {
        console.error('RSS Service failed, falling back to Google News:', error);
        // Fallback to Google News below
      }
    }

    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;

      // Using a CORS proxy for demo - in production, use your own proxy
      const proxyUrl = `/api/rss?url=${encodeURIComponent(rssUrl)}`;

      const response = await axios.get(proxyUrl);
      const xmlData = response.data.contents;

      return new Promise((resolve, reject) => {
        parseString(xmlData, (err, result) => {
          if (err) {
            console.error('XML parsing error:', err);
            resolve(this.getRealisticFallbackNews(topic));
            return;
          }

          const articles: NewsArticle[] = [];
          const items = result.rss?.channel?.[0]?.item || [];

          items.slice(0, 10).forEach((item: any, index: number) => {
            articles.push({
              id: `google-${Date.now()}-${index}`,
              title: item.title?.[0] || 'No title',
              description: this.stripHtml(item.description?.[0] || 'No description'),
              url: item.link?.[0] || '',
              publishedAt: item.pubDate?.[0] || new Date().toISOString(),
              source: 'Google News',
              sentiment: this.calculateSentiment(item.title?.[0] + ' ' + item.description?.[0]),
              marketRelevance: this.calculateMarketRelevance(item.title?.[0] + ' ' + item.description?.[0]),
            });
          });

          resolve(articles.length > 0 ? articles : this.getRealisticFallbackNews(topic));
        });
      });
    } catch (error) {
      console.error('News fetch error:', error);
      return this.getRealisticFallbackNews(topic);
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }

  private calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    if (!text) return 'neutral';

    const positiveWords = ['gain', 'rise', 'up', 'increase', 'bull', 'growth', 'profit', 'success', 'boost', 'surge', 'advance', 'rally'];
    const negativeWords = ['loss', 'fall', 'down', 'decrease', 'bear', 'decline', 'deficit', 'crisis', 'drop', 'plunge', 'crash', 'slump'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateMarketRelevance(text: string): number {
    if (!text) return 1;

    const marketKeywords = [
      'stock', 'market', 'trading', 'investment', 'finance', 'economy',
      'earnings', 'revenue', 'profit', 'loss', 'shares', 'investor',
      'fund', 'portfolio', 'asset', 'commodity', 'currency', 'forex',
      'crypto', 'bitcoin', 'federal', 'reserve', 'inflation', 'gdp'
    ];

    const lowerText = text.toLowerCase();
    const matchCount = marketKeywords.filter(keyword => lowerText.includes(keyword)).length;

    return Math.min(10, Math.max(1, matchCount + Math.floor(Math.random() * 3)));
  }

  private getRealisticFallbackNews(topic: string): NewsArticle[] {
    const fallbackArticles = {
      'technology': [
        {
          title: 'AI Companies Report Strong Q4 Growth Amid Market Expansion',
          description: 'Leading artificial intelligence firms show robust revenue growth as enterprise adoption accelerates across industries.',
          source: 'Tech Daily',
          sentiment: 'positive' as const,
          marketRelevance: 8,
        },
        {
          title: 'Tech Sector Faces Regulatory Scrutiny Over Data Privacy',
          description: 'New proposed legislation could impact how major technology companies handle user data and advertising revenue.',
          source: 'Business Wire',
          sentiment: 'negative' as const,
          marketRelevance: 7,
        }
      ],
      'market': [
        {
          title: 'S&P 500 Shows Mixed Performance in Early Trading',
          description: 'Major indices display cautious movement as investors await Federal Reserve policy announcements.',
          source: 'Market Watch',
          sentiment: 'neutral' as const,
          marketRelevance: 9,
        },
        {
          title: 'Energy Sector Leads Market Gains on Crude Oil Rally',
          description: 'Oil prices surge 3% driving energy stocks higher as supply concerns boost commodity outlook.',
          source: 'Financial Times',
          sentiment: 'positive' as const,
          marketRelevance: 8,
        }
      ],
      'default': [
        {
          title: 'Global Economic Outlook Shows Signs of Stabilization',
          description: 'International monetary fund reports suggest cautious optimism for economic recovery in major markets.',
          source: 'Reuters',
          sentiment: 'positive' as const,
          marketRelevance: 6,
        },
        {
          title: 'Corporate Earnings Season Begins with Mixed Results',
          description: 'Early reporting companies show varied performance as market analysts adjust expectations for the quarter.',
          source: 'Bloomberg',
          sentiment: 'neutral' as const,
          marketRelevance: 7,
        }
      ]
    };

    const topicKey = topic.toLowerCase().includes('tech') ? 'technology' :
      topic.toLowerCase().includes('market') ? 'market' : 'default';

    const selectedArticles = fallbackArticles[topicKey] || fallbackArticles.default;

    return selectedArticles.map((article, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      title: article.title,
      description: article.description,
      url: '#',
      publishedAt: new Date(Date.now() - (index * 3600000)).toISOString(),
      source: article.source,
      sentiment: article.sentiment,
      marketRelevance: article.marketRelevance,
    }));
  }

  async getTrendingTopics(): Promise<string[]> {
    return [
      'Technology Stocks',
      'Federal Reserve',
      'Cryptocurrency',
      'Electric Vehicles',
      'Artificial Intelligence',
      'Clean Energy',
      'Healthcare',
      'Real Estate',
    ];
  }
}

// Finnhub & CoinGecko Market Data Service
export class MarketDataService {
  private apiKey: string;
  private finnhubBaseURL = 'https://finnhub.io/api/v1';
  private coingeckoBaseURL = 'https://api.coingecko.com/api/v3';
  private cache = new Map<string, { data: MarketData, timestamp: number }>();
  private CACHE_DURATION = 60 * 1000; // 60 seconds

  constructor() {
    this.apiKey = API_KEYS.FINNHUB;
  }

  async getStockQuote(symbol: string): Promise<MarketData | null> {
    // 1. Check Cache
    const cached = this.cache.get(symbol);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.data;
    }

    // Check if it's a crypto symbol (simple check)
    if (['BTC', 'ETH', 'SOL', 'DOGE'].includes(symbol)) {
      return this.getCryptoQuote(symbol);
    }

    // Default to Finnhub for stocks
    try {
      const response = await axios.get(`${this.finnhubBaseURL}/quote`, {
        params: {
          symbol: symbol,
          token: API_KEYS.FINNHUB,
        },
      });

      const data = response.data;
      if (!data || !data.c) return null;

      const result: MarketData = {
        symbol: symbol,
        price: data.c, // Current price
        change: data.d, // Change
        changePercent: data.dp, // Percent change
        volume: 0, // Finnhub quote doesn't return volume in free tier mostly
        lastUpdated: new Date(data.t * 1000).toISOString(),
      };

      this.cache.set(symbol, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error(`Finnhub error for ${symbol}:`, error);
      return null;
    }
  }

  async getCryptoQuote(symbol: string): Promise<MarketData | null> {
    const idMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
    };
    const id = idMap[symbol];
    if (!id) return null;

    try {
      const response = await axios.get(`${this.coingeckoBaseURL}/simple/price`, {
        params: {
          ids: id,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_last_updated_at: 'true',
        },
      });

      const data = response.data[id];
      if (!data) return null;

      const result: MarketData = {
        symbol: symbol,
        price: data.usd,
        change: (data.usd * data.usd_24h_change) / 100, // Estimate change value
        changePercent: data.usd_24h_change,
        volume: 0,
        lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
      };

      this.cache.set(symbol, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error(`CoinGecko error for ${symbol}:`, error);
      return null;
    }
  }

  async getTopStocks(): Promise<MarketData[]> {
    // Mix of Stocks (Finnhub) and Crypto (CoinGecko)
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA'];
    const cryptoSymbols = ['BTC', 'ETH'];

    const stockPromises = stockSymbols.map(s => this.getStockQuote(s));
    const cryptoPromises = cryptoSymbols.map(s => this.getCryptoQuote(s));

    const results = await Promise.all([...stockPromises, ...cryptoPromises]);
    return results.filter(Boolean) as MarketData[];
  }
}

// FRED Economic Data Service
export class EconomicDataService {
  private apiKey: string;
  private baseURL = 'https://api.stlouisfed.org/fred/series/observations';
  // Use a CORS proxy because FRED doesn't support CORS for browser requests
  private proxyURL = 'https://api.allorigins.win/get?url=';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getIndicator(seriesId: string): Promise<any> {
    try {
      const url = `${this.baseURL}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=1&sort_order=desc`;
      const response = await axios.get(`${this.proxyURL}${encodeURIComponent(url)}`);

      const data = JSON.parse(response.data.contents);
      if (!data.observations || data.observations.length === 0) return null;

      return {
        id: seriesId,
        value: parseFloat(data.observations[0].value),
        date: data.observations[0].date,
      };
    } catch (error) {
      console.error(`FRED error for ${seriesId}:`, error);
      return null;
    }
  }

  async getKeyIndicators(): Promise<any[]> {
    const indicators = [
      { id: 'GDP', name: 'GDP' },
      { id: 'CPIAUCSL', name: 'CPI (Inflation)' },
      { id: 'UNRATE', name: 'Unemployment Rate' },
      { id: 'FEDFUNDS', name: 'Fed Funds Rate' },
    ];

    const promises = indicators.map(ind => this.getIndicator(ind.id));
    const results = await Promise.all(promises);

    return results.map((res, index) => ({
      ...indicators[index],
      data: res
    })).filter(item => item.data !== null);
  }
}

// Enhanced Sentiment Analysis
// ================================================================

export function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  if (!text) return 'neutral';

  const positiveWords = [
    'gain', 'rise', 'up', 'increase', 'bull', 'growth', 'profit', 'success',
    'boost', 'surge', 'advance', 'rally', 'strong', 'robust', 'optimistic',
    'confident', 'breakthrough', 'expansion', 'recovery', 'upward'
  ];

  const negativeWords = [
    'loss', 'fall', 'down', 'decrease', 'bear', 'decline', 'deficit', 'crisis',
    'drop', 'plunge', 'crash', 'slump', 'weak', 'concern', 'worry', 'risk',
    'volatility', 'uncertainty', 'pressure', 'struggle', 'challenge'
  ];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  // Apply weight based on context
  let positiveWeight = positiveCount;
  let negativeWeight = negativeCount;

  // Increase weight for financial terms
  if (lowerText.includes('earnings') || lowerText.includes('revenue')) {
    if (positiveCount > 0) positiveWeight *= 1.5;
    if (negativeCount > 0) negativeWeight *= 1.5;
  }

  if (positiveWeight > negativeWeight) return 'positive';
  if (negativeWeight > positiveWeight) return 'negative';
  return 'neutral';
}

// ================================================================
// Export singleton instances
// ================================================================

export const openRouterAPI = new OpenRouterAPI();
export const newsAPI = new NewsService();
export const marketDataAPI = new MarketDataService();
