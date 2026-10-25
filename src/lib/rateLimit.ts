import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (per-instance / node process)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitOptions {
  limit: number;       // Maximum requests allowed within the window
  windowMs: number;    // Time window in milliseconds (e.g. 60000 = 1 minute)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix epoch timestamp in seconds
  retryAfter: number;  // Seconds until limit resets (0 if success)
  headers: Record<string, string>;
}

/**
 * Checks and updates rate limit for a given key (e.g. IP + endpoint).
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const existing = rateLimitStore.get(key);

  let record: RateLimitRecord;

  if (!existing || existing.resetAt <= now) {
    // New window
    record = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, record);
  } else {
    // Existing window
    record = existing;
    record.count += 1;
  }

  const success = record.count <= options.limit;
  const remaining = Math.max(0, options.limit - record.count);
  const resetSeconds = Math.ceil(record.resetAt / 1000);
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(options.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetSeconds),
  };

  if (!success) {
    headers["Retry-After"] = String(retryAfterSeconds);
  }

  return {
    success,
    limit: options.limit,
    remaining,
    reset: resetSeconds,
    retryAfter: success ? 0 : retryAfterSeconds,
    headers,
  };
}

/**
 * Extracts client IP from standard request headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Helper to build a standard 429 Too Many Requests response
 */
export function createRateLimitResponse(
  message = "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba kembali.",
  rateLimitResult?: RateLimitResult
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryAfter: rateLimitResult?.retryAfter || 60,
    },
    {
      status: 429,
      headers: rateLimitResult?.headers || { "Retry-After": "60" },
    }
  );
}

