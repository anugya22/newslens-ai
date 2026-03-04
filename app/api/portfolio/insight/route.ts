import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { prompt, systemMsg } = await req.json();

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500 });
        }

        const primaryModel = 'meta-llama/llama-3.3-70b-instruct:free';
        const fallbackModel = 'stepfun/step-3.5-flash:free';
        const formattingInstruction = " IMPORTANT: Be engaging and highly conversational! Use spacing and **bold text** to highlight key metrics. Use relevant emojis. You MAY use code blocks and raw markdown lists if appropriate.";
        const finalSystemMsg = systemMsg + formattingInstruction;

        const makeRequest = async (modelToUse: string) => {
            return await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: modelToUse,
                    messages: [
                        { role: 'system', content: finalSystemMsg },
                        { role: 'user', content: prompt }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                        'X-Title': 'NewsLens AI'
                    },
                    timeout: 25000
                }
            );
        };

        let response;
        try {
            response = await makeRequest(primaryModel);
        } catch (primaryError: any) {
            console.warn(`Primary model (${primaryModel}) failed: ${primaryError.message}. Falling back to ${fallbackModel}...`);
            try {
                response = await makeRequest(fallbackModel);
            } catch (fallbackError: any) {
                console.error(`Fallback model (${fallbackModel}) also failed: ${fallbackError.message}`);
                throw fallbackError; // Re-throw to be caught by the outer catch block
            }
        }

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Invalid response from AI provider');
        }

        return NextResponse.json({ content });
    } catch (error: any) {
        console.error('Portfolio AI Proxy Error:', error.message);
        return NextResponse.json({
            error: 'AI service temporarily unavailable. Both primary and fallback models failed.',
            details: error.message
        }, { status: 500 });
    }
}
