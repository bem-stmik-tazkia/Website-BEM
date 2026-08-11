import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Auth guard – only admin can create/update berita
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, slug, category, excerpt, content, image_url, tags, is_published } = body;

    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json({ error: "Field wajib tidak boleh kosong" }, { status: 400 });
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

    if (id) {
      const { error } = await supabase.from("berita").update(data).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("berita").insert(data);
      if (error) throw error;
    }

    revalidatePath("/admin/berita");
    revalidatePath("/berita");

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Save berita error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
