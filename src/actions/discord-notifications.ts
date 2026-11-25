"use server";

import { requireAdmin } from "@/lib/auth";
import {
  sendDiscordArticlePublishedNotification,
  sendDiscordReleaseUpdateNotification,
  DiscordArticlePublishedPayload,
  DiscordReleaseUpdatePayload,
} from "@/lib/discord";

/**
 * Server Action: Siarkan artikel mahasiswa yang baru diterbitkan ke Discord #Berita.
 * Hanya dapat dipanggil oleh admin terverifikasi.
 */
export async function notifyDiscordArticlePublished(
  payload: DiscordArticlePublishedPayload
) {
  try {
    const { user, supabase } = await requireAdmin();
    let authorName = payload.authorName;
    if ((!authorName || authorName.includes("@")) && user?.id && !payload.authorName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) authorName = profile.full_name;
    }

    return await sendDiscordArticlePublishedNotification({
      ...payload,
      authorName: authorName || "Mahasiswa STMIK Tazkia",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[notifyDiscordArticlePublished] Exception:", msg);
    return { ok: false, channel: "berita" as const, error: msg };
  }
}

/**
 * Server Action: Siarkan info rilis / What's New setelah maintenance selesai ke Discord #Pengumuman.
 * Hanya dapat dipanggil oleh admin terverifikasi.
 */
export async function notifyDiscordReleaseUpdate(
  payload: DiscordReleaseUpdatePayload
) {
  try {
    await requireAdmin();
    return await sendDiscordReleaseUpdateNotification(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[notifyDiscordReleaseUpdate] Exception:", msg);
    return { ok: false, channel: "pengumuman" as const, error: msg };
  }
}
