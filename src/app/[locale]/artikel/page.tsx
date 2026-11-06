import React from "react";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import ArtikelClient, { PublishedArticleItem } from "./ArtikelClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ArticleList" });
  return {
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  };
}

async function getPublishedArticles(): Promise<PublishedArticleItem[]> {
  try {
    const supabase = await createClient();
    // Mengambil dari view publik aman public.published_articles
    const { data: articles, error } = await supabase
      .from("published_articles")
      .select("*")
      .order("published_at", { ascending: false });

    if (error || !articles) {
      console.error("[ArtikelPage] Error fetching articles:", error);
      return [];
    }

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

