import React from "react";
import BeritaClient from "./BeritaClient";
import { getCachedBerita } from "@/app/(public)/actions/public-data";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations("BeritaPage");
  return {
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  };
}

export default async function BeritaPage() {
  const berita = await getCachedBerita();

  return <BeritaClient initialNews={berita as any[]} />;
}
