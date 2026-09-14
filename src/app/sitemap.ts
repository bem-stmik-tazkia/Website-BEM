import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bem.stmik.tazkia.ac.id';
  
  // Connect to Supabase to fetch dynamic routes
  const supabase = await createClient();
  
  // Fetch published agendas and berita
  const { data: agendas } = await supabase
    .from("agendas")
    .select("id, slug, created_at");
    
  const { data: berita } = await supabase
    .from("berita")
    .select("slug, created_at");

  // Define static routes
  const staticRoutes = [
    '',
    '/tentang',
    '/kabinet',
    '/berita',
    '/agenda',
    '/publikasi/dokumentasi',
    '/publikasi/saran',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Iterate over all locales
  routing.locales.forEach((locale) => {
    // 1. Static Routes
    staticRoutes.forEach((route) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    });

    // 2. Dynamic Routes: Berita
    if (berita) {
      berita.forEach((item) => {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/berita/${item.slug}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    // 3. Dynamic Routes: Agenda
    if (agendas) {
      agendas.forEach((item) => {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/agenda/${item.slug || item.id}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  });

  return sitemapEntries;
}
