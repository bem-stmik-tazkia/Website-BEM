import type { Metadata } from 'next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/locales';
import {
  DEFAULT_OG_RASTER_IMAGE,
  isDefaultPosterPath,
  isSvgImageUrl,
} from '@/lib/default-posters';

export const SITE_URL = 'https://bem.stmik.tazkia.ac.id';
export const SITE_NAME = 'BEM STMIK Tazkia';

const OG_LOCALE_MAP: Record<string, string> = {
  id: 'id_ID',
  en: 'en_US',
  ar: 'ar_AR',
  ja: 'ja_JP',
  fr: 'fr_FR',
};

export function getOgLocale(locale: string): string {
  return OG_LOCALE_MAP[locale] || 'id_ID';
}

export function getAlternates(path: string, currentLocale: string) {
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const languages: Record<string, string> = {};

  SUPPORTED_LOCALES.forEach((locale) => {
    languages[locale] = `${SITE_URL}/${locale}${normalizedPath}`;
  });

  languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${normalizedPath}`;

  return {
    canonical: `${SITE_URL}/${currentLocale}${normalizedPath}`,
    languages,
  };
}

export function stripHtmlAndMarkdown(raw?: string | null, maxLength = 160): string {
  const cleaned = (raw || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/[#*_`>]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3).trimEnd()}...`;
}

export function resolveValidOgImage(url?: string | null): string {
  if (!url || isDefaultPosterPath(url) || isSvgImageUrl(url)) {
    return DEFAULT_OG_RASTER_IMAGE;
  }
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//i);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noIndex = false,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const targetUrl = `${SITE_URL}/${locale}${normalizedPath}`;
  const ogImage = resolveValidOgImage(image);
  const isDefaultOg = ogImage === DEFAULT_OG_RASTER_IMAGE;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: getAlternates(normalizedPath, locale),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      url: targetUrl,
      siteName: SITE_NAME,
      locale: getOgLocale(locale),
      alternateLocale: SUPPORTED_LOCALES
        .filter((l) => l !== locale)
        .map((l) => getOgLocale(l)),
      type,
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime ? { modifiedTime } : {}),
      ...(type === 'article' && authors && authors.length > 0 ? { authors } : {}),
      images: [
        {
          url: ogImage,
          ...(isDefaultOg ? { width: 1200, height: 630 } : {}),
          alt: imageAlt || title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
