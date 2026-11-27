import React from "react";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/utils/supabase/public";
import { getTranslations } from "next-intl/server";
import ArtikelDetailClient from "./ArtikelDetailClient";
import { PublishedArticleItem } from "../ArtikelClient";
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

async function getArticleBySlug(slug: string): Promise<PublishedArticleItem | null> {
  try {
    const supabase = createPublicClient();
    const { data: article, error } = await supabase
      .from("published_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !article) {
      return null;
    }

    // Ambil author profile dari author_profiles view (dengan toleransi jika bio baru dimigrasi)
    let author: any = null;
    const { data: authorWithBio, error: bioErr } = await supabase
      .from("author_profiles")
      .select("id, full_name, avatar_url, bio")
      .eq("id", article.author_id)
      .maybeSingle();

    if (!bioErr && authorWithBio) {
      author = authorWithBio;
    } else {
      const { data: basicAuthor } = await supabase
        .from("author_profiles")
        .select("id, full_name, avatar_url")
        .eq("id", article.author_id)
        .maybeSingle();
      author = basicAuthor || null;
    }

    return {
      ...article,
      author: author || null,
    };
  } catch (err) {
    console.error("[getArticleBySlug] Error:", err);
    return null;
  }
}

async function getRelatedArticles(
  currentId: string,
  category: string | null
): Promise<PublishedArticleItem[]> {
  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("published_articles")
      .select("*")
      .neq("id", currentId)
      .order("published_at", { ascending: false })
      .limit(4);

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    const t = await getTranslations({ locale, namespace: "ArticleDetail" });
    return {
      title: `${t("notFound")} - BEM STMIK Tazkia`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const excerpt =
    stripHtmlAndMarkdown(article.content, 160) ||
    "Baca artikel mahasiswa pilihan di portal intelektual BEM STMIK Tazkia.";
  const authorName = article.author?.full_name || "Mahasiswa STMIK Tazkia";

  return buildPageMetadata({
    locale,
    path: `/artikel/${article.slug}`,
    title: `${article.title} - BEM STMIK Tazkia`,
    description: excerpt,
    image: article.cover_url,
    imageAlt: article.title,
    type: "article",
    publishedTime: article.published_at || article.created_at,
    modifiedTime: (article as any).updated_at || article.published_at || article.created_at,
    authors: [authorName],
  });
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(article.id, article.category);
  const pageUrl = `${SITE_URL}/${locale}/artikel/${article.slug}`;
  const ogImage = resolveValidOgImage(article.cover_url);
  const authorName = article.author?.full_name || "Mahasiswa STMIK Tazkia";
  const description = stripHtmlAndMarkdown(article.content, 200);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    image: [ogImage],
    datePublished: article.published_at || article.created_at,
    dateModified: (article as any).updated_at || article.published_at || article.created_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo2.webp`,
      },
    },
    ...(article.category ? { articleSection: article.category } : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: `${SITE_URL}/${locale}` },
    { name: "Artikel", url: `${SITE_URL}/${locale}/artikel` },
    { name: article.title, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbJsonLd) }}
      />
      <ArtikelDetailClient article={article} relatedArticles={related} />
    </>
  );
}
