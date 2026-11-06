import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://bem.stmik.tazkia.ac.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/*/admin/',
          '/dashboard/',
          '/*/dashboard/',
          '/auth/',
          '/*/auth/',
          '/maintenance',
          '/*/maintenance',
          '/*?*preview=*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/berita/',
          '/*/berita/',
          '/artikel/',
          '/*/artikel/',
          '/agenda/',
          '/*/agenda/',
          '/kabinet',
          '/*/kabinet',
          '/dokumentasi',
          '/*/dokumentasi',
          '/volunteer',
          '/*/volunteer',
          '/tools/',
          '/*/tools/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/*/admin/',
          '/dashboard/',
          '/*/dashboard/',
          '/auth/',
          '/*/auth/',
          '/maintenance',
          '/*/maintenance',
          '/*?*preview=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
