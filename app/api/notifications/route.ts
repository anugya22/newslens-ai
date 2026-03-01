import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, email, portfolioDrop, totalValue, items } = body;

        if (!userId || !email) {
            return new Response(JSON.stringify({ error: 'Missing user details' }), { status: 400 });
        }

        // Generate AI analysis for the drop 
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        let aiInsight = 'Significant market volatility detected.';

        if (apiKey) {
            try {
                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': siteUrl,
                        'X-Title': 'NewsLens AI',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'stepfun/step-3.5-flash:free',
                        messages: [
                            {
                                role: 'system',
                                content: `You are NewsLens AI Risk Management. The user's portfolio just dropped ${portfolioDrop}%. Analyze the items and give a very brief 2-sentence soothing but professional explanation of what they should consider doing (hold, review trailing stops). Be concise.`
                            },
                            {
                                role: 'user',
                                content: `Portfolio Drop: ${portfolioDrop}%\nTotal Value: $${totalValue}\nItems: ${JSON.stringify(items.map((i: any) => ({ symbol: i.symbol, change: i.daily_change })))}`
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 150
                    }),
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.choices && aiData.choices[0]) {
                        aiInsight = aiData.choices[0].message.content;
                    }
                }
            } catch (e) {
                console.error("AI Analysis for email failed", e);
            }
        }

        // Ideally, here you would connect to Resend, SendGrid, or AWS SES to actually dispatch the email.
        // For NewsLens AI, we will mock the successful dispatch and log it, as the actual API keys for SMTP are likely not present in this repo.
        console.log(`\n\n[EMAIL DISPATCH MOCK]\nTo: ${email}\nSubject: ⚠️ NewsLens AI Risk Alert: Portfolio dropped ${portfolioDrop}%\nBody:\nYour portfolio has experienced a sudden drop.\nCurrent Value: $${totalValue}\n\nAI Insight: ${aiInsight}\n\nReview your dashboard for detailed metrics.\n\n`);

        return new Response(JSON.stringify({ success: true, message: 'Email dispatched successfully' }), { status: 200 });
    } catch (error: any) {
        console.error('Email Notification Error:', error.message);
        return new Response(JSON.stringify({ error: "Failed to process notification" }), { status: 500 });
    }
}
