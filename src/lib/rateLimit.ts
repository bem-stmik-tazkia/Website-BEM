import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/auth";

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
 * Mengekstrak IP klien untuk keperluan rate limiting.
 * - Di lingkungan produksi (Vercel), HANYA mempercayai header 'x-vercel-forwarded-for' dari edge proxy.
 * - Jika 'x-vercel-forwarded-for' tidak ada di produksi, JANGAN fallback ke 'x-forwarded-for'
 *   (dapat di-spoof oleh penyerang). Gunakan kunci bersama 'unknown-ip' sehingga seluruh traffic tak dikenal
 *   dikenakan rate limit kelompok.
 * - Fallback ke 'x-forwarded-for' atau '127.0.0.1' HANYA aktif saat NODE_ENV !== 'production' (development lokal).
 */
export function getClientIp(req: Request | NextRequest): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  // Fallback hanya untuk development lokal
  if (process.env.NODE_ENV !== "production") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return "127.0.0.1";
  }

  // Di produksi tanpa header edge Vercel: gunakan kunci bersama 'unknown-ip'
  return "unknown-ip";
}

/**
 * Opsi 2 (Postgres): RPC atomik check_rate_limit menggunakan service_role.
 * Gagal tertutup (Fail Closed): jika database tidak dapat dijangkau atau kredensial kosong,
 * kembalikan { allowed: false } untuk melindungi sistem dari serangan DoS/brute force.
 */
export async function checkPostgresRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[rateLimit] RPC check_rate_limit database error:", error.message);
      // Fail closed: tolak akses jika terjadi error RPC / DB
      return { allowed: false, error: error.message };
    }

    return { allowed: data === true };
  } catch (err: any) {
    console.error("[rateLimit] Exception saat memanggil check_rate_limit:", err?.message || err);
    // Fail closed
    return { allowed: false, error: err?.message || "Internal rate limit error" };
  }
}

/**
 * Pembungkus asinkron berbasis RPC Postgres untuk kompatibilitas dengan RateLimitResult.
 * Menggantikan Map in-memory lama dengan penyimpanan persisten & terdistribusi di PostgreSQL.
 * Gagal tertutup (fail closed) jika RPC error atau ditolak.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
  const { allowed } = await checkPostgresRateLimit(key, options.limit, windowSeconds);

  const resetSeconds = Math.ceil(Date.now() / 1000) + windowSeconds;
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(options.limit),
    "X-RateLimit-Reset": String(resetSeconds),
  };

  if (!allowed) {
    headers["Retry-After"] = String(windowSeconds);
  }

  return {
    success: allowed,
    limit: options.limit,
    remaining: allowed ? 1 : 0,
    reset: resetSeconds,
    retryAfter: allowed ? 0 : windowSeconds,
    headers,
  };
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
