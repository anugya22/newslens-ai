// lib/config.ts
// ================================================================
// CONFIGURATION - All API keys from environment variables
// Safe for GitHub - No hardcoded keys!
// ================================================================

// API Keys from Vercel Environment Variables
export const API_KEYS = {
  // Get from: https://openrouter.ai/keys
  // Add in Vercel: NEXT_PUBLIC_OPENROUTER_API_KEY
  OPENROUTER: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',

  // Get from: https://finnhub.io/dashboard
  // Add in Vercel: NEXT_PUBLIC_FINNHUB_API_KEY
  FINNHUB: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '',

  // CoinGecko is free and doesn't usually need a key for basic usage, 
  // but we can add an optional one if needed.
  COINGECKO: process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '',

  // Alpha Vantage for global/Indian stocks
  ALPHAVANTAGE: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '',
};

// AI Model Configuration
export const AI_CONFIG = {
  // ⭐ BEST FREE MODEL - Gemini 2.0 Flash Lite (More stable than StepFun)
  MODEL: 'google/gemini-2.0-flash-lite-preview-02-05:free',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 2000,
};

// Rate Limiting Configuration
export const RATE_LIMITS = {
  ALPHA_VANTAGE_DAILY: 25,
  NEWS_API_DAILY: 100,
  OPENROUTER_DAILY: Infinity,
};

// LocalStorage Keys for Rate Limiting
export const STORAGE_KEYS = {
  ALPHA_REQUESTS: 'newslens_alpha_requests',
  NEWS_REQUESTS: 'newslens_news_requests',
};

// Validation
export function validateAPIKeys() {
  const warnings: string[] = [];

  if (!API_KEYS.OPENROUTER) {
    warnings.push('⚠️ OpenRouter API key not configured');
  }

  if (!API_KEYS.FINNHUB) {
    warnings.push('⚠️ Finnhub API key not configured (optional)');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

export function isAPIConfigured(api: 'OPENROUTER' | 'FINNHUB' | 'COINGECKO'): boolean {
  return !!API_KEYS[api];
}
