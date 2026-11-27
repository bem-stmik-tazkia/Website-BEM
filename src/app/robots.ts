import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://bem.stmik.tazkia.ac.id';

  const disallowList = [
    '/api/',
    '/admin/',
    '/*/admin/',
    '/dashboard/',
    '/*/dashboard/',
    '/profil',
    '/*/profil',
    '/auth/',
    '/*/auth/',
    '/login',
    '/maintenance',
    '/*/maintenance',
    '/storage/pendaftaran/',
    '/storage/certificates/',
    '/storage/public_images/pendaftaran/',
    '/storage/public_images/certificates/',
    '/storage/*/pendaftaran/',
    '/storage/*/certificates/',
    '/*?*preview=*',
    '/*?*next=*',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
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
          '/sertifikat',
          '/*/sertifikat',
          '/tools/',
          '/*/tools/',
        ],
        disallow: disallowList,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
