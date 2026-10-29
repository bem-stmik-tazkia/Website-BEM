import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/auth";
import {
  getTelegramConfig,
  sendTelegramTestPing,
  sendNewBeritaNotification,
  checkBeritaReminder,
  getAdminSupabaseClient,
} from "@/lib/telegram";

/**
 * GET: Retrieves the current Telegram bot connection status,
 * freshness of news uploads, days elapsed since last post, and last reminder sent info.
 */
export async function GET() {
  try {
    const auth = await verifyAdminApi();
    if (!auth.authorized) {
      return auth.response;
    }

    const config = await getTelegramConfig();
    const supabase = getAdminSupabaseClient();

    const { data: latestList } = await supabase
      .from("berita")
      .select("id, title, slug, created_at, category, is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = latestList && latestList.length > 0 ? latestList[0] : null;

    let daysSinceLastPost = 999;
    if (latest && latest.created_at) {
      const diffMs = Date.now() - new Date(latest.created_at).getTime();
      daysSinceLastPost = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      ok: true,
      config: {
        isConfigured: config.isConfigured,
        hasBotToken: Boolean(config.botToken),
        hasChatId: Boolean(config.chatId),
        chatIdMasked: config.chatId
          ? config.chatId.slice(0, 4) + "..." + config.chatId.slice(-3)
          : null,
        notifEnabled: config.notifEnabled,
        reminderEnabled: config.reminderEnabled,
        lastReminderSentAt: config.lastReminderSentAt,
      },
      newsFreshness: {
        latestBerita: latest,
        daysSinceLastPost,
        isOverdue: daysSinceLastPost >= 7,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("GET /api/admin/berita/telegram error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Handles Telegram administrative actions:
 * - action = 'test_ping' : Sends a test message to verify the bot
 * - action = 'broadcast_news' : Broadcasts an existing news item by ID
 * - action = 'check_reminder' : Checks and sends the 1-week reminder (with force option)
 */
export async function POST(req: Request) {
  try {
    const auth = await verifyAdminApi();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { action } = body;

    if (action === "test_ping") {
      const result = await sendTelegramTestPing();
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Gagal mengirim pesan uji coba" },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, message: "Pesan uji coba berhasil terkirim ke Telegram!" });
    }

    if (action === "broadcast_news") {
      const { beritaId } = body;
      if (!beritaId) {
        return NextResponse.json({ error: "beritaId wajib diisi" }, { status: 400 });
      }

      const supabase = getAdminSupabaseClient();
      const { data: berita, error: fetchErr } = await supabase
        .from("berita")
        .select("*")
        .eq("id", beritaId)
        .single();

      if (fetchErr || !berita) {
        return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
      }

      const result = await sendNewBeritaNotification(berita);
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Gagal menyiarkan berita ke Telegram" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Berita berhasil disiarkan ke Telegram!",
      });
    }

    if (action === "check_reminder") {
      const force = Boolean(body.force);
      const result = await checkBeritaReminder({ force });
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("POST /api/admin/berita/telegram error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
