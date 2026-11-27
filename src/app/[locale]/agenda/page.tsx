import React from "react";
import AgendaClient from "./AgendaClient";
import { getCachedAgenda } from "@/app/(public)/actions/public-data";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/utils/seo";

// Revalidate at most every 60s; fine-grained invalidation via revalidateTag("agenda")
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AgendaPage" });
  return buildPageMetadata({
    locale,
    path: "/agenda",
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  });
}

export default async function AgendaPage() {
  const kegiatans = await getCachedAgenda();

  return <AgendaClient data={kegiatans as any[]} />;
}
