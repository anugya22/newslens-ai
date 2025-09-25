// utils.ts
// -----------------------------------------------------------------------------
// Shared utilities for NewsLens AI
// -----------------------------------------------------------------------------

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NewsArticle, MarketData } from '../types';

// -----------------------------------------------------------------------------
// Tailwind class merge
// -----------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Number & money formatting
// -----------------------------------------------------------------------------
export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return '—';
  const abs = Math.abs(num);
  if (abs >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return String(num);
}

export function formatPercentage(num: number, opts?: { digits?: number; sign?: boolean }) {
  if (!Number.isFinite(num)) return '—';
  const d = opts?.digits ?? 2;
  const s = opts?.sign ?? true;
  const prefix = s && num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(d)}%`;
}

export function formatCurrency(num: number, currency: string = 'USD', locale = 'en-US'): string {
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return 'Invalid date';

  const diff = Math.floor((now.getTime() - target.getTime()) / 1000); // seconds

  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return target.toLocaleDateString();
}

// -----------------------------------------------------------------------------
// URLs & IDs
// -----------------------------------------------------------------------------
export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return 'Unknown Source';
  }
}

export function generateId(prefix = ''): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}${prefix ? '-' : ''}${ts}-${rnd}`;
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Keywords & simple sentiment
// -----------------------------------------------------------------------------
const COMMON_WORDS = new Set<string>([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on',
  'with','he','as','you','do','at','this','but','his','by','from','they','we',
  'say','her','she','or','an','will','my','one','all','would','there','their',
  'what','so','up','out','if','about','who','get','which','go','me','is','are',
  'was','were','been','being','into','over','under','between','also'
]);

export function extractKeywords(text: string, maxKeywords = 5): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !COMMON_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([w]) => w);
}

/**
 * Lightweight sentiment score in [-1, 1].
 * Heuristic: +1 per positive token, -1 per negative token, then normalize.
 */
export function calculateSentimentScore(text: string): number {
  if (!text) return 0;

  const positiveWords = [
    'good','great','excellent','amazing','wonderful','fantastic','positive','success',
    'growth','increase','profit','gain','rise','bull','bullish','optimistic',
    'confident','strong','beat','outperform','upgrade','surge','record'
  ];

  const negativeWords = [
    'bad','terrible','awful','horrible','negative','loss','decrease','decline',
    'fall','drop','bear','bearish','pessimistic','weak','crisis','problem',
    'concern','worry','miss','downgrade','plunge','cut'
  ];

  const tokens = text.toLowerCase().split(/\W+/);
  let score = 0;

  for (const t of tokens) {
    if (!t) continue;
    if (positiveWords.includes(t)) score += 1;
    if (negativeWords.includes(t)) score -= 1;
  }

  // Normalize: assume ±10 tokens ~ full magnitude
  const normalized = score / 10;
  return clamp(normalized, -1, 1);
}

export type SentimentLabel = 'bullish' | 'neutral' | 'bearish';

export function getSentimentFromScore(score: number, hysteresis: number = 0.1): SentimentLabel {
  if (score > 0 + hysteresis) return 'bullish';
  if (score < 0 - hysteresis) return 'bearish';
  return 'neutral';
}

// -----------------------------------------------------------------------------
// Type-safe helpers for loose shapes
// -----------------------------------------------------------------------------
type MinimalArticle = {
  title?: unknown;
  summary?: unknown;
  content?: unknown;
  tickers?: unknown;  // can be string | string[] | {}
  source?: unknown;
  url?: unknown;
};

type MinimalMarket = {
  symbol?: unknown;
  name?: unknown;
  sector?: unknown;
  changePercent?: unknown;
};

function ustr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function ustrArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
  if (typeof v === 'string') return [v];
  return [];
}

function unum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// -----------------------------------------------------------------------------
// Market relevance (type-safe version)
// -----------------------------------------------------------------------------
/**
 * Returns a relevance score in [0, 1] estimating how much an article
 * is pertinent to a given market/asset.
 *
 * Heuristics combined:
 * - Keyword overlap between article text and market symbol/name/sector.
 * - Boost if the article sentiment aligns with recent price action magnitude.
 */
export function calculateMarketRelevance(
  article: MinimalArticle,
  market: MinimalMarket
): number {
  const hay = `${ustr(article.title)} ${ustr(article.summary)} ${ustr(article.content)}`.toLowerCase();

  // Keyword overlap component
  const keys = new Set<string>([
    ...ustrArr(article.tickers).map(t => t.toLowerCase()),
    ustr(market.symbol).toLowerCase(),
    ...ustr(market.name).toLowerCase().split(/\W+/).filter(Boolean),
    ...ustr(market.sector).toLowerCase().split(/\W+/).filter(Boolean),
  ].filter(Boolean));

  let overlap = 0;
  for (const k of keys) {
    if (!k || k.length < 2) continue;
    if (hay.includes(k)) overlap += 1;
  }
  const overlapScore = keys.size ? overlap / keys.size : 0;

  // Sentiment alignment component
  const sent = calculateSentimentScore(hay);
  const changePercent = unum(market.changePercent) ?? 0;
  const priceMove = clamp(changePercent, -20, 20) / 20; // normalize to [-1,1] with ±20% cap
  const alignment = 1 - Math.abs(sent - priceMove); // 1 when aligned, 0 when opposite
  const alignmentScore = clamp(alignment, 0, 1);

  // Source quality nudge (very light; domain-based)
  const domain = extractDomain(ustr(article.url));
  const tierBoost = QUALITY_SOURCES.has(domain) ? 0.05 : 0;

  // Weighted blend
  const score = 0.65 * overlapScore + 0.30 * alignmentScore + tierBoost;
  return clamp(score, 0, 1);
}

