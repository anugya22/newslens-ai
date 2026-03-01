import { NewsArticle } from '../types';
import { RSSService } from './rss';

export interface PortfolioAlert {
    id: string;
    symbol: string;
    title: string;
    description: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
    relevanceScore: number;
}

export class PortfolioNewsService {
    private rssService: RSSService;

    constructor() {
        this.rssService = new RSSService();
    }

    /**
     * Actively query Google News for specific stock symbols to guarantee news discovery.
     */
    async getNewsForSymbols(symbols: string[]): Promise<PortfolioAlert[]> {
        try {
            const alerts: PortfolioAlert[] = [];
            const CORS_PROXY = 'https://api.allorigins.win/get?url=';

            // Process all symbols in parallel
            const fetchPromises = symbols.map(async (symbol) => {
                const query = encodeURIComponent(`${symbol} stock news`);
                const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

                try {
                    // Use allorigins proxy to bypass CORS on edge/client if called directly
                    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(rssUrl)}`, { cache: 'no-store' });
                    const data = await response.json();

                    if (data && data.contents) {
                        // Very simple regex parsing for RSS XML (faster than full DOM parser for this specific use case)
                        const items = data.contents.match(/<item>([\s\S]*?)<\/item>/g) || [];

                        // Take top 3 most recent absolute news items per stock
                        for (let i = 0; i < Math.min(3, items.length); i++) {
                            const item = items[i];
                            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
                            const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
                            const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

                            if (titleMatch && linkMatch) {
                                // Clean up title (Google News appends ' - Source')
                                let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                                const url = linkMatch[1].trim();
                                const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()) : new Date();

                                alerts.push({
                                    id: `${symbol}-${Date.now()}-${i}`,
                                    symbol: symbol,
                                    title: title,
                                    description: `Latest real-time update for ${symbol}.`, // Google News descriptions are often just the title anyway
                                    url: url,
                                    sentiment: this.detectSentiment(title),
                                    timestamp: pubDate,
                                    relevanceScore: 0.9 // Direct search is highly relevant
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch news for ${symbol}:`, e);
                }
            });

            await Promise.all(fetchPromises);

            // Sort all collected alerts by recency
            return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        } catch (error) {
            console.error('Error fetching portfolio news:', error);
            return [];
        }
    }

    /**
     * Calculate how relevant a news article is to a specific stock symbol
     */
    private calculateRelevance(article: NewsArticle, symbol: string): number {
        const text = `${article.title} ${article.description}`.toLowerCase();
        const symbolLower = symbol.toLowerCase();

        let score = 0;

        // Direct symbol mention
        if (text.includes(symbolLower)) {
            score += 0.5;
        }

        // Company name mapping (comprehensive)
        const companyNames: { [key: string]: string[] } = {
            'AAPL': ['apple', 'iphone', 'ipad', 'mac', 'ios', 'tim cook'],
            'GOOGL': ['google', 'alphabet', 'android', 'gemini', 'sundar pichai'],
            'MSFT': ['microsoft', 'windows', 'azure', 'satya nadella', 'openai'],
            'TSLA': ['tesla', 'elon musk', 'electric vehicle', 'ev', 'model 3', 'cybertruck'],
            'AMZN': ['amazon', 'aws', 'bezos', 'retail', 'e-commerce'],
            'NVDA': ['nvidia', 'gpu', 'ai chip', 'h100', 'jensen huang'],
            'META': ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg', 'quest'],
            'NFLX': ['netflix', 'streaming', 'sqid game'],
            'RELIANCE': ['reliance', 'ambani', 'jio', 'retail', 'petrochemical'],
            'TCS': ['tcs', 'tata consultancy', 'tata group'],
            'HDFCBANK': ['hdfc', 'hdfc bank'],
            'INFY': ['infosys', 'narayana murthy'],
            'ICICIBANK': ['icici', 'icici bank'],
            'BTC': ['bitcoin', 'btc', 'digital gold', 'halving'],
            'ETH': ['ethereum', 'eth', 'vitalik', 'staking', 'layer 2'],
            'SOL': ['solana', 'sol', 'phantom'],
            'DOGE': ['doge', 'dogecoin'],
        };

        const keywords = companyNames[symbol.toUpperCase()] || [];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                score += 0.4; // Boost from 0.3 to 0.4 to pass the 0.3 threshold immediately
                break;
            }
        }

        // Sector/industry keywords (helper boost)
        if (text.includes('tech') || text.includes('technology')) score += 0.15;
        if (text.includes('market') || text.includes('stock') || text.includes('exchange')) score += 0.15;
        if (text.includes('crypto') || text.includes('blockchain')) score += 0.15;

        return Math.min(score, 1.0); // Cap at 1.0
    }

    /**
     * Simple sentiment detection based on keywords
     */
    private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
        const lowerText = text.toLowerCase();

        const positiveWords = ['surge', 'gain', 'profit', 'growth', 'bullish', 'rally', 'up', 'rise', 'soar', 'beat', 'success'];
        const negativeWords = ['fall', 'drop', 'loss', 'decline', 'bearish', 'crash', 'down', 'plunge', 'miss', 'fail', 'concern'];

        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of positiveWords) {
            if (lowerText.includes(word)) positiveCount++;
        }

        for (const word of negativeWords) {
            if (lowerText.includes(word)) negativeCount++;
        }

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
}
