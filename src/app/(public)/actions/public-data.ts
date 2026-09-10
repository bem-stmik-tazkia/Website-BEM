import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getCachedBerita = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('berita')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching cached berita:", error);
      return [];
    }
    return data;
  },
  ['public-berita'],
  { tags: ['berita'] } // On-demand revalidation tag if needed, but path revalidation works too
);

export const getCachedAgenda = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('agendas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching cached agendas:", error);
      return [];
    }
    return data;
  },
  ['public-agendas'],
  { tags: ['agenda'] }
);

export const getCachedKabinet = unstable_cache(
  async () => {
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
  },
  ['public-kabinet'],
  { tags: ['kabinet'] }
);
