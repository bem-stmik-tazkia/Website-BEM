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

  // Filter the data on the server:
  // - item type "dokumentasi" (manual documentation): only check is_published + has gallery
  // - item type "event" / others: must also be a past/current event (date <= today)
  const filteredData = (data as any[]).filter((item: any) => {
    if (!item.is_published) return false;
    if (!Array.isArray(item.gallery) || item.gallery.length === 0) return false;

    // Manual documentation entries are always shown (no date constraint)
    if (item.type === "dokumentasi") return true;

    // Events must have already taken place (date <= today)
    const isFinished = item.date && (new Date(item.date).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0));
    return !!isFinished;
  });

  return <DokumentasiClient initialData={filteredData} />;
}
