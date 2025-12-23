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
  
  // Get from: https://newsapi.org/register
  // Add in Vercel: NEXT_PUBLIC_NEWS_API_KEY
  NEWS_API: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
  
  // Get from: https://www.alphavantage.co/support/#api-key
  // Add in Vercel: NEXT_PUBLIC_ALPHA_VANTAGE_KEY
  ALPHA_VANTAGE: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '',
};

// AI Model Configuration
export const AI_CONFIG = {
  // ⭐ BEST FREE MODEL - Unlimited, No tokens needed!
  MODEL: 'google/gemini-2.0-flash-exp:free',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
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
  
  if (!API_KEYS.NEWS_API) {
    warnings.push('⚠️ News API key not configured (optional)');
  }
  
  if (!API_KEYS.ALPHA_VANTAGE) {
    warnings.push('⚠️ Alpha Vantage key not configured (optional)');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

export function isAPIConfigured(api: 'OPENROUTER' | 'NEWS_API' | 'ALPHA_VANTAGE'): boolean {
  return !!API_KEYS[api];
}
