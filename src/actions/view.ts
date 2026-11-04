"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";
import { getServiceRoleClient } from "@/lib/auth";

/**
 * Record a view for a berita or artikel.
 * Uses DB-level cooldown per user_id / device_id via RPC with service role fallback.
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
  const safeCooldown = Math.max(12, cooldownHours);

  if (table === 'berita') {
    const { data: counted, error } = await supabase.rpc('record_berita_view', {
      p_berita_id: id,
      p_device_id: cleanDeviceId,
      p_cooldown_hours: safeCooldown,
    });

    if (error) {
      try {
        const service = getServiceRoleClient();
        const { data: bData } = await service.from('berita').select('views').eq('id', id).single();
        if (bData) {
          await service.from('berita').update({ views: (bData.views || 0) + 1 }).eq('id', id);
          return true;
        }
      } catch (fErr) {
        console.error('[recordView] Berita fallback error:', fErr);
      }
      return false;
    }

    return counted ?? false;
  } else {
    // 1. Coba RPC record_article_view via client
    const { data: counted, error } = await supabase.rpc('record_article_view', {
      p_article_id: id,
      p_device_id: cleanDeviceId,
      p_cooldown_hours: safeCooldown,
    });

    if (!error && typeof counted === 'boolean') {
      return counted;
    }

    // 2. Fallback service role client jika RPC belum aktif di Supabase
    try {
      const service = getServiceRoleClient();
      const { data: servCounted, error: servRpcErr } = await service.rpc('record_article_view', {
        p_article_id: id,
        p_device_id: cleanDeviceId,
        p_cooldown_hours: safeCooldown,
      });

      if (!servRpcErr && typeof servCounted === 'boolean') {
        return servCounted;
      }

      // Update langsung views artikel via service role
      const { data: art } = await service.from('articles').select('views').eq('id', id).single();
      if (art) {
        await service.from('articles').update({ views: (art.views || 0) + 1 }).eq('id', id);
        return true;
      }
    } catch (fallbackErr) {
      console.error('[recordView] Article service fallback error:', fallbackErr);
    }

    return false;
  }
}
