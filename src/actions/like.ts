"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { checkPostgresRateLimit } from "@/lib/rateLimit";
import { getServiceRoleClient } from "@/lib/auth";

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
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // 3. Gunakan RPC / Service Role
  if (table === 'berita') {
    const { data: isLiked, error } = await supabase.rpc('toggle_berita_like', {
      p_berita_id: id,
      p_device_id: cleanDeviceId,
      p_user_id: userId,
    });

    if (!error && typeof isLiked === 'boolean') {
      return isLiked;
    }

    try {
      const service = getServiceRoleClient();
      let logQuery = service.from('berita_like_logs').select('id').eq('berita_id', id);
      if (userId) {
        logQuery = logQuery.eq('user_id', userId);
      } else {
        logQuery = logQuery.eq('device_id', cleanDeviceId).is('user_id', null);
      }

      const { data: existingLog } = await logQuery.maybeSingle();
      const { data: bData } = await service.from('berita').select('likes').eq('id', id).single();
      const currentLikes = bData?.likes || 0;

      if (existingLog) {
        await service.from('berita_like_logs').delete().eq('id', existingLog.id);
        await service.from('berita').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', id);
        return false;
      } else {
        await service.from('berita_like_logs').insert({
          berita_id: id,
          device_id: cleanDeviceId,
          user_id: userId,
        });
        await service.from('berita').update({ likes: currentLikes + 1 }).eq('id', id);
        return true;
      }
    } catch (fErr) {
      console.error('[toggleLike] Berita fallback error:', fErr);
      try {
        const service = getServiceRoleClient();
        const { data: bData } = await service.from('berita').select('likes').eq('id', id).single();
        const nextLikes = _increment ? (bData?.likes || 0) + 1 : Math.max(0, (bData?.likes || 0) - 1);
        await service.from('berita').update({ likes: nextLikes }).eq('id', id);
        return Boolean(_increment);
      } catch {}
      return false;
    }
  } else {
    // 1. Coba panggil RPC toggle_article_like
    const { data: isLiked, error } = await supabase.rpc('toggle_article_like', {
      p_article_id: id,
      p_device_id: cleanDeviceId,
      p_user_id: userId,
    });

    if (!error && typeof isLiked === 'boolean') {
      return isLiked;
    }

    // 2. Fallback aman menggunakan Service Role Client
    try {
      const service = getServiceRoleClient();
      const { data: servLiked, error: servErr } = await service.rpc('toggle_article_like', {
        p_article_id: id,
        p_device_id: cleanDeviceId,
        p_user_id: userId,
      });

      if (!servErr && typeof servLiked === 'boolean') {
        return servLiked;
      }

      // Logika like manual dengan service role
      let logQuery = service.from('article_like_logs').select('id').eq('article_id', id);
      if (userId) {
        logQuery = logQuery.eq('user_id', userId);
      } else {
        logQuery = logQuery.eq('device_id', cleanDeviceId).is('user_id', null);
      }

      const { data: existingLog } = await logQuery.maybeSingle();
      const { data: currentArt } = await service.from('articles').select('likes').eq('id', id).single();
      const currentLikes = currentArt?.likes || 0;

      if (existingLog) {
        await service.from('article_like_logs').delete().eq('id', existingLog.id);
        await service.from('articles').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', id);
        return false;
      } else {
        await service.from('article_like_logs').insert({
          article_id: id,
          device_id: cleanDeviceId,
          user_id: userId,
        });
        await service.from('articles').update({ likes: currentLikes + 1 }).eq('id', id);
        return true;
      }
    } catch (fallbackErr) {
      console.error("[toggleLike] Article fallback error:", fallbackErr);
      // Fallback terakhir update counter langsung
      try {
        const service = getServiceRoleClient();
        const { data: currentArt } = await service.from('articles').select('likes').eq('id', id).single();
        const nextLikes = _increment ? (currentArt?.likes || 0) + 1 : Math.max(0, (currentArt?.likes || 0) - 1);
        await service.from('articles').update({ likes: nextLikes }).eq('id', id);
        return Boolean(_increment);
      } catch {}
      return false;
    }
  }
}
