/**
 * Simple in-memory rate limiter for API endpoints
 * 
 * Features:
 * - Per-IP/device rate limiting
 * - Configurable windows and limits
 * - Automatic cleanup of old entries
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimiterConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  cleanupIntervalMs?: number;  // How often to clean old entries
}

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private config: RateLimiterConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = {
      cleanupIntervalMs: 60000, // Default: cleanup every minute
      ...config,
    };
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (IP, device ID, etc.)
   * @returns Object with allowed status and retry info
   */
  check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry || now - entry.windowStart > this.config.windowMs) {
      // New window
      this.entries.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs,
      };
    }

    // Existing window
    if (entry.count >= this.config.maxRequests) {
      const resetIn = this.config.windowMs - (now - entry.windowStart);
      return {
        allowed: false,
        remaining: 0,
        resetIn,
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetIn: this.config.windowMs - (now - entry.windowStart),
    };
  }

  /**
   * Start the cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.entries.entries()) {
        if (now - entry.windowStart > this.config.windowMs) {
          this.entries.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create rate limiters for different endpoints

/**
 * Rate limiter for scan creation
 * Allows 60 scans per minute per device (1 scan per second average)
 */
export const scanRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
});

/**
 * Rate limiter for AI endpoint
 * Allows 10 AI queries per minute per device
 */
export const aiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

/**
 * Rate limiter for general API calls
 * Allows 300 requests per minute per device
 */
export const generalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300, // 300 requests per minute
});

/**
 * Get rate limit key from context
 */
export function getRateLimitKey(ctx: { req: { headers: Record<string, string | string[] | undefined>; ip?: string } }): string {
  // Prefer device ID, fall back to IP
  const deviceId = ctx.req.headers['x-device-id'];
  if (typeof deviceId === 'string' && deviceId) {
    return `device:${deviceId}`;
  }
  
  // Try forwarded IP (for reverse proxies)
  const forwardedFor = ctx.req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }
  
  // Fall back to direct IP
  return `ip:${ctx.req.ip || 'unknown'}`;
}
