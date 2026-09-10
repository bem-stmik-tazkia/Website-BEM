"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordView(table: 'berita' | 'agendas', id: string) {
  const supabase = await createClient();
  
  // Get current views
  const { data } = await supabase.from(table).select('views').eq('id', id).single();
  
  if (data) {
    const newViews = (data.views || 0) + 1;
    await supabase.from(table).update({ views: newViews }).eq('id', id);
    
    // Clear the cache so the grid updates
    revalidatePath('/', 'layout');
  }
}
