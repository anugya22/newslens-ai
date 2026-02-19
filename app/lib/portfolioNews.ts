import { NewsArticle } from '../types';
import { RSSService } from './rss';

interface PortfolioAlert {
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
     * Scan news for mentions of specific stock symbols
     */
    async getNewsForSymbols(symbols: string[]): Promise<PortfolioAlert[]> {
        try {
            // Fetch all news from RSS
            const allNews = await this.rssService.getAllNews();

            const alerts: PortfolioAlert[] = [];

            // Filter news that mentions any of the portfolio symbols
            for (const article of allNews) {
                for (const symbol of symbols) {
                    const relevanceScore = this.calculateRelevance(article, symbol);

                    if (relevanceScore > 0.3) { // Threshold for relevance
                        alerts.push({
                            id: `${symbol}-${article.id}`,
                            symbol: symbol,
                            title: article.title,
                            description: article.description,
                            url: article.url,
                            sentiment: this.detectSentiment(article.title + ' ' + article.description),
                            timestamp: new Date(article.publishedAt),
                            relevanceScore: relevanceScore
                        });
                    }
                }
            }

            // Sort by relevance and recency
            return alerts.sort((a, b) => {
                const scoreA = a.relevanceScore * 0.7 + (new Date(b.timestamp).getTime() / 1000000000) * 0.3;
                const scoreB = b.relevanceScore * 0.7 + (new Date(a.timestamp).getTime() / 1000000000) * 0.3;
                return scoreB - scoreA;
            });

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

        // Company name mapping (basic - can be expanded)
        const companyNames: { [key: string]: string[] } = {
            'AAPL': ['apple', 'iphone', 'ipad', 'mac'],
            'GOOGL': ['google', 'alphabet', 'android'],
            'MSFT': ['microsoft', 'windows', 'azure'],
            'TSLA': ['tesla', 'elon musk', 'electric vehicle'],
            'AMZN': ['amazon', 'aws', 'bezos'],
            'NVDA': ['nvidia', 'gpu', 'ai chip'],
            'META': ['meta', 'facebook', 'instagram', 'whatsapp'],
            'NFLX': ['netflix', 'streaming'],
            'BTC': ['bitcoin', 'btc'],
            'ETH': ['ethereum', 'eth'],
        };

        const keywords = companyNames[symbol.toUpperCase()] || [];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                score += 0.3;
                break;
            }
        }

        // Sector/industry keywords
        if (text.includes('tech') || text.includes('technology')) score += 0.1;
        if (text.includes('market') || text.includes('stock')) score += 0.1;

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
