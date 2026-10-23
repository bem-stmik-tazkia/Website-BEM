import { NextResponse } from "next/server";
import { checkBeritaReminder } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Handles automated / scheduled checking for the 1-week berita upload reminder.
 * Can be triggered by Vercel Cron, external cron services, or internal background checks.
 */
async function handleCheck(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is defined in environment variables, verify it
    if (cronSecret) {
      const token = authHeader?.replace("Bearer ", "");
      const searchParams = new URL(req.url).searchParams;
      const secretParam = searchParams.get("secret");

      if (token !== cronSecret && secretParam !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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
      { error: msg },
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
