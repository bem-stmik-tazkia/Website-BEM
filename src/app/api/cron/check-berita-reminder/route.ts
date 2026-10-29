import { NextResponse } from "next/server";
import { checkBeritaReminder } from "@/lib/telegram";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Helper untuk perbandingan string yang timing-safe guna mencegah timing attacks.
 */
function isTimingSafeMatch(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Handles automated / scheduled checking for the 1-week berita upload reminder.
 * Can be triggered by Vercel Cron or external services.
 * Wajib menggunakan header Authorization: Bearer <CRON_SECRET>. Query param ?secret= dihapus.
 * Gagal tertutup (401) jika CRON_SECRET tidak terkonfigurasi.
 */
async function handleCheck(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    // Fail closed — require CRON_SECRET to be set in env
    if (!cronSecret) {
      console.error("[cron] CRON_SECRET is not configured. Refusing request (fail closed).");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer token" }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    if (!isTimingSafeMatch(token, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const result = await checkBeritaReminder({ force });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Cron check-berita-reminder error:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleCheck(req);
}

export async function POST(req: Request) {
  return handleCheck(req);
}
