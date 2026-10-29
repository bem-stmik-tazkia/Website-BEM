"use server";

import { createClient } from "@/utils/supabase/server";

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
  const supabase = await createClient();

  if (table === 'berita') {
    // Gunakan RPC SECURITY DEFINER yang memiliki cooldown 24 jam & logging anti-spam di DB
    const { data: counted, error } = await supabase.rpc('record_berita_view', {
      p_berita_id: id,
      p_device_id: deviceId || 'unknown',
      p_cooldown_hours: cooldownHours,
    });

    if (error) {
      console.error('[recordView] RPC error:', error.message);
      return false;
    }

    return counted ?? false;
  }

  // Untuk tabel lain (agendas), direct update dinonaktifkan demi integritas RLS
  return false;
}
