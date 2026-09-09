"use server";

import { createClient } from "@/utils/supabase/server";

export async function recordView(table: 'berita' | 'agendas', id: string) {
  const supabase = await createClient();
  
  // Get current views
  const { data } = await supabase.from(table).select('views').eq('id', id).single();
  
  if (data) {
    const newViews = (data.views || 0) + 1;
    await supabase.from(table).update({ views: newViews }).eq('id', id);
  }
}
