import { NextRequest, NextResponse } from "next/server";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { isRandomAdminPathActive, generateAdminToken } from "@/lib/admin-token";

// In-memory fallback rate limiter jika RPC Postgres mengalami gangguan
const memoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Membersihkan entri kedaluwarsa pada in-memory limiter untuk mencegah memory leak
 */
function cleanExpiredMemoryRateLimits(now: number) {
  for (const [key, val] of memoryRateLimitMap.entries()) {
    if (now > val.resetAt) {
      memoryRateLimitMap.delete(key);
    }
  }
}

function checkFallbackRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanExpiredMemoryRateLimits(now);

  const entry = memoryRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    memoryRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

// POST /api/maintenance/bypass
// Dipanggil setelah Konami code diinput di halaman publik atau maintenance.
export async function POST(req: NextRequest) {
  const secret = process.env.MAINTENANCE_BYPASS_SECRET;

  // Fail closed: jika secret belum dikonfigurasi di env, tolak request
  if (!secret) {
    console.error("[bypass] MAINTENANCE_BYPASS_SECRET tidak dikonfigurasi di environment. Menolak request (fail closed).");
    return NextResponse.json(
      { error: "Service unavailable: bypass secret not configured" },
      { status: 503 }
    );
  }

  const isRandomActive = isRandomAdminPathActive();

  // 1. Terapkan Rate Limiting HANYA saat fitur random path aktif
  if (isRandomActive) {
    const clientIp = getClientIp(req);
    try {
      const rateLimitRes = await checkRateLimit(`bypass_${clientIp}`, {
        limit: 5,
        windowMs: 60 * 1000, // 5 request per menit
      });

      if (!rateLimitRes.success) {
        return createRateLimitResponse(
          "Terlalu banyak permintaan bypass. Silakan tunggu beberapa saat.",
          rateLimitRes
        );
      }
    } catch (err) {
      console.warn("[bypass] Postgres rate limit RPC gagal, beralih ke limiter in-memory cadangan:", err);
      // Fallback ke limiter cadangan
      const isAllowedFallback = checkFallbackRateLimit(clientIp, 5, 60 * 1000);
      if (!isAllowedFallback) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan bypass. Silakan tunggu beberapa saat." },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
    }
  }

  // 2. Tentukan target path dan token
  let adminPath = '/login';
  let token: string | undefined;

  if (isRandomActive) {
    try {
      token = await generateAdminToken();
      adminPath = `/${token}`;
    } catch (err) {
      console.error("[bypass] Gagal men-generate admin token:", err);
      return NextResponse.json(
        { error: "Internal server error: gagal men-generate token akses" },
        { status: 500 }
      );
    }
  }

  const response = NextResponse.json({
    success: true,
    path: adminPath,
    token,
  });

  // Cookie bypass berlaku 8 jam
  // httpOnly: false diperlukan agar client-side JS (Konami listener) dapat mendeteksi status bypass
  response.cookies.set("maintenance_bypass", secret, {
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

// DELETE /api/maintenance/bypass
// Hapus bypass cookie (logout dari bypass)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("maintenance_bypass");
  return response;
}
