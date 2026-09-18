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
    '/kabinet',
    '/berita',
    '/agenda',
    '/publikasi/dokumentasi',
    '/tools/acak-nama',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Iterate over all locales
  routing.locales.forEach((locale) => {
    // 1. Static Routes
    staticRoutes.forEach((route) => {
      const languages: Record<string, string> = {};
      routing.locales.forEach((altLocale) => {
        languages[altLocale] = `${baseUrl}/${altLocale}${route}`;
      });
      // x-default for users with languages not in our list
      languages['x-default'] = `${baseUrl}/${routing.defaultLocale}${route}`;

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages,
        },
      });
    });

    // 2. Dynamic Routes: Berita
    if (berita) {
      berita.forEach((item) => {
        const languages: Record<string, string> = {};
        routing.locales.forEach((altLocale) => {
          languages[altLocale] = `${baseUrl}/${altLocale}/berita/${item.slug}`;
        });
        languages['x-default'] = `${baseUrl}/${routing.defaultLocale}/berita/${item.slug}`;

        sitemapEntries.push({
          url: `${baseUrl}/${locale}/berita/${item.slug}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages,
          },
        });
      });
    }

    // 3. Dynamic Routes: Agenda
    if (agendas) {
      agendas.forEach((item) => {
        const slugOrId = item.slug || item.id;
        const languages: Record<string, string> = {};
        routing.locales.forEach((altLocale) => {
          languages[altLocale] = `${baseUrl}/${altLocale}/agenda/${slugOrId}`;
        });
        languages['x-default'] = `${baseUrl}/${routing.defaultLocale}/agenda/${slugOrId}`;

        sitemapEntries.push({
          url: `${baseUrl}/${locale}/agenda/${slugOrId}`,
          lastModified: item.created_at ? new Date(item.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages,
          },
        });
      });
    }
  });

  return sitemapEntries;
}
