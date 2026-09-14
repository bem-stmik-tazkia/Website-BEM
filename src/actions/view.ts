"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    // Gunakan RPC yang sudah ada cooldown + logging di DB
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

  // Fallback untuk table lain (agendas) — masih pakai simple increment
  // TODO: buat tabel log untuk agendas juga jika diperlukan
  const { data } = await supabase.from(table).select('views').eq('id', id).single();
  if (data) {
    await supabase.from(table).update({ views: (data.views || 0) + 1 }).eq('id', id);
    return true;
  }
  return false;
}
