import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ArtikelDetailClient from "./ArtikelDetailClient";
import { PublishedArticleItem } from "../ArtikelClient";

async function getArticleBySlug(slug: string): Promise<PublishedArticleItem | null> {
  try {
    const supabase = await createClient();
    const { data: article, error } = await supabase
      .from("published_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !article) {
      return null;
    }

    // Ambil author profile dari author_profiles view
    const { data: author } = await supabase
      .from("author_profiles")
      .select("id, full_name, avatar_url")
      .eq("id", article.author_id)
      .maybeSingle();

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
    const supabase = await createClient();
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
    return {
      title: "Artikel Tidak Ditemukan - BEM STMIK Tazkia",
    };
  }

  const cleanDescription = (article.content || "").replace(/<[^>]*>?/gm, "").replace(/[#*_`]/g, "");
  const excerpt = cleanDescription.substring(0, 160) + (cleanDescription.length > 160 ? "..." : "");

  return {
    title: `${article.title} - BEM STMIK Tazkia`,
    description: excerpt,
    openGraph: {
      title: article.title,
      description: excerpt,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/artikel/${article.slug}`,
      images: article.cover_url
        ? [
            {
              url: article.cover_url,
              alt: article.title,
            },
          ]
        : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: excerpt,
      images: article.cover_url ? [article.cover_url] : [],
    },
  };
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(article.id, article.category);

  return <ArtikelDetailClient article={article} relatedArticles={related} />;
}
