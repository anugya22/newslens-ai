import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '../../lib/apis';
import { AI_CONFIG } from '../../lib/config';

export const dynamic = 'force-dynamic';

const marketService = new MarketDataService();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, marketMode, cryptoMode, portfolio } = body;

        // Vercel environment variables check
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const siteName = 'NewsLens AI';

        console.log('--- CHAT API DEBUG ---');
        console.log('API Route called successfully');
        console.log('API Key configured:', !!apiKey);
        console.log('Origin:', req.headers.get('origin'));
        console.log('Model forced:', AI_CONFIG.MODEL);

        if (!apiKey) {
            console.error('CRITICAL: OpenRouter API Key is missing');
            return NextResponse.json(
                { error: 'OpenRouter API Key not configured on server' },
                { status: 500 }
            );
        }

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let finalMessage = message;
        let marketDataContext = '';
        let showAnalysis = false;
        let detectedTicker = '';

        // --- SMART MODE & CRYPTO MODE LOGIC ---

        const stockRegex = /\b[a-z]{2,5}\b|\$[a-z]{2,5}|\(([a-z]{2,5})\)/gi;
        const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'doge', 'crypto', 'xrp', 'cardano'];

        const tickerMap: { [key: string]: string } = {
            'apple': 'AAPL',
            'nvidia': 'NVDA',
            'nvdia': 'NVDA',
            'tesla': 'TSLA',
            'microsoft': 'MSFT',
            'google': 'GOOGL',
            'amazon': 'AMZN',
            'meta': 'META',
            'netflix': 'NFLX',
        };

        let matches = message.match(stockRegex);
        const isCryptoQuery = cryptoKeywords.some(k => message.toLowerCase().includes(k));

        const namedTickers = Object.entries(tickerMap)
            .filter(([name]) => message.toLowerCase().includes(name))
            .map(([_, ticker]) => ticker);

        let uniqueTickers: string[] = [];
        if (matches || namedTickers.length > 0) {
            const rawMatches = (matches || []).map((m: string) => m.replace(/[()$]/g, '').toUpperCase());
            uniqueTickers = Array.from(new Set([...rawMatches, ...namedTickers]));
        }

        if (marketMode || cryptoMode) {
            if (uniqueTickers.length > 0 || isCryptoQuery) {
                showAnalysis = true;
                detectedTicker = uniqueTickers[0] || '';
            }

            if (cryptoMode && (uniqueTickers.length > 0 || isCryptoQuery)) {
                const coin = message.toLowerCase().includes('btc') ? 'BTC' :
                    message.toLowerCase().includes('eth') ? 'ETH' :
                        message.toLowerCase().includes('sol') ? 'SOL' :
                            message.toLowerCase().includes('doge') ? 'DOGE' :
                                uniqueTickers[0] || 'BTC';

                try {
                    const quote = await marketService.getCryptoQuote(coin);
                    if (quote && quote.price) {
                        const changeStr = quote.changePercent ? quote.changePercent.toFixed(2) : '0.00';
                        marketDataContext = `\n\nREAL-TIME CRYPTO DATA for ${coin}: Price: $${quote.price}, Change: ${changeStr}%`;
                        detectedTicker = `BINANCE:${coin}USDT`;
                    }
                } catch (err) {
                    console.error('Crypto Fetch Error:', err);
                }
            }
            else if (marketMode && uniqueTickers.length > 0) {
                const tickersToFetch = uniqueTickers.slice(0, 3);
                const dataPromises = tickersToFetch.map(ticker => marketService.getStockQuote(ticker));

                try {
                    const results = await Promise.all(dataPromises);
                    let dataStrings: string[] = [];

                    results.forEach((quote, idx) => {
                        if (quote && quote.price) {
                            const ticker = tickersToFetch[idx];
                            const changeStr = quote.changePercent ? quote.changePercent.toFixed(2) : '0.00';
                            dataStrings.push(`${ticker}: $${quote.price} (${changeStr}%)`);
                        }
                    });

                    if (dataStrings.length > 0) {
                        marketDataContext = `\n\nREAL-TIME MARKET DATA:\n${dataStrings.join('\n')}`;
                    }
                } catch (err) {
                    console.error('Stock Fetch Error:', err);
                }
            }
        }

        let systemPrompt = `You are NewsLens AI, a helpful news assistant. ${portfolio && portfolio.length > 0 ? `The user holds these assets: [${portfolio.join(', ')}]. Prioritize news impacting these stocks.` : ''}`;

        if (cryptoMode) {
            systemPrompt = `You are a "Crypto Degen" and Expert Analyst.
             Style: Use crypto slang (HODL, moon, bearish divergence) but keep it professional enough for advice.
             Focus: Price action, sentiment, and technicals.
             ${portfolio && portfolio.length > 0 ? `The user is tracking: [${portfolio.join(', ')}].` : ''}
             ${marketDataContext}

             CRITICAL INSTRUCTION:
             - If Real-Time Data is provided above, USE IT. Cite the exact price.
             - Do NOT output raw JSON or code snippets in your response. Focus on text analysis.`;
        } else if (marketMode) {
            systemPrompt = `You are a Professional Financial Analyst (Wall Street style).
             Style: Professional, data-driven, concise.
             Focus: Market impact, sector rotation, macroeconomics.
             ${portfolio && portfolio.length > 0 ? `The user is tracking: [${portfolio.join(', ')}].` : ''}
             ${marketDataContext}

             CRITICAL INSTRUCTION:
             - If Real-Time Data is provided above, USE IT.
             - Do NOT output raw JSON or code snippets in your response. Focus on text analysis.`;
        }

        // Strictly using AI_CONFIG.MODEL to ensure it is ALWAYS stepfun/step-3.5-flash:free as requested
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': siteUrl,
                'X-Title': siteName,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: finalMessage }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `OpenRouter responded with status ${response.status}`);
        }

        const data = await response.json();
        const aiContent = data.choices[0]?.message?.content || 'Failed to generate response.';

        let marketAnalysis = undefined;

        if (showAnalysis && (detectedTicker || uniqueTickers.length > 0)) {
            const isBullish = aiContent.toLowerCase().includes('bullish') || aiContent.toLowerCase().includes('positive');
            const isBearish = aiContent.toLowerCase().includes('bearish') || aiContent.toLowerCase().includes('negative');

            marketAnalysis = {
                sentiment: isBullish ? 'bullish' : isBearish ? 'bearish' : 'neutral',
                impactScore: 8,
                confidence: 90,
                symbol: uniqueTickers[0] || detectedTicker,
                symbols: uniqueTickers.length > 0 ? uniqueTickers : [detectedTicker],
                sectors: [{
                    name: cryptoMode ? 'Cryptocurrency' : 'Technology',
                    impact: isBullish ? 'positive' : 'negative',
                    score: 9,
                    reasoning: 'Based on real-time price action.',
                    stocks: (uniqueTickers.length > 0 ? uniqueTickers : [detectedTicker]).map(t => ({
                        symbol: t,
                        name: t,
                        predictedChange: 0,
                        reasoning: 'Real-time market data',
                        confidence: 95
                    }))
                }],
                risks: [],
                opportunities: [],
                prediction: `Current trend analysis for ${uniqueTickers.join(', ')}.`
            };
        }

        return NextResponse.json({
            content: aiContent,
            marketAnalysis: marketAnalysis
        });

    } catch (error: any) {
        console.error('--- API ROUTE ERROR ---');
        console.error('Message:', error.message);

        return NextResponse.json(
            { error: `Chat Error: ${error.message}` },
            { status: 500 }
        );
    }
}
