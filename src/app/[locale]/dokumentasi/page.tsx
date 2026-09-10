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

export default async function DokumentasiPage() {
  const data = await getCachedAgenda();

  // Filter the data on the server exactly like it was done on the client
  const filteredData = (data as any[]).filter((item: any) => {
    if (!item.is_published) return false;
    const isFinished = item.date && (new Date(item.date).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0));
    if (!isFinished) return false;
    return Array.isArray(item.gallery) && item.gallery.length > 0;
  });

  return <DokumentasiClient initialData={filteredData} />;
}
