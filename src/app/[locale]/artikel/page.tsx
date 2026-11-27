import React from "react";
import { createPublicClient } from "@/utils/supabase/public";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/utils/seo";
import ArtikelClient, { PublishedArticleItem } from "./ArtikelClient";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ArticleList" });
  return buildPageMetadata({
    locale,
    path: "/artikel",
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  });
}

async function getPublishedArticles(): Promise<PublishedArticleItem[]> {
  try {
    const supabase = createPublicClient();
    // Mengambil dari view publik aman public.published_articles
    const { data: articles, error } = await supabase
      .from("published_articles")
      .select("*")
      .order("published_at", { ascending: false });

    if (error || !articles) {
      console.error("[ArtikelPage] Error fetching articles:", error);
      return [];
    }

    if (articles.length === 0) return [];

    // Ambil profil penulis dari author_profiles view
    const authorIds = Array.from(new Set(articles.map((a) => a.author_id)));
    const { data: authors } = await supabase
      .from("author_profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);

    const authorMap = new Map((authors || []).map((au) => [au.id, au]));

    return articles.map((art) => ({
      ...art,
      author: authorMap.get(art.author_id) || null,
    }));
  } catch (err) {
    console.error("[ArtikelPage] Unexpected error:", err);
    return [];
  }
}

export default async function ArtikelPage() {
  const articles = await getPublishedArticles();

  return <ArtikelClient initialArticles={articles} />;
}