const QUALITY_SOURCES = new Set<string>([
  'bloomberg.com','wsj.com','ft.com','reuters.com','cnbc.com','economist.com','nytimes.com'
]);

// -----------------------------------------------------------------------------
// Function control: debounce / throttle
// -----------------------------------------------------------------------------
export function debounce<F extends (...args: any[]) => any>(fn: F, wait = 250) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  } as F;
}

export function throttle<F extends (...args: any[]) => any>(fn: F, interval = 250) {
  let last = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: any[] | null = null;

  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const now = Date.now();
    const remaining = interval - (now - last);

    if (remaining <= 0) {
      if (pending) {
        clearTimeout(pending);
        pending = null;
      }
      last = now;
      fn.apply(this, args);
    } else {
      lastArgs = args;
      if (!pending) {
        pending = setTimeout(() => {
          last = Date.now();
          pending = null;
          if (lastArgs) fn.apply(this, lastArgs as Parameters<F>);
          lastArgs = null;
        }, remaining);
      }
    }
  } as F;
}

// -----------------------------------------------------------------------------
// Deep clone (safe)
// -----------------------------------------------------------------------------
export function deepClone<T>(value: T): T {
  if (typeof (globalThis as any).structuredClone === 'function') {
    return (globalThis as any).structuredClone(value);
  }
  // Fallback: JSON (works for plain data)
  return JSON.parse(JSON.stringify(value)) as T;
}

// -----------------------------------------------------------------------------
// Storage helpers (localStorage, JSON-safe, optional TTL)
// -----------------------------------------------------------------------------
type StorageScope = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const safeLocalStorage: StorageScope | null = (() => {
  try {
    if (typeof window === 'undefined') return null;
    const testKey = '__nl_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
})();

type Stored<T> = { v: T; e?: number }; // value, expiry epoch ms

export function setJSON<T>(key: string, value: T, ttlMs?: number, scope: StorageScope | null = safeLocalStorage) {
  if (!scope) return;
  const payload: Stored<T> = { v: value, e: ttlMs ? Date.now() + ttlMs : undefined };
  try {
    scope.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota or serialization errors
  }
}

export function getJSON<T>(key: string, defaultValue: T, scope: StorageScope | null = safeLocalStorage): T {
  if (!scope) return defaultValue;
  try {
    const raw = scope.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw) as Stored<T>;
    if (parsed && typeof parsed === 'object') {
      if (parsed.e && Date.now() > parsed.e) {
        scope.removeItem(key);
        return defaultValue;
      }
      return parsed.v ?? defaultValue;
    }
  } catch {
    // corrupted -> drop
    try { scope.removeItem(key); } catch {}
  }
  return defaultValue;
}

export function removeJSON(key: string, scope: StorageScope | null = safeLocalStorage) {
  try {
    scope?.removeItem(key);
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// Color utilities
// -----------------------------------------------------------------------------
export function hexToRgba(hex: string, alpha = 1): string {
  const m = hex.replace('#', '').trim();
  const isShort = m.length === 3;
  if (m.length !== 6 && !isShort) return `rgba(0,0,0,${alpha})`;

  const full = isShort ? m.split('').map(c => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function trendColor(value: number): string {
  if (!Number.isFinite(value)) return '#9CA3AF'; // gray-400
  if (value > 0) return '#10B981'; // emerald-500
  if (value < 0) return '#EF4444'; // red-500
  return '#9CA3AF'; // neutral
}

export function sentimentColor(label: SentimentLabel): string {
  switch (label) {
    case 'bullish': return '#10B981';
    case 'bearish': return '#EF4444';
    default: return '#9CA3AF';
  }
}

/** Choose readable text color (black/white) for a given hex background. */
export function contrastTextColor(bgHex: string): '#000000' | '#FFFFFF' {
  const m = bgHex.replace('#', '');
  if (m.length !== 6) return '#000000';
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  // perceived luminance
  const L = 0.299 * r + 0.587 * g + 0.114 * b;
  return L > 0.55 ? '#000000' : '#FFFFFF';
}

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------
export class AppError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  status?: number;
  constructor(message = 'Network error', opts?: { status?: number; cause?: unknown }) {
    super(message, 'NETWORK', opts?.cause);
    this.name = 'NetworkError';
    this.status = opts?.status;
  }
}

// -----------------------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------------------
export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

export function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new AppError(message, 'ASSERT');
}

// -----------------------------------------------------------------------------
// Perf helpers
// -----------------------------------------------------------------------------
export async function timeIt<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const result = await fn();
  const end = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const ms = end - start;
  // eslint-disable-next-line no-console
  if (typeof window !== 'undefined') console.debug(`[perf] ${label}: ${ms.toFixed(1)}ms`);
  return { result, ms };
}

export function timeItSync<T>(label: string, fn: () => T): { result: T; ms: number } {
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const result = fn();
  const end = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const ms = end - start;
  if (typeof window !== 'undefined') console.debug(`[perf] ${label}: ${ms.toFixed(1)}ms`);
  return { result, ms };
}

// -----------------------------------------------------------------------------
// JSON safety
// -----------------------------------------------------------------------------
export function safeParseJSON<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function safeStringify(value: unknown, space: number = 0): string {
  try { return JSON.stringify(value, null, space); } catch { return '""'; }
}

// -----------------------------------------------------------------------------
// Misc
// -----------------------------------------------------------------------------
export const noop = () => {};