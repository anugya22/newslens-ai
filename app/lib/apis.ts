import axios from 'axios';
import { NewsArticle, MarketAnalysis, MarketData, NewsSearchParams } from '../types';
import { API_KEYS, AI_CONFIG, RATE_LIMITS, STORAGE_KEYS, isAPIConfigured } from './config';
import { Redis } from '@upstash/redis';

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

  async getNewsByTopic(topic: string, countryId: string = 'global'): Promise<NewsArticle[]> {
    const lowerTopic = topic.toLowerCase();

    // Map selected country to Google News GL/HL codes
    const geoMap: Record<string, { gl: string, hl: string, ceid: string }> = {
      'us': { gl: 'US', hl: 'en-US', ceid: 'US:en' },
      'in': { gl: 'IN', hl: 'en-IN', ceid: 'IN:en' },
      'uk': { gl: 'GB', hl: 'en-GB', ceid: 'GB:en' },
      'eu': { gl: 'IE', hl: 'en-IE', ceid: 'IE:en' }, // Using Ireland as an English-speaking EU proxy
      'global': { gl: 'US', hl: 'en-US', ceid: 'US:en' }
    };

    const geo = geoMap[countryId] || geoMap['global'];

    // If explicit country requested (not global), bypass the static topic fallback to ensure localized results
    if (countryId === 'global' && ['market', 'finance', 'economy', 'stocks', 'crypto', 'india', 'business'].some(t => lowerTopic.includes(t))) {
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
      // Force recent news (last 7 days max) to avoid stale "9d ago" results
      const isServer = typeof window === 'undefined';
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}+when:7d&hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
      const finalUrl = isServer ? rssUrl : `/api/rss?url=${encodeURIComponent(rssUrl)}`;
      const response = await axios.get(finalUrl);
      const xmlData = response.data.contents || response.data;

      const itemsMatch = typeof xmlData === 'string' ? xmlData.match(/<item>([\s\S]*?)<\/item>/g) : null;

      if (!itemsMatch) {
        return this.getRealisticFallbackNews(topic);
      }

      const articles: NewsArticle[] = [];
      const items = itemsMatch.slice(0, 10);

      for (let i = 0; i < items.length; i++) {
        const itemXml = items[i];

        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);

        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'No title';
        const url = linkMatch ? linkMatch[1].trim() : '';
        const publishedAt = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
        let description = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'No description';
        description = this.stripHtml(description);

        const fullTextForSentiment = title + ' ' + description;

        articles.push({
          id: `google-${Date.now()}-${i}`,
          title,
          description,
          url,
          publishedAt,
          source: 'Google News',
          sentiment: this.calculateSentiment(fullTextForSentiment),
          marketRelevance: this.calculateMarketRelevance(fullTextForSentiment)
        });
      }

      return articles.length > 0 ? articles : this.getRealisticFallbackNews(topic);
    } catch (error) {
      console.error('News fetch error:', error);
      return this.getRealisticFallbackNews(topic);
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    // 1. Remove CDATA if still present
    let text = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

    // 2. Unescape common entities FIRST (crucial, otherwise `<` is missed because it's encoded as `&lt;`)
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&bull;/g, '•');

    // 3. Remove script/style tags
    text = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');

    // 4. Very aggressively remove ANY HTML tags, accounting for newlines within tags
    text = text.replace(/<[^>]+>/g, '');

    // 5. Clean up extra whitespace and return a clean summary
    return text.replace(/\s+/g, ' ').trim();
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
  private localCache = new Map<string, { data: MarketData, timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (local & redis)

  private redis: Redis | null = null;

  constructor() {
    this.apiKey = API_KEYS.FINNHUB;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      this.redis = new Redis({ url: redisUrl, token: redisToken });
    }
  }

  async getStockQuote(symbol: string): Promise<MarketData | null> {
    // 1. Check Local Node Cache
    const cached = this.localCache.get(symbol);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.data;
    }

    // 2. Check Redis Edge Cache
    if (this.redis) {
      try {
        const redisCached = await this.redis.get<MarketData>(`quote:${symbol}`);
        if (redisCached) {
          this.localCache.set(symbol, { data: redisCached, timestamp: Date.now() });
          return redisCached;
        }
      } catch (e) {
        console.error('Redis cache error:', e);
      }
    }

    // Check if it's a crypto symbol (Common IDs or explicitly flagged)
    const cryptoTickers = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT', 'LINK', 'MATIC', 'BNB'];
    if (cryptoTickers.includes(symbol.toUpperCase()) || symbol.includes('USDT')) {
      return this.getCryptoQuote(symbol.replace('USDT', ''));
    }

    // Default to Finnhub for stocks
    try {
      const response = await axios.get(`${this.finnhubBaseURL}/quote`, {
        params: {
          symbol: symbol,
          token: API_KEYS.FINNHUB,
        },
        timeout: 30000,
      });

      const data = response.data;

      // Finnhub sometimes returns 0 for non-US stocks. 
      // If it's valid, set cache and return.
      if (data && data.c && data.c > 0) {
        const result: MarketData = {
          symbol: symbol,
          price: data.c, // Current price
          change: data.d, // Change
          changePercent: data.dp, // Percent change
          volume: 0,
          lastUpdated: new Date(data.t * 1000).toISOString(),
        };

        this.localCache.set(symbol, { data: result, timestamp: Date.now() });
        if (this.redis) {
          this.redis.set(`quote:${symbol}`, result, { ex: 300 }).catch(e => console.error(e));
        }
        return result;
      }
    } catch (error) {
      console.warn(`Finnhub error/no data for ${symbol}. Falling back to Nifty/Yahoo Finance...`);
    }

    // Fallback to Yahoo Finance (Highly reliable for NSE/BSE Indian stocks)
    try {
      let yfSymbol = symbol;
      if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) yfSymbol = symbol;
      else if (symbol.endsWith('.NSE')) yfSymbol = symbol.replace('.NSE', '.NS');
      else if (symbol.endsWith('.BSE')) yfSymbol = symbol.replace('.BSE', '.BO');
      // If it's an Indian blue-chip without suffix, default to NSE
      else if (['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC'].includes(symbol)) yfSymbol = `${symbol}.NS`;

      const yfResponse = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=1d`, {
        timeout: 10000,
      });

      const resultArr = yfResponse.data?.chart?.result;
      if (resultArr && resultArr.length > 0) {
        const meta = resultArr[0].meta;
        if (meta && meta.regularMarketPrice) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || price;
          const result: MarketData = {
            symbol: symbol,
            price: price,
            change: price - prevClose,
            changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
            volume: meta.regularMarketVolume || 0,
            lastUpdated: new Date().toISOString(),
          };

          this.localCache.set(symbol, { data: result, timestamp: Date.now() });
          if (this.redis) {
            this.redis.set(`quote:${symbol}`, result, { ex: 300 }).catch(e => console.error(e));
          }
          return result;
        }
      }
    } catch (yfError) {
      console.warn(`Nifty/Yahoo Finance fallback failed for ${symbol}. Falling back to Alpha Vantage...`);
    }

    // Fallback to Alpha Vantage (Good for Indian/Global stocks like RELIANCE.BSE)
    if (!API_KEYS.ALPHAVANTAGE) return null;

    try {
      const alphaResponse = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: API_KEYS.ALPHAVANTAGE,
        },
        timeout: 30000,
      });

      const alphaData = alphaResponse.data['Global Quote'];
      if (!alphaData || Object.keys(alphaData).length === 0) return null;

      const result: MarketData = {
        symbol: symbol,
        price: parseFloat(alphaData['05. price']),
        change: parseFloat(alphaData['09. change']),
        changePercent: parseFloat(alphaData['10. change percent'].replace('%', '')),
        volume: parseFloat(alphaData['06. volume'] || '0'),
        lastUpdated: new Date().toISOString(),
      };

      this.localCache.set(symbol, { data: result, timestamp: Date.now() });
      if (this.redis) {
        this.redis.set(`quote:${symbol}`, result, { ex: 300 }).catch(e => console.error(e));
      }
      return result;

    } catch (fallbackError) {
      console.error(`Alpha Vantage fallback error for ${symbol}:`, fallbackError);
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
    const id = idMap[symbol] || symbol.toLowerCase();

    // 1. Check Redis Edge Cache
    if (this.redis) {
      try {
        const redisCached = await this.redis.get<MarketData>(`crypto:${symbol}`);
        if (redisCached) {
          return redisCached;
        }
      } catch (e) {
        console.error('Redis cache error:', e);
      }
    }

    try {
      const response = await axios.get(`${this.coingeckoBaseURL}/simple/price`, {
        params: {
          ids: id,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_last_updated_at: 'true',
        },
        timeout: 30000,
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

      if (this.redis) {
        // Set to expire in 5 minutes
        this.redis.set(`crypto:${symbol}`, result, { ex: 300 }).catch(e => console.error(e));
      }
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
  private redis: Redis | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      this.redis = new Redis({ url: redisUrl, token: redisToken });
    }
  }

  async getIndicator(seriesId: string): Promise<any> {
    const cacheKey = `fred_macro_${seriesId}`;

    // 1. Check Redis Cache First
    if (this.redis) {
      try {
        const cached = await this.redis.get<any>(cacheKey);
        if (cached) return cached;
      } catch (e) {
        console.error(`Redis cache read error for ${seriesId}:`, e);
      }
    }

    try {
      const url = `${this.baseURL}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=1&sort_order=desc`;
      // Calling FRED directly from server-side route
      const response = await axios.get(url, { timeout: 30000 });

      if (!response.data.observations || response.data.observations.length === 0) return null;

      const result = {
        id: seriesId,
        value: parseFloat(response.data.observations[0].value),
        date: response.data.observations[0].date,
        lastUpdated: new Date().toISOString()
      };

      // 2. Save to Redis Cache (TTL: 6 hours = 21600 seconds)
      if (this.redis) {
        this.redis.set(cacheKey, result, { ex: 21600 }).catch(e => console.error(e));
      }

      return result;
    } catch (error) {
      console.error(`FRED error for ${seriesId}:`, error);
      return null;
    }
  }

  async getKeyIndicators(): Promise<any[]> {
    const indicators = [
      { id: 'FEDFUNDS', name: 'Interest Rate' },
      { id: 'CPIAUCSL', name: 'Inflation (CPI)' },
      { id: 'UNRATE', name: 'Unemployment Rate' },
      { id: 'DGS10', name: '10Y Treasury Yield' },
      { id: 'USREC', name: 'Recession Probability' },
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
