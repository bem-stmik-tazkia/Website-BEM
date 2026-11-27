import React from "react";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/utils/supabase/public";
import BeritaDetailClient, { NewsDetail } from "./BeritaDetailClient";
import {
  SITE_NAME,
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  resolveValidOgImage,
  safeJsonLdStringify,
  stripHtmlAndMarkdown,
} from "@/utils/seo";

export const revalidate = 60;

async function getBeritaBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("berita")
      .select("id, title, slug, category, created_at, author, views, likes, image_url, tags, content, excerpt, is_published")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as NewsDetail;
  } catch (err) {
    console.error("Error fetching berita by slug:", err);
    return null;
  }
}

async function getRelatedBerita(currentId: string, category?: string | null): Promise<NewsDetail[]> {
  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("berita")
      .select("id, title, slug, category, created_at, author, views, likes, image_url, tags, content")
      .eq("is_published", true)
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query;
    return (data as NewsDetail[]) || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const berita = await getBeritaBySlug(id);

  if (!berita) {
    return {
      title: "Berita Tidak Ditemukan - BEM STMIK Tazkia",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const excerpt =
    stripHtmlAndMarkdown(berita.content, 160) ||
    "Baca berita terbaru dan pengumuman resmi di website BEM STMIK Tazkia.";

  return buildPageMetadata({
    locale,
    path: `/berita/${berita.slug}`,
    title: `${berita.title} - BEM STMIK Tazkia`,
    description: excerpt,
    image: berita.image_url,
    imageAlt: berita.title,
    type: "article",
    publishedTime: berita.created_at,
    authors: berita.author ? [berita.author.replace(/Humas\s+/i, "").trim() || SITE_NAME] : [SITE_NAME],
    keywords: Array.isArray(berita.tags) ? berita.tags : undefined,
  });
}

export default async function BeritaDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const berita = await getBeritaBySlug(id);

  if (!berita) {
    notFound();
  }

  const relatedNews = await getRelatedBerita(berita.id, berita.category);
  const pageUrl = `${SITE_URL}/${locale}/berita/${berita.slug}`;
  const ogImage = resolveValidOgImage(berita.image_url);
  const authorName = (berita.author || SITE_NAME).replace(/Humas\s+/i, "").trim() || SITE_NAME;
  const description = stripHtmlAndMarkdown(berita.content, 200);

  const newsJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: berita.title,
    description,
    image: [ogImage],
    datePublished: berita.created_at,
    dateModified: berita.created_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Organization",
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo2.webp`,
      },
    },
    ...(Array.isArray(berita.tags) && berita.tags.length > 0
      ? { keywords: berita.tags.join(", ") }
      : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: `${SITE_URL}/${locale}` },
    { name: "Berita", url: `${SITE_URL}/${locale}/berita` },
    { name: berita.title, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(newsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbJsonLd) }}
      />
      <BeritaDetailClient initialNews={berita} initialRelatedNews={relatedNews} />
    </>
  );
}
