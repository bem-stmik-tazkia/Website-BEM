import React from "react";
import DokumentasiClient from "./DokumentasiClient";
import { getCachedAgenda } from "@/app/(public)/actions/public-data";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations("DokumentasiPage");
  return {
    title: `${t("heroTitlePart1")} ${t("heroTitlePart2")} - BEM STMIK Tazkia`,
    description: t("heroSubtitle"),
  };
}

export const dynamic = "force-dynamic";

export default async function DokumentasiPage() {
  const data = await getCachedAgenda();

  // Filter the data on the server:
  // - Must be published
  // - Must have documentation (gallery photos or video/drive link)
  // - Type "dokumentasi" entries are always included
  const filteredData = (data as any[]).filter((item: any) => {
    if (!item.is_published) return false;

    // Manual documentation entries are always shown
    if (item.type === "dokumentasi") return true;

    // Events that have documentation (gallery photos or video/drive link)
    const hasGallery = Array.isArray(item.gallery) && item.gallery.filter(Boolean).length > 0;
    const hasVideo = typeof item.video_url === 'string' && item.video_url.trim().length > 0;

    return hasGallery || hasVideo;
  });

  return <DokumentasiClient initialData={filteredData} />;
}
