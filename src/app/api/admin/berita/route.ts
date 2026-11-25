import { verifyAdminApi } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { sendDiscordBeritaNotification } from "@/lib/discord";

export async function POST(req: Request) {
  try {
    // Auth guard – only admin can create/update berita
    const auth = await verifyAdminApi();
    if (!auth.authorized) {
      return auth.response;
    }
    const { supabase } = auth;

    const body = await req.json();
    const {
      id,
      title,
      slug,
      category,
      excerpt,
      content,
      image_url,
      tags,
      is_published,
      send_discord,
      send_telegram,
    } = body;

    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json(
        { error: "Field wajib tidak boleh kosong" },
        { status: 400 }
      );
    }

    const data = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      excerpt: excerpt.trim(),
      content: content.trim(),
      image_url: image_url?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      is_published: is_published ?? true,
    };

    let savedBerita = null;

    if (id) {
      const { data: updated, error } = await supabase
        .from("berita")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      savedBerita = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("berita")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      savedBerita = inserted;
    }

    revalidatePath("/admin/berita");
    revalidatePath("/berita");
    revalidateTag("berita", "max");

    // Discord notification logic:
    // Hanya kirim otomatis untuk berita baru (!id) yang dipublikasikan.
    // Saat edit berita yang sudah ada (id ada), JANGAN kirim kecuali admin mengaktifkan kirim ulang secara eksplisit.
    const broadcastFlag = send_discord !== undefined ? send_discord : send_telegram;
    let discordResult: { ok: boolean; channel?: string; error?: string } | null = null;
    const shouldSendDiscord = id
      ? broadcastFlag === true && data.is_published
      : data.is_published && broadcastFlag !== false;

    if (shouldSendDiscord && savedBerita) {
      try {
        discordResult = await sendDiscordBeritaNotification(savedBerita);
      } catch (discordErr: unknown) {
        const msg = discordErr instanceof Error ? discordErr.message : "Error sending Discord";
        console.error("Gagal mengirim notifikasi Discord:", msg);
        discordResult = { ok: false, error: "Gagal mengirim notifikasi Discord" };
      }
    }

    return NextResponse.json({
      ok: true,
      data: savedBerita,
      discord: discordResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Save berita error:", msg);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
