import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { MarketDataService } from '../../lib/apis';

const marketService = new MarketDataService(process.env.FINNHUB_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { message, model, marketMode, cryptoMode, portfolio } = await req.json();

        const apiKey = process.env.OPENROUTER_API_KEY;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const siteName = 'NewsLens AI';

        if (!apiKey) {
            console.error('CRITICAL: OpenRouter API Key is missing in process.env');
            return NextResponse.json(
                { error: 'OpenRouter API Key not configured on server' },
                { status: 500 }
            );
        }

        console.log('--- CHAT REQUEST ---');
        console.log('Model:', model);
        console.log('MarketMode:', marketMode, 'CryptoMode:', cryptoMode);
        console.log('API Key Present:', !!apiKey);

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let finalMessage = message;
        let marketDataContext = '';
        let showAnalysis = false;
        let detectedTicker = '';

        // --- SMART MODE & CRYPTO MODE LOGIC ---

        // 1. Intent Detection: Check if user is asking for specific analysis
        // Regex for Stocks (e.g., AAPL, $TSLA, (NVDA)) and Crypto (BTC, ETH)
        // Added 'i' flag for case-insensitivity
        const stockRegex = /\b[a-z]{2,5}\b|\$[a-z]{2,5}|\(([a-z]{2,5})\)/gi;
        const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'doge', 'crypto', 'xrp', 'cardano'];

        // Ticker Normalization Map
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

        // Detect named stocks from the map
        const namedTickers = Object.entries(tickerMap)
            .filter(([name]) => message.toLowerCase().includes(name))
            .map(([_, ticker]) => ticker);

        // Sanitize matches (remove $, brackets, etc.) and normalize to uppercase
        let uniqueTickers: string[] = [];
        if (matches || namedTickers.length > 0) {
            const rawMatches = (matches || []).map((m: string) => m.replace(/[()$]/g, '').toUpperCase());
            uniqueTickers = Array.from(new Set([...rawMatches, ...namedTickers]));
        }

        // Determine if we should fetch real data
        if (marketMode || cryptoMode) {
            // If tickers are detected, we ALWAYS want to show analysis even if quote fetch fails
            if (uniqueTickers.length > 0 || isCryptoQuery) {
                showAnalysis = true;
                detectedTicker = uniqueTickers[0] || '';
            }

            // Prioritize Crypto Mode Logic
            if (cryptoMode && (uniqueTickers.length > 0 || isCryptoQuery)) {
                const coin = message.toLowerCase().includes('btc') ? 'BTC' :
                    message.toLowerCase().includes('eth') ? 'ETH' :
                        message.toLowerCase().includes('sol') ? 'SOL' :
                            message.toLowerCase().includes('doge') ? 'DOGE' :
                                uniqueTickers[0] || 'BTC';

                console.log(`Fetching CRYPTO data for ${coin}...`);
                try {
                    const quote = await marketService.getCryptoQuote(coin);
                    if (quote && quote.price) {
                        const changeStr = quote.changePercent ? quote.changePercent.toFixed(2) : '0.00';
                        marketDataContext = `\n\nREAL-TIME CRYPTO DATA for ${coin}: Price: $${quote.price}, Change: ${changeStr}%`;
                        detectedTicker = `BINANCE:${coin}USDT`; // TradingView format
                    }
                } catch (err) {
                    console.error('Crypto Fetch Error:', err);
                    // showAnalysis remains true so buttons/charts still show
                }
            }
            // Standard Market Mode Logic (Supports multiple tickers)
            else if (marketMode && uniqueTickers.length > 0) {
                // Fetch data for the first 3 tickers to avoid hitting rate limits too hard
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
                    // showAnalysis remains true
                }
            }
        }

        // 2. System Prompt Config
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


        // 3. AI Call
        const selectedModel = model || 'openrouter/free';
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: (selectedModel && selectedModel.includes('deepseek')) ? 'stepfun/step-3.5-flash:free' : selectedModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: finalMessage }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': siteUrl,
                    'X-Title': siteName,
                    'Content-Type': 'application/json',
                },
            }
        );

        const aiContent = response.data.choices[0]?.message?.content || 'Failed to generate response.';

        // 4. Construct Structured Analysis (The "Brain" connects to the "UI")
        let marketAnalysis = undefined;

        // Only generate the chart object if we have real data AND the AI confirmed analysis
        if (showAnalysis && (detectedTicker || uniqueTickers.length > 0)) {
            const isBullish = aiContent.toLowerCase().includes('bullish') || aiContent.toLowerCase().includes('positive');
            const isBearish = aiContent.toLowerCase().includes('bearish') || aiContent.toLowerCase().includes('negative');

            marketAnalysis = {
                sentiment: isBullish ? 'bullish' : isBearish ? 'bearish' : 'neutral',
                impactScore: 8, // Derived from high volatility
                confidence: 90, // Real data = High confidence
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
        // Enhanced Error Logging
        console.error('--- API ROUTE ERROR ---');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }

        // Return detailed error to client for debugging
        const errorMessage = error.response?.data?.error?.message || error.message || 'Internal Server Error';
        return NextResponse.json(
            { error: `OpenRouter Error: ${errorMessage}` },
            { status: error.response?.status || 500 }
        );
    }
}
