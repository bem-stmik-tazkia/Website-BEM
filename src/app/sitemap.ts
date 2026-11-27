import { MetadataRoute } from 'next';
import { createPublicClient } from '@/utils/supabase/public';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/locales';
import { SITE_URL } from '@/utils/seo';

export const revalidate = 3600;

function buildAlternatesMap(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  SUPPORTED_LOCALES.forEach((altLocale) => {
    languages[altLocale] = `${SITE_URL}/${altLocale}${path}`;
  });
  languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  // Fetch only published agendas, berita, and articles to prevent leaking unpublished drafts
  const [{ data: agendas }, { data: berita }, { data: articles }] = await Promise.all([
    supabase
      .from('agendas')
      .select('id, slug, created_at')
      .eq('is_published', true),
    supabase
      .from('berita')
      .select('slug, created_at')
      .eq('is_published', true),
    supabase
      .from('published_articles')
      .select('slug, published_at, updated_at, created_at'),
  ]);

  const staticRoutes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/kabinet', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/berita', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/artikel', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/agenda', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/dokumentasi', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/sertifikat', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tools', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/tools/acak-nama', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tools/papan-skor', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tools/tic-tac-toe', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/tools/block-n-run', changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  SUPPORTED_LOCALES.forEach((locale) => {
    // 1. Static Routes (tanpa lastModified palsu yang berubah tiap request)
    staticRoutes.forEach((route) => {
      sitemapEntries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: buildAlternatesMap(route.path),
        },
      });
    });

    // 2. Dynamic Routes: Berita
    if (berita) {
      berita.forEach((item) => {
        if (!item.slug) return;
        const routePath = `/berita/${item.slug}`;
        sitemapEntries.push({
          url: `${SITE_URL}/${locale}${routePath}`,
          lastModified: item.created_at ? new Date(item.created_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: buildAlternatesMap(routePath),
          },
        });
      });
    }

    // 3. Dynamic Routes: Agenda
    if (agendas) {
      agendas.forEach((item) => {
        const slugOrId = item.slug || item.id;
        if (!slugOrId) return;
        const routePath = `/agenda/${slugOrId}`;
        sitemapEntries.push({
          url: `${SITE_URL}/${locale}${routePath}`,
          lastModified: item.created_at ? new Date(item.created_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: buildAlternatesMap(routePath),
          },
        });
      });
    }

    // 4. Dynamic Routes: Artikel Mahasiswa (Hanya yang berstatus published / tayang aktif)
    if (articles) {
      articles.forEach((item) => {
        if (!item.slug) return;
        const routePath = `/artikel/${item.slug}`;
        const modDate = item.updated_at || item.published_at || item.created_at;
        sitemapEntries.push({
          url: `${SITE_URL}/${locale}${routePath}`,
          lastModified: modDate ? new Date(modDate) : undefined,
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: buildAlternatesMap(routePath),
          },
        });
      });
    }
  });

  return sitemapEntries;
}
