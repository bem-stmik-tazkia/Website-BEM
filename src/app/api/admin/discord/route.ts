import { NextResponse } from "next/server";
import { verifyAdminApi, getServiceRoleClient } from "@/lib/auth";
import {
  getDiscordConfig,
  sendDiscordTestPing,
  sendDiscordBeritaNotification,
  sendDiscordKegiatanNotification,
  DiscordChannelTarget,
} from "@/lib/discord";
import { enrichAgendasWithItemsAndCounts } from "@/lib/agenda-items-server";

/**
 * GET: Returns sanitized Discord webhook configuration status (never exposes URLs).
 */
export async function GET() {
  try {
    const auth = await verifyAdminApi();
    if (!auth.authorized) {
      return auth.response;
    }

    const config = await getDiscordConfig();
    return NextResponse.json({
      ok: true,
      config: {
        hasBeritaWebhook: config.hasBeritaWebhook,
        hasPengumumanWebhook: config.hasPengumumanWebhook,
        beritaNotifEnabled: config.beritaNotifEnabled,
        pengumumanNotifEnabled: config.pengumumanNotifEnabled,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("GET /api/admin/discord error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Handles Discord administrative actions:
 * - action = 'test_ping' (target: 'berita' | 'pengumuman')
 * - action = 'broadcast_berita' (beritaId)
 * - action = 'broadcast_kegiatan' (kegiatanId)
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
      const target: DiscordChannelTarget =
        body.target === "pengumuman" ? "pengumuman" : "berita";
      const result = await sendDiscordTestPing(target);
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Gagal mengirim tes ke Discord" },
          { status: 400 }
        );
      }
      const label = target === "pengumuman" ? "#Pengumuman" : "#Berita";
      return NextResponse.json({
        ok: true,
        message: `Pesan uji coba berhasil terkirim ke Discord ${label}!`,
      });
    }

    if (action === "broadcast_berita") {
      const { beritaId } = body;
      if (!beritaId) {
        return NextResponse.json({ error: "beritaId wajib diisi" }, { status: 400 });
      }

      const supabase = getServiceRoleClient();
      const { data: berita, error: fetchErr } = await supabase
        .from("berita")
        .select("*")
        .eq("id", beritaId)
        .single();

      if (fetchErr || !berita) {
        return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
      }

      if (!berita.is_published) {
        return NextResponse.json(
          {
            ok: false,
            error: "Berita masih berstatus Draft. Publikasikan terlebih dahulu sebelum menyiarkan ke Discord.",
          },
          { status: 400 }
        );
      }

      const result = await sendDiscordBeritaNotification(berita);
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Gagal menyiarkan berita ke Discord" },
          { status: 400 }
        );
      }

      const channelLabel = result.channel === "pengumuman" ? "#Pengumuman" : "#Berita";
      return NextResponse.json({
        ok: true,
        channel: result.channel,
        message: `Berita berhasil disiarkan ke Discord ${channelLabel}!`,
      });
    }

    if (action === "broadcast_kegiatan") {
      const { kegiatanId } = body;
      if (!kegiatanId) {
        return NextResponse.json({ error: "kegiatanId wajib diisi" }, { status: 400 });
      }

      const supabase = getServiceRoleClient();
      const { data: agenda, error: fetchErr } = await supabase
        .from("agendas")
        .select("*")
        .eq("id", kegiatanId)
        .single();

      if (fetchErr || !agenda) {
        return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
      }

      if (!agenda.is_published) {
        return NextResponse.json(
          {
            ok: false,
            error: "Kegiatan masih berstatus Draft. Aktifkan status Live terlebih dahulu sebelum menyiarkan ke Discord.",
          },
          { status: 400 }
        );
      }

      const [enrichedAgenda] = await enrichAgendasWithItemsAndCounts([agenda]);
      const result = await sendDiscordKegiatanNotification({
        ...enrichedAgenda,
        hasRegistrationForm:
          (Array.isArray(enrichedAgenda.form_schema) && enrichedAgenda.form_schema.length > 0) ||
          (Array.isArray(enrichedAgenda.items) && enrichedAgenda.items.length > 0),
      });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Gagal menyiarkan kegiatan ke Discord" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        channel: result.channel,
        message: `Kegiatan "${agenda.title}" berhasil disiarkan ke Discord #Pengumuman!`,
      });
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("POST /api/admin/discord error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
