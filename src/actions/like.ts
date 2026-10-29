"use server";

import { createClient } from "@/utils/supabase/server";

export async function toggleLike(table: 'berita', id: string, increment: boolean, deviceId?: string) {
  if (table !== 'berita') {
    return false;
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  // Gunakan RPC SECURITY DEFINER toggle_berita_like alih-alih direct table UPDATE.
  // Ini memastikan operasi like tunduk pada logging dan anti-spam DB.
  const { data: isLiked, error } = await supabase.rpc('toggle_berita_like', {
    p_berita_id: id,
    p_device_id: deviceId || 'server_action_device',
    p_user_id: userId,
  });

  if (error) {
    console.error("[toggleLike] RPC error:", error.message);
    return false;
  }

  return isLiked ?? false;
}
