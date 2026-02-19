import axios from 'axios';
import { parseString } from 'xml2js';
import { NewsArticle } from '../types';

export interface RSSFeed {
    id: string;
    name: string;
    url: string;
    category: 'global' | 'india' | 'tech' | 'crypto';
}

const FEEDS: RSSFeed[] = [
    // India Focus
    { id: 'et-market', name: 'Economic Times (Markets)', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', category: 'india' },
    { id: 'mint-top', name: 'LiveMint', url: 'https://www.livemint.com/rss/news', category: 'india' },
    { id: 'moneycontrol', name: 'MoneyControl', url: 'https://www.moneycontrol.com/rss/latestnews.xml', category: 'india' },

    // Global Finance
    { id: 'cnbc-finance', name: 'CNBC Finance', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', category: 'global' },
    { id: 'wsj-markets', name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'global' },
    { id: 'investing-com', name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', category: 'global' },

    // Tech & Crypto
    { id: 'coindesk', name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss', category: 'crypto' },
    { id: 'bitcoin-mag', name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/', category: 'crypto' },
    { id: 'cryptoslate', name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', category: 'crypto' },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
];

export class RSSService {
    private CORS_PROXY = '/api/rss?url=';

    async getAllNews(): Promise<NewsArticle[]> {
        // Determine which feeds to fetch based on a strategy
        // For now, let's fetch a mix: 2 India, 2 Global, 1 Crypto
        const selectedFeeds = [
            FEEDS.find(f => f.id === 'et-market')!,
            FEEDS.find(f => f.id === 'mint-top')!,
            FEEDS.find(f => f.id === 'cnbc-finance')!,
            FEEDS.find(f => f.id === 'wsj-markets')!,
            FEEDS.find(f => f.id === 'coindesk')!,
        ];

        const promises = selectedFeeds.map(feed => this.fetchFeed(feed));
        const results = await Promise.allSettled(promises);

        let allArticles: NewsArticle[] = [];

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                allArticles = [...allArticles, ...result.value];
            }
        });

        // Sort by date (newest first)
        return allArticles.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
    }

    async getNewsByCategory(category: string): Promise<NewsArticle[]> {
        const feeds = FEEDS.filter(f => f.category === category);
        if (feeds.length === 0) return [];

        const promises = feeds.map(feed => this.fetchFeed(feed));
        const results = await Promise.allSettled(promises);

        let allArticles: NewsArticle[] = [];
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                allArticles = [...allArticles, ...result.value];
            }
        });

        return allArticles.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
    }

    private async fetchFeed(feed: RSSFeed): Promise<NewsArticle[]> {
        try {
            const response = await axios.get(`${this.CORS_PROXY}${encodeURIComponent(feed.url)}`);
            if (!response.data || !response.data.contents) {
                throw new Error('Invalid response from proxy');
            }

            const xmlData = response.data.contents;

            return new Promise((resolve) => {
                parseString(xmlData, (err, result) => {
                    if (err || !result?.rss?.channel?.[0]?.item) {
                        console.error(`Failed to parse feed ${feed.name}`, err);
                        resolve([]);
                        return;
                    }

                    const items = result.rss.channel[0].item;
                    const articles: NewsArticle[] = items.slice(0, 5).map((item: any, index: number) => {
                        const fullContent = item['content:encoded']?.[0] || item.description?.[0] || '';
                        // Remove HTML tags for cleaner text analysis later logic if needed, 
                        // but keeping basic structure is okay for now.

                        return {
                            id: `${feed.id}-${index}-${Date.now()}`,
                            title: item.title?.[0] || 'No Title',
                            description: this.cleanDescription(item.description?.[0] || ''),
                            url: item.link?.[0],
                            publishedAt: item.pubDate?.[0] || new Date().toISOString(),
                            source: feed.name,
                            sentiment: 'neutral', // Calculated later
                            marketRelevance: 5, // Default
                            content: fullContent // Store full content for AI analysis
                        };
                    });

                    resolve(articles);
                });
            });
        } catch (error) {
            console.error(`Error fetching ${feed.name}:`, error);
            return [];
        }
    }

    private cleanDescription(html: string): string {
        if (!html) return '';
        // 1. Remove all style and script tags first
        let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gm, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gm, '');
        // 2. Strip all HTML tags entirely (even if broken)
        text = text.replace(/<[^>]+>/gm, '');
        // 3. Decode common HTML entities
        text = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&rsquo;/g, "'")
            .replace(/&lsquo;/g, "'")
            .replace(/&rdquo;/g, '"')
            .replace(/&ldquo;/g, '"')
            .replace(/&nbsp;/g, ' ');
        // 4. Remove leftover weirdness (like raw href strings)
        text = text.replace(/https?:\/\/\S+/g, ''); // Remove stray URLs usually found in bad RSS descriptions
        // 5. Trim and limit
        return text.trim().slice(0, 180) + (text.length > 180 ? '...' : '');
    }
}
