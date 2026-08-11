"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveBerita(formData: FormData) {
  const supabase = await createClient();
  
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const category = formData.get("category") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const image_url = formData.get("image_url") as string;
  const tagsString = formData.get("tags") as string;
  
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];

  const data = {
    title,
    slug,
    category,
    excerpt,
    content,
    image_url,
    tags,
  };

  if (id) {
    // Update existing
    await supabase.from('berita').update(data).eq('id', id);
  } else {
    // Insert new
    await supabase.from('berita').insert(data);
  }

  revalidatePath('/admin/berita');
  revalidatePath('/berita');
  redirect('/admin/berita');
}
