import React from "react";
import { getCachedKabinet } from "@/app/(public)/actions/public-data";
import { KabinetProfile } from "@/types/kabinet";
import KabinetContentClient from "@/components/kabinet/KabinetContentClient";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { buildPageMetadata } from "@/utils/seo";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'KabinetPage' });
  return buildPageMetadata({
    locale,
    path: '/kabinet',
    title: `${t("pageTitle") || "Kabinet"} - BEM STMIK Tazkia`,
    description: t("heroSubtitle"),
  });
}

export default async function KabinetPage() {
  const t = await getTranslations("KabinetPage");
  const kabinet = await getCachedKabinet();

  if (!kabinet) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-on-background mb-4">{t("notAvailableTitle")}</h1>
        <p className="text-on-surface-variant">{t("notAvailableDesc")}</p>
      </div>
    );
  }

  const profile = kabinet as KabinetProfile;
  if (!profile.periode || profile.periode === "2025/2026" || profile.periode === "25/26") {
    profile.periode = "2026/2027";
  }

  return <KabinetContentClient profile={profile} />;
}
