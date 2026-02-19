import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const feedUrl = searchParams.get('url');

        if (!feedUrl) {
            return NextResponse.json(
                { error: 'Feed URL is required' },
                { status: 400 }
            );
        }

        const decodedUrl = decodeURIComponent(feedUrl);

        // Check cache
        const cached = cache.get(decodedUrl);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            // console.log(`Serving cached RSS: ${decodedUrl}`);
            return NextResponse.json({
                contents: cached.data,
                status: 200,
                cached: true
            });
        }

        // Fetch RSS feed directly from server (no CORS issues)
        const response = await axios.get(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 15000,
        });

        // Store in cache
        cache.set(decodedUrl, { data: response.data, timestamp: Date.now() });

        return NextResponse.json({
            contents: response.data,
            status: response.status,
            cached: false
        });

    } catch (error: any) {
        console.error('RSS Proxy Error:', error.message);

        const { searchParams } = new URL(req.url);
        // If we have stale data in cache, serve it on error as fallback
        const stale = cache.get(decodeURIComponent(searchParams.get('url') || ''));
        if (stale) {
            // console.log('Serving stale RSS due to error');
            return NextResponse.json({
                contents: stale.data,
                status: 200,
                stale: true
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch RSS feed', details: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
