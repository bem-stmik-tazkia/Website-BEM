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
  const { data, error } = await supabase
    .from('berita')
    .select('id, title, slug, excerpt, category, created_at, image_url, views, likes')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching cached berita:", error);
    return [];
  }
  return data;
};

export const getCachedAgenda = async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('agendas')
    .select('id, title, slug, description, category, date, end_date, time_range, location, type, is_urgent, is_published, created_at, image_url, deadline, gallery')
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
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error("Error fetching cached kabinet:", error);
    return null;
  }
  return data;
};
