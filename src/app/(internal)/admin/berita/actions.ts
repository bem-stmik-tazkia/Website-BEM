"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { sendNewBeritaNotification } from "@/lib/telegram";

export async function saveBerita(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const category = formData.get("category") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const image_url = formData.get("image_url") as string;
  const tagsString = formData.get("tags") as string;
  const sendTelegram = formData.get("send_telegram") !== "false";

  const tags = tagsString ? tagsString.split(",").map((t) => t.trim()) : [];

  const data = {
    title,
    slug,
    category,
    excerpt,
    content,
    image_url,
    tags,
    is_published: true,
  };

  if (id) {
    // Update existing
    await supabase.from("berita").update(data).eq("id", id);
  } else {
    // Insert new
    const { data: inserted } = await supabase
      .from("berita")
      .insert(data)
      .select()
      .single();

    if (sendTelegram && inserted) {
      try {
        await sendNewBeritaNotification(inserted);
      } catch (e) {
        console.error("Gagal mengirim notif Telegram saat saveBerita:", e);
      }
    }
  }

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidateTag("berita", "max");
  redirect("/admin/berita");
}
