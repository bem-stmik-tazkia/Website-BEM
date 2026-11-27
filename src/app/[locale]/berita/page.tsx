import React from "react";
import BeritaClient from "./BeritaClient";
import { getCachedBerita } from "@/app/(public)/actions/public-data";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/utils/seo";

// Revalidate at most every 60s; fine-grained invalidation via revalidateTag("berita")
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BeritaPage" });
  return buildPageMetadata({
    locale,
    path: "/berita",
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  });
}

export default async function BeritaPage() {
  const berita = await getCachedBerita();

  return <BeritaClient initialNews={berita as any[]} />;
}
