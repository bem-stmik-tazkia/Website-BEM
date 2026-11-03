"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";

/**
 * Record a view for a berita or artikel.
 * Uses DB-level 24-hour cooldown per user_id (if authenticated) or device_id (if anon) via RPC.
 * Returns true if view was counted, false if still in cooldown.
 */
export async function recordView(
  table: 'berita' | 'articles' | 'agendas',
  id: string,
  deviceId: string,
  cooldownHours: number = 24
): Promise<boolean> {
  if (!id || (table !== 'berita' && table !== 'articles')) {
    return false;
  }

  // 1. Anti-Cheat: Validasi deviceId
  const cleanDeviceId = (deviceId || '').trim();
  if (cleanDeviceId.length < 5 || cleanDeviceId.length > 100) {
    return false;
  }

  // 2. Anti-Spam: Rate Limit berbasis IP (maks 30 record view per menit per IP)
  try {
    const headersList = await headers();
    const vercelIp = headersList.get("x-vercel-forwarded-for");
    const clientIp = vercelIp
      ? vercelIp.split(",")[0].trim()
      : (headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1");

    const rateLimit = await checkPostgresRateLimit(`view:${clientIp}`, 30, 60);
    if (!rateLimit.allowed) {
      console.warn(`[recordView] Rate limit view terlampaui untuk IP: ${clientIp}`);
      return false;
    }
  } catch (err) {
    console.error("[recordView] Rate limit check error:", err);
  }

  const supabase = await createClient();

  // 3. Gunakan RPC SECURITY DEFINER dengan Cooldown di DB (Multi-User Safe)
  const safeCooldown = Math.max(12, cooldownHours);

  if (table === 'berita') {
    const { data: counted, error } = await supabase.rpc('record_berita_view', {
      p_berita_id: id,
      p_device_id: cleanDeviceId,
      p_cooldown_hours: safeCooldown,
    });

    if (error) {
      console.error('[recordView] Berita RPC error:', error.message);
      return false;
    }

    return counted ?? false;
  } else {
    const { data: counted, error } = await supabase.rpc('record_article_view', {
      p_article_id: id,
      p_device_id: cleanDeviceId,
      p_cooldown_hours: safeCooldown,
    });

    if (error) {
      console.error('[recordView] Article RPC error:', error.message);
      return false;
    }

    return counted ?? false;
  }
}
