"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";

export async function toggleLike(table: 'berita', id: string, increment: boolean, deviceId?: string) {
  if (table !== 'berita' || !id) {
    return false;
  }

  // 1. Anti-Cheat: Validasi deviceId
  const cleanDeviceId = (deviceId || '').trim();
  if (cleanDeviceId.length < 5 || cleanDeviceId.length > 100) {
    console.warn("[toggleLike] Ditolak: deviceId tidak valid.");
    return false;
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

  // 3. Gunakan RPC SECURITY DEFINER toggle_berita_like
  // Di DB: Dilindungi constraint UNIQUE(berita_id, device_id).
  // 1 perangkat hanya bisa like 1 kali. Klik lagi = unlike.
  const { data: isLiked, error } = await supabase.rpc('toggle_berita_like', {
    p_berita_id: id,
    p_device_id: cleanDeviceId,
    p_user_id: userId,
  });

  if (error) {
    console.error("[toggleLike] RPC error:", error.message);
    return false;
  }

  return isLiked ?? false;
}
