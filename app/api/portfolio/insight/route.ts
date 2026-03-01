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

        const model = 'meta-llama/llama-3.3-70b-instruct:free';
        const formattingInstruction = " IMPORTANT: Be engaging and highly conversational! Use spacing and **bold text** to highlight key metrics. Use relevant emojis. You MAY use code blocks and raw markdown lists if appropriate.";
        const finalSystemMsg = systemMsg + formattingInstruction;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model,
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

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Invalid response from AI provider');
        }

        return NextResponse.json({ content });
    } catch (error: any) {
        console.error('Portfolio AI Proxy Error:', error.message);
        return NextResponse.json({
            error: 'AI service temporarily unavailable',
            details: error.message
        }, { status: 500 });
    }
}
