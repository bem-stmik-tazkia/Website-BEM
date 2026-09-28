import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BeritaDetailClient from "./BeritaDetailClient";

async function getBeritaBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("berita")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching berita by slug:", error);
    return null;
  }
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const berita = await getBeritaBySlug(id);
  const { getAlternates } = await import('@/utils/seo');
  
  if (!berita) {
    return {
      title: "Berita Tidak Ditemukan - BEM STMIK Tazkia",
    };
  }

  // Strip HTML tags from content for a clean description
  const cleanDescription = (berita.content || "").replace(/<[^>]*>?/gm, '');
  const excerpt = cleanDescription.substring(0, 160) + (cleanDescription.length > 160 ? "..." : "");

  return {
    title: `${berita.title} - BEM STMIK Tazkia`,
    description: excerpt,
    alternates: getAlternates(`/berita/${berita.slug}`, locale),
    openGraph: {
      title: berita.title,
      description: excerpt,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/berita/${berita.slug}`,
      images: [
        {
          url: berita.image_url,
          alt: berita.title,
        }
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: berita.title,
      description: excerpt,
      images: [berita.image_url],
    }
  };
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const berita = await getBeritaBySlug(id);

  if (!berita) {
    notFound();
  }

  return <BeritaDetailClient />;
}
