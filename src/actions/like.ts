"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLike(table: 'berita', id: string, increment: boolean) {
  const supabase = await createClient();
  
  // Get current likes
  const { data } = await supabase.from(table).select('likes').eq('id', id).single();
  
  if (data) {
    const newLikes = increment ? data.likes + 1 : data.likes - 1;
    await supabase.from(table).update({ likes: Math.max(0, newLikes) }).eq('id', id);
  }
}
