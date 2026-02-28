import { NextRequest } from 'next/server';
import { MarketDataService } from '../../lib/apis';
import { AI_CONFIG } from '../../lib/config';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const marketService = new MarketDataService();

// Initialize redis/ratelimit if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
let ratelimit: Ratelimit | null = null;

if (redisUrl && redisToken) {
    const redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });
    ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, '1 d'), // 10 requests per day per IP
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, marketMode, cryptoMode, portfolio, sessionId, userId, accessToken, history = [], model } = body;

        // Vercel environment variables check
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const siteName = 'NewsLens AI';

        if (!apiKey) {
            console.error('CRITICAL: OpenRouter API Key is missing');
            return new Response(JSON.stringify({ error: 'OpenRouter API Key not configured on server' }), { status: 500 });
        }

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
        }

        // Rate limit check (Bypass if userId is present - logged in users have unlimited access)
        if (ratelimit && !userId && (marketMode || cryptoMode)) {
            const ip = req.ip ?? '127.0.0.1';
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                return new Response(JSON.stringify({ error: 'Daily limit exceeded for Advanced Modes. Please log in for unlimited access, or switch back to free General Chat.' }), { status: 429 });
            }
        }

        let finalMessage = message;
        let marketDataContext = '';
        let showAnalysis = false;
        let detectedTicker = '';

        // --- SMART MODE & CRYPTO MODE LOGIC ---
        // Matches $AAPL or strictly 2+ uppercase letters (ignores generic lowercase words like 'price')
        const stockRegex = /\$[a-zA-Z]{2,10}\b|\b[A-Z]{2,10}\b/g;
        const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'dogecoin', 'doge', 'crypto', 'xrp', 'cardano', 'ada', 'binance', 'bnb', 'polkadot', 'dot', 'chainlink', 'link', 'polygon', 'matic'];

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
        const isCryptoQuery = cryptoKeywords.some((k: string) => message.toLowerCase().includes(k));

        const namedTickers = Object.entries(tickerMap)
            .filter(([name]) => message.toLowerCase().includes(name))
            .map(([_, ticker]) => ticker);

        let uniqueTickers: string[] = [];
        if (matches || namedTickers.length > 0) {
            const rawMatches = (matches || []).map((m: string) => m.replace(/[()$]/g, '').toUpperCase());
            // Filter out common stopwords that match 2-5 chars
            const stopWords = ['HOW', 'WHY', 'WHAT', 'WHEN', 'WHO', 'THE', 'AND', 'FOR', 'ARE', 'YOU', 'CAN', 'OUT', 'DOING'];
            uniqueTickers = Array.from(new Set([...rawMatches, ...namedTickers])).filter(t => !stopWords.includes(t));
        }

        if (marketMode || cryptoMode) {
            if (uniqueTickers.length > 0 || isCryptoQuery) {
                showAnalysis = true;
                detectedTicker = uniqueTickers[0] || '';
            }

            if (cryptoMode && (uniqueTickers.length > 0 || isCryptoQuery)) {
                // Determine exact coin for the fetching logic.
                const msgLower = message.toLowerCase();
                const coin = msgLower.includes('btc') || msgLower.includes('bitcoin') ? 'BTC' :
                    msgLower.includes('eth') || msgLower.includes('ethereum') ? 'ETH' :
                        msgLower.includes('sol') || msgLower.includes('solana') ? 'SOL' :
                            msgLower.includes('doge') ? 'DOGE' :
                                msgLower.includes('xrp') ? 'XRP' :
                                    msgLower.includes('ada') || msgLower.includes('cardano') ? 'ADA' :
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

        let scrapedText = '';
        const urlMatch = message.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
            try {
                const response = await fetch(urlMatch[0]);
                const html = await response.text();
                const $ = cheerio.load(html);

                let pText = '';
                $('p').each((i, el) => {
                    pText += $(el).text() + ' ';
                });

                scrapedText = pText.substring(0, 4000); // Give AI up to 4k chars of body text
            } catch (err) {
                console.error("Cheerio scraping failed:", err);
            }
        }

        let systemPrompt = `You are NewsLens AI, a friendly, highly intelligent assistant. 
        CRITICAL FORMATTING RULES: 
        1. STRONGLY ENCOURAGED: Use **bold** formatting for important entities, points, or headers. 
        2. Keep paragraphs short and conversational. Do not use blocky unspaced text. Use nice spacing.
        3. STRONGLY ENCOURAGED: Use relevant emojis to make the conversation lively and highly engaging!
        4. Explain things in simple, jargon-free English.
        ${portfolio && portfolio.length > 0 ? `The user holds these assets: [${portfolio.join(', ')}]. Prioritize news impacting these stocks.` : ''}`;

        if (cryptoMode) {
            systemPrompt = `You are a "Crypto Analyst".
             Style: Friendly, conversational, use some crypto slang (HODL, bullish) but keep it professional enough for clear advice.
             Focus: Price action, sentiment, and basic technicals in extremely simple terms.
             ${portfolio && portfolio.length > 0 ? `The user is tracking: [${portfolio.join(', ')}].` : ''}
             ${marketDataContext}

             CRITICAL INSTRUCTION:
             - If Real-Time Data is provided above, USE IT and cite the exact price.
             - Make your output highly scannable using **bold**, emojis, and short paragraphs to make the UI look very high-end and premium.`;
        } else if (marketMode) {
            systemPrompt = `You are a Professional Financial Advisor aiming to educate a beginner.
             Style: Friendly, data-driven but extremely simple to understand. Talk like a friendly human advisor.
             Focus: Market impact, simple macroeconomics.
             ${portfolio && portfolio.length > 0 ? `The user is tracking: [${portfolio.join(', ')}].` : ''}
             ${marketDataContext}

             CRITICAL INSTRUCTION:
             - If Real-Time Data is provided above, USE IT.
             - Format text cleanly. Emphasize metrics with **bold text** and sprinkle in emojis for a conversational vibe.`;
        }

        if (scrapedText) {
            systemPrompt += `\n\n[LINK CONTENT EXTRACTION]: The user has provided a link. We ran an automated web scraper on it. Here is the article text extracted from the URL: \n"""\n${scrapedText}\n"""\n\nRead and base your analysis heavily on the text above when answering the user.`;
        }

        const messagesPayload = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: finalMessage }
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': siteUrl,
                'X-Title': siteName,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || AI_CONFIG.MODEL,
                messages: messagesPayload,
                temperature: 0.7,
                max_tokens: 2000,
                stream: true // Enable SSE streaming
            }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);

            // Return a user-friendly generic error
            return new Response(JSON.stringify({
                error: "The AI service is currently busy or experiencing high traffic. Please try again in a few moments."
            }), { status: 503 });
        }

        // --- MARKET ANALYSIS METADATA GENERATION ---
        let marketAnalysis = undefined;
        if (showAnalysis && (detectedTicker || uniqueTickers.length > 0)) {
            // Since we stream, we can't definitively know the LLM's full sentiment yet.
            // But we can do a preliminary best guess based on the data or default to natural.
            marketAnalysis = {
                sentiment: 'neutral',
                impactScore: 8,
                confidence: 85,
                symbol: uniqueTickers[0] || detectedTicker,
                symbols: uniqueTickers.length > 0 ? uniqueTickers : [detectedTicker],
                sectors: [{
                    name: cryptoMode ? 'Cryptocurrency' : 'Technology',
                    impact: 'neutral',
                    score: 9,
                    reasoning: 'Live data analysis',
                    stocks: (uniqueTickers.length > 0 ? uniqueTickers : [detectedTicker]).map(t => ({
                        symbol: t,
                        name: t,
                        predictedChange: 0,
                        reasoning: 'Real-time monitoring',
                        confidence: 90
                    }))
                }],
                risks: [],
                opportunities: [],
                prediction: `Live tracking for ${uniqueTickers.join(', ')}.`
            };
        }

        // --- STREAMING PIPELINE ---
        let aiContent = "";

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const decoder = new TextDecoder();
                const reader = response.body!.getReader();

                // Send initial chunk with metadata
                if (marketAnalysis) {
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'metadata', data: marketAnalysis }) + '\n'));
                }

                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine === 'data: [DONE]') continue;
                        if (trimmedLine.startsWith('data: ')) {
                            try {
                                const parseData = JSON.parse(trimmedLine.slice(6));
                                if (parseData.choices && parseData.choices[0].delta && parseData.choices[0].delta.content) {
                                    const textChunk = parseData.choices[0].delta.content;
                                    aiContent += textChunk;
                                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'content', text: textChunk }) + '\n'));
                                }
                            } catch (e) {
                                // Mute parse errors for incomplete chunks
                            }
                        }
                    }
                }

                // Save to Supabase DB if user is logged in
                if (userId && sessionId && accessToken) {
                    try {
                        const supabaseAuthClient = createClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                            {
                                global: { headers: { Authorization: `Bearer ${accessToken}` } }
                            }
                        );

                        const mode = cryptoMode ? 'crypto' : marketMode ? 'market' : 'general';

                        // Insert User Message
                        await supabaseAuthClient.from('chat_history').insert({
                            user_id: userId,
                            session_id: sessionId,
                            mode: mode,
                            role: 'user',
                            content: finalMessage
                        });

                        // Insert AI Message
                        await supabaseAuthClient.from('chat_history').insert({
                            user_id: userId,
                            session_id: sessionId,
                            mode: mode,
                            role: 'assistant',
                            content: aiContent
                        });

                    } catch (dbErr) {
                        console.error('Failed to save to Supabase:', dbErr);
                    }
                }

                // Close the stream ONLY AFTER the database completes
                controller.close();
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
        });

    } catch (error: any) {
        console.error('--- API ROUTE ERROR ---');
        console.error('Message:', error.message);
        return new Response(JSON.stringify({
            error: "I'm having trouble connecting to my brain right now. Please check your connection and try again."
        }), { status: 500 });
    }
}
