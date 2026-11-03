"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";

export async function toggleLike(
  table: 'berita' | 'articles',
  id: string,
  _increment?: boolean,
  deviceId?: string
): Promise<boolean> {
  if (!id || (table !== 'berita' && table !== 'articles')) {
    return false;
  }

  // 1. Anti-Cheat: Validasi deviceId (dengan fallback otomatis jika kosong)
  let cleanDeviceId = (deviceId || '').trim();
  if (cleanDeviceId.length < 5 || cleanDeviceId.length > 100) {
    try {
      const headersList = await headers();
      const vercelIp = headersList.get("x-vercel-forwarded-for");
      const clientIp = vercelIp
        ? vercelIp.split(",")[0].trim()
        : (headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1");
      cleanDeviceId = `ip_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } catch {
      cleanDeviceId = 'guest_device';
    }
  }

  // 2. Anti-Spam: Rate Limit berbasis IP (maks 25 aksi like per menit per IP)
  try {
    const headersList = await headers();
    const vercelIp = headersList.get("x-vercel-forwarded-for");
    const clientIp = vercelIp
      ? vercelIp.split(",")[0].trim()
      : (headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1");

    const rateLimit = await checkPostgresRateLimit(`like:${clientIp}`, 25, 60);
    if (!rateLimit.allowed) {
      console.warn(`[toggleLike] Rate limit like terlampaui untuk IP: ${clientIp}`);
      return false;
    }
  } catch (err) {
    console.error("[toggleLike] Rate limit check error:", err);
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  // 3. Gunakan RPC SECURITY DEFINER (Multi-User Safe & Anti-Cheat)
  // Untuk Berita: toggle_berita_like
  // Untuk Artikel: toggle_article_like
  if (table === 'berita') {
    const { data: isLiked, error } = await supabase.rpc('toggle_berita_like', {
      p_berita_id: id,
      p_device_id: cleanDeviceId,
      p_user_id: userId,
    });

    if (error) {
      console.error("[toggleLike] Berita RPC error:", error.message);
      return false;
    }

    return isLiked ?? false;
  } else {
    const { data: isLiked, error } = await supabase.rpc('toggle_article_like', {
      p_article_id: id,
      p_device_id: cleanDeviceId,
      p_user_id: userId,
    });

    if (error) {
      console.error("[toggleLike] Article RPC error:", error.message);
      return false;
    }

    return isLiked ?? false;
  }
}
