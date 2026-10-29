"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";

/**
 * Record a view for a berita article.
 * Uses DB-level 24-hour cooldown per device_id via `record_berita_view` RPC.
 * Returns true if view was counted, false if still in cooldown.
 */
export async function recordView(
  table: 'berita' | 'agendas',
  id: string,
  deviceId: string,
  cooldownHours: number = 24
): Promise<boolean> {
  if (table !== 'berita' || !id) {
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

  // 3. Gunakan RPC SECURITY DEFINER dengan Cooldown 24 Jam di DB
  // Nilai cooldown dipaksa minimal 12 jam di DB sehingga caller tidak bisa bypass dengan 0.
  const { data: counted, error } = await supabase.rpc('record_berita_view', {
    p_berita_id: id,
    p_device_id: cleanDeviceId,
    p_cooldown_hours: Math.max(12, cooldownHours),
  });

  if (error) {
    console.error('[recordView] RPC error:', error.message);
    return false;
  }

  return counted ?? false;
}
