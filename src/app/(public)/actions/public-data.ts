import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getCachedBerita = async () => {
  const supabase = createPublicClient();

  // 1. Ambil berita resmi dari tabel berita
  const { data: beritaData, error } = await supabase
    .from('berita')
    .select('id, title, slug, excerpt, category, created_at, image_url, views, likes')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching cached berita:", error);
  }

  // 2. Ambil artikel karya mahasiswa yang sudah berstatus published
  let articleList: any[] = [];
  try {
    const { data: articlesData, error: artError } = await supabase
      .from('published_articles')
      .select('id, title, slug, content, category, published_at, cover_url, views, likes')
      .order('published_at', { ascending: false });

    if (!artError && articlesData && articlesData.length > 0) {
      articleList = articlesData.map((art: any) => ({
        id: art.id,
        title: art.title,
        slug: art.slug,
        excerpt: art.content
          ? art.content.replace(/<[^>]*>?/gm, '').replace(/[#*_`]/g, '').slice(0, 160) + '...'
          : '',
        category: 'Artikel',
        created_at: art.published_at || new Date().toISOString(),
        image_url: art.cover_url || '/images/hero.webp',
        views: art.views || 0,
        likes: art.likes || 0,
        type: 'article',
        detailUrl: `/artikel/${art.slug}`,
      }));
    }
  } catch (err) {
    console.warn("[getCachedBerita] published_articles view not available yet:", err);
  }

  const normalizedBerita = (beritaData || []).map((b: any) => ({
    ...b,
    type: 'berita',
    detailUrl: `/berita/${b.slug}`,
  }));

  // Gabungkan dan urutkan berdasarkan waktu terbit terbaru
  const combined = [...normalizedBerita, ...articleList].sort((a: any, b: any) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return combined;
};

export const getCachedAgenda = async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('agendas')
    .select('id, title, slug, description, category, date, end_date, time_range, location, type, is_urgent, is_published, created_at, image_url, deadline, gallery, video_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching cached agendas:", error);
    return [];
  }
  return data;
};

export const getCachedKabinet = async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('kabinet_profiles')
    .select('id, periode, nama_kabinet, visi, misi, logo_url, is_active, created_at, updated_at')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error("Error fetching cached kabinet:", error);
    return null;
  }
  return data;
};
