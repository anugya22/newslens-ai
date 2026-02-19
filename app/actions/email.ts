'use server';

import { Resend } from 'resend';

// Initialize Resend with API Key
// User needs to add RESEND_API_KEY to .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
    to: string;
    stock: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    alertType: 'RISK' | 'OPPORTUNITY';
    explanation: string;
    suggestion: string;
}

export async function sendAlertEmail(payload: EmailPayload) {
    const { to, stock, sentiment, alertType, explanation, suggestion } = payload;

    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ CRITICAL ERROR: RESEND_API_KEY is missing in your environment variables.');
            console.warn('Deployment Tip: Make sure to add RESEND_API_KEY in your Vercel Project Settings.');
            return { success: false, error: 'Resend API Key missing' };
        }

        const subject = `${alertType === 'RISK' ? '🚨 HIGH RISK' : '🚀 OPPORTUNITY'}: ${stock} Update`;

        const color = alertType === 'RISK' ? '#ef4444' : '#22c55e';
        const title = alertType === 'RISK' ? 'Portfolio Risk Alert' : 'Growth Opportunity Alert';

        // HTML Email Template
        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: ${color}; margin: 0;">${title}</h1>
                <p style="color: #6b7280; font-size: 14px;">NewsLens AI Intelligence</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin-top: 0;">Asset: <strong>${stock}</strong></h2>
                <p><strong>Sentiment:</strong> ${sentiment.toUpperCase()}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <h3>Analysis</h3>
                <p style="line-height: 1.6; color: #374151;">${explanation}</p>
            </div>

            <div style="background-color: ${alertType === 'RISK' ? '#fef2f2' : '#f0fdf4'}; border-left: 4px solid ${color}; padding: 15px;">
                <h3 style="margin-top: 0; color: ${color};">AI Suggestion</h3>
                <p style="margin-bottom: 0; font-weight: bold;">${suggestion}</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
                <p>This is an automated alert from your NewsLens AI Portfolio Tracker.</p>
            </div>
        </div>
        `;

        const data = await resend.emails.send({
            from: 'onboarding@resend.dev', // Default testing sender
            to: to,
            subject: subject,
            html: html,
        });

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
