import { auth } from "./firebase";
import { api } from './api';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm Cerebro. I can help with attendance, fees, results, and timetables. What would you like to know?",
  attendance: "Attendance analytics show 92% average across all classes. Class 8A has the highest at 97%, while Class 10B needs attention at 81%.",
  fees: "Fee collection is at 78% for this quarter. 45 students have outstanding balances. Would you like a detailed report?",
  results: "Average performance across all exams is 72%. Top performing subject is Mathematics (84%), area for improvement is Science (65%).",
  timetable: "The current timetable is active for the academic year. All 12 classes have schedules assigned. No conflicts detected.",
};

function getMockResponse(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('attendance')) return MOCK_RESPONSES.attendance!;
  if (lower.includes('fee') || lower.includes('payment')) return MOCK_RESPONSES.fees!;
  if (lower.includes('result') || lower.includes('exam') || lower.includes('grade')) return MOCK_RESPONSES.results!;
  if (lower.includes('timetable') || lower.includes('schedule')) return MOCK_RESPONSES.timetable!;
  return MOCK_RESPONSES.default!;
}

export interface CerebroResponse {
  text: string;
  isMock: boolean;
  degraded: boolean;
  finishReason?: string;
  model?: string;
}

class CerebroEngine {
  private static instance: CerebroEngine;
  private sessionCache: Map<string, CerebroResponse> = new Map();
  private static readonly SESSION_CACHE_MAX = 20;

  private constructor() {
    if (IS_MOCK) {
      console.log('[Cerebro] Mock mode enabled');
    }
  }

  public static getInstance(): CerebroEngine {
    if (!CerebroEngine.instance) {
      CerebroEngine.instance = new CerebroEngine();
    }
    return CerebroEngine.instance;
  }

  public async generateResponse(query: string, context: any): Promise<CerebroResponse> {
    const { user } = context;
    const sanitizedQuery = this.maskPII(query).trim().slice(0, 2000);
    const cacheKey = `${user?.id || 'anon'}:${sanitizedQuery.toLowerCase()}`;

    // Session-level memoization (avoid duplicate API calls in same session)
    if (this.sessionCache.has(cacheKey)) {
      const cached = this.sessionCache.get(cacheKey)!;
      return { ...cached, text: cached.text, isMock: cached.isMock, degraded: cached.degraded };
    }

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      const resp: CerebroResponse = { text: getMockResponse(sanitizedQuery), isMock: true, degraded: false };
      this.cacheResponse(cacheKey, resp);
      return resp;
    }

    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }

    try {
      const result = await api.cerebroAsk(
        sanitizedQuery,
        context.schoolId || user?.schoolId,
        { role: user?.role, page: context.page, aggregates: context.aggregates }
      );
      const resp: CerebroResponse = {
        text: result.text,
        isMock: result.isMock || false,
        degraded: result.degraded || false,
        finishReason: result.finishReason,
        model: result.model,
      };
      this.cacheResponse(cacheKey, resp);
      return resp;
    } catch (error: any) {
      if (error.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      if (error.status === 429) {
        // Error may carry the retry hint on a `headers` field (axios-style)
        // or in the message body if it was serialized. Fall back to 60s.
        const retryAfter =
          error.headers?.get?.('X-RateLimit-Reset') ||
          error.response?.headers?.['x-ratelimit-reset'] ||
          error.retryAfter ||
          '60s';
        throw new Error(`Rate limit exceeded. Try again in ${retryAfter}.`);
      }
      if (error.status === 503) {
        throw new Error('Neural Engine Unavailable. All API keys exhausted.');
      }
      console.warn('[Cerebro] API call failed:', error.message);
      // Surface as degraded response instead of silent mock
      throw new Error(error.message || 'Cerebro is temporarily unavailable. Please try again.');
    }
  }

  private cacheResponse(key: string, resp: CerebroResponse) {
    this.sessionCache.set(key, resp);
    if (this.sessionCache.size > CerebroEngine.SESSION_CACHE_MAX) {
      const firstKey = this.sessionCache.keys().next().value;
      if (firstKey) this.sessionCache.delete(firstKey);
    }
  }

  public clearCache() {
    this.sessionCache.clear();
  }

  private maskPII(query: string): string {
    let s = query;
    // Order matters: longer patterns first to avoid partial matches
    // Credit card: 16 digits (with optional spaces/dashes)
    s = s.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[CARD_REDACTED]');
    // Generic 12-digit ID (Aadhaar uses 12 digits with optional spaces/dashes — handled above by the same regex)
    s = s.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[ID_REDACTED]');
    // Phone: +91 98765 43210, +91-98765-43210, +919876543210, 9876543210 (Indian), with optional spaces
    s = s.replace(/(\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}/g, '[PHONE_REDACTED]');
    // Email (handle obfuscation: user [at] domain, user (at) domain, user AT domain)
    s = s.replace(/[a-zA-Z0-9._%+\-]+(\s*[\[\(]at[\]\)]\s*|\s+at\s+|\s*@\s*)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi, '[EMAIL_REDACTED]');
    s = s.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    // PAN: ABCDE1234F
    s = s.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[PAN_REDACTED]');
    // SSN-like: XXX-XX-XXXX
    s = s.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    return s;
  }
}

export const cerebro = CerebroEngine.getInstance();
