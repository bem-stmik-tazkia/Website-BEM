import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── BERITA ──────────────────────────────────────────────────────────────────
// Cache 60s, tag "berita" — revalidated via revalidateTag("berita") on mutation
export const getCachedBerita = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data: beritaData, error } = await supabase
      .from("berita")
      .select("id, title, slug, excerpt, category, created_at, image_url, views, likes")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cached berita:", error);
      return [];
    }

    return (beritaData || []).map((b: Record<string, unknown>) => ({
      ...b,
      category: b.category === "Artikel" ? "Berita" : (b.category || "Berita"),
      type: "berita" as const,
      detailUrl: `/berita/${b.slug}`,
    }));
  },
  ["berita-list"],
  { revalidate: 60, tags: ["berita"] }
);

// ─── AGENDA ──────────────────────────────────────────────────────────────────
// Cache 60s, tag "agenda" — revalidated on kegiatan mutation
export const getCachedAgenda = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("agendas")
      .select(
        "id, title, slug, description, category, date, end_date, time_range, location, type, is_urgent, is_published, created_at, image_url, deadline, gallery, video_url"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cached agendas:", error);
      return [];
    }
    return data ?? [];
  },
  ["agenda-list"],
  { revalidate: 60, tags: ["agenda"] }
);

// ─── KABINET ─────────────────────────────────────────────────────────────────
// Cache 10 menit — data kabinet sangat jarang berubah
export const getCachedKabinet = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("kabinet_profiles")
      .select("id, periode, nama_kabinet, visi, misi, logo_url, is_active, created_at, updated_at")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching cached kabinet:", error);
      return null;
    }
    return data;
  },
  ["kabinet-active"],
  { revalidate: 600, tags: ["kabinet"] }
);
