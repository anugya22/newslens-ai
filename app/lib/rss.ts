import axios from 'axios';
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
    private isServer = typeof window === 'undefined';
    private CORS_PROXY = '/api/rss?url=';

    private getFetchUrl(url: string): string {
        if (this.isServer) return url; // Fetch directly on server
        return `${this.CORS_PROXY}${encodeURIComponent(url)}`;
    }

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

        // Filter: Keep only articles published within the last 48 hours
        const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);

        allArticles = allArticles.filter(article => {
            const articleTime = new Date(article.publishedAt).getTime();
            return articleTime >= fortyEightHoursAgo && articleTime <= Date.now() + (60 * 60 * 1000); // Also prevent far future dates
        });

        // Sort by strict Date (newest first)
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

        // Filter: Keep only articles published within the last 48 hours
        const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);

        allArticles = allArticles.filter(article => {
            const articleTime = new Date(article.publishedAt).getTime();
            return articleTime >= fortyEightHoursAgo && articleTime <= Date.now() + (60 * 60 * 1000);
        });

        return allArticles.sort((a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
    }

    private async fetchFeed(feed: RSSFeed): Promise<NewsArticle[]> {
        try {
            const fetchUrl = this.getFetchUrl(feed.url);
            const response = await axios.get(fetchUrl);
            // Some feeds return data directly, some wrap in 'contents' from our proxy
            const xmlData = response.data.contents || response.data;
            const itemsMatch = typeof xmlData === 'string' ? xmlData.match(/<item>([\s\S]*?)<\/item>/g) : null;

            if (!itemsMatch) {
                console.error(`Failed to parse feed ${feed.name}`);
                return [];
            }

            const items = itemsMatch.slice(0, 5);
            const articles: NewsArticle[] = [];

            for (let i = 0; i < items.length; i++) {
                const itemXml = items[i];
                const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
                const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);

                const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'No Title';
                const url = linkMatch ? linkMatch[1].trim() : '';

                // Parse date safely
                let publishedAt = new Date().toISOString();
                if (pubDateMatch) {
                    const parsedDate = new Date(pubDateMatch[1].trim());
                    if (!isNaN(parsedDate.getTime())) {
                        publishedAt = parsedDate.toISOString();
                    }
                }

                let rawDescription = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
                let rawContent = contentMatch ? contentMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

                const fullContent = rawContent || rawDescription || '';

                articles.push({
                    id: `${feed.id}-${i}-${Date.now()}`,
                    title,
                    description: this.cleanDescription(rawDescription),
                    url,
                    publishedAt,
                    source: feed.name,
                    sentiment: 'neutral',
                    marketRelevance: 5,
                    content: fullContent
                });
            }

            return articles;
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
