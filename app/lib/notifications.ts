import axios from 'axios';
import { NewsArticle } from '../types';
import { sendAlertEmail } from '../actions/email';

export class NotificationService {

    /**
     * Analyzes news items and triggers alerts for high-risk or high-opportunity articles.
     * Uses openrouter/free with fallback to stepfun.
     */
    static async analyzeAndNotify(userEmail: string, portfolioStocks: string[], news: NewsArticle[]) {
        const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        if (!apiKey) return;

        for (const article of news) {
            const relevantStock = portfolioStocks.find(stock =>
                article.title.toUpperCase().includes(stock) ||
                (article.description && article.description.toUpperCase().includes(stock))
            );

            if (!relevantStock) continue;

            // Updated prompt to detect BOTH Risk and Opportunity
            const prompt = `Analyze this news for ${relevantStock}.
News: "${article.title}. ${article.description || ''}"

Output exactly in this format:
SENTIMENT: {Positive/Neutral/Negative}
TYPE: {RISK/OPPORTUNITY/NONE}
EXPLANATION: {Brief impact summary}
SUGGESTION: {Actionable advice}

Rules:
- Mark as RISK only if High Risk/Crash/Loss likely.
- Mark as OPPORTUNITY only if High Growth/Surge/Profit likely.
- Otherwise Mark TYPE as NONE.`;

            try {
                // Strictly lock to stepfun for news sentiment analysis
                const response = await this.callAI('stepfun/step-3.5-flash:free', prompt, apiKey);
                const analysisText = response?.data?.choices?.[0]?.message?.content || '';

                if (analysisText) {
                    const sentimentMatch = analysisText.match(/SENTIMENT:\s*(.*)/i);
                    const typeMatch = analysisText.match(/TYPE:\s*(.*)/i);
                    const explanationMatch = analysisText.match(/EXPLANATION:\s*(.*)/i);
                    const suggestionMatch = analysisText.match(/SUGGESTION:\s*(.*)/i);

                    const type = typeMatch ? typeMatch[1].trim().toUpperCase() : 'NONE';
                    const sentiment = sentimentMatch ? sentimentMatch[1].trim() : 'Neutral';
                    const explanation = explanationMatch ? explanationMatch[1].trim() : '';
                    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '';

                    // Trigger Email Alert if High Risk or High Opportunity
                    if (type === 'RISK' || type === 'OPPORTUNITY') {
                        if (userEmail) {
                            console.log(`Triggering ${type} email to ${userEmail}`);
                            await sendAlertEmail({
                                to: userEmail,
                                stock: relevantStock,
                                sentiment: sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral',
                                alertType: type as 'RISK' | 'OPPORTUNITY',
                                explanation: explanation,
                                suggestion: suggestion
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Analysis Error:', err);
            }
        }
    }

    private static async callAI(model: string, prompt: string, apiKey: string) {
        return axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: 'You are an expert financial analyst. Analyze sentiment and impact on assets.' },
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
