import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sendNewBeritaNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Auth guard – only admin can create/update berita
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    // Telegram notification logic:
    // Automatically send for newly published articles, or if explicitly requested
    let telegramResult: { ok: boolean; error?: string } | null = null;
    const shouldSendTelegram =
      send_telegram === true ||
      (!id && data.is_published && send_telegram !== false);

    if (shouldSendTelegram && savedBerita) {
      try {
        telegramResult = await sendNewBeritaNotification(savedBerita);
      } catch (teleErr: unknown) {
        const msg = teleErr instanceof Error ? teleErr.message : "Error sending telegram";
        console.error("Gagal mengirim notifikasi Telegram:", msg);
        telegramResult = { ok: false, error: msg };
      }
    }

    return NextResponse.json({
      ok: true,
      data: savedBerita,
      telegram: telegramResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Save berita error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
