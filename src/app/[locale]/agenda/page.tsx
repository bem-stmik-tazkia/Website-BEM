import React from "react";
import AgendaClient from "./AgendaClient";
import { getCachedAgenda } from "@/app/(public)/actions/public-data";

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { getAlternates } = await import('@/utils/seo');
  return {
    title: "Agenda & Kegiatan - BEM STMIK Tazkia",
    description: "Ikuti berbagai acara, kompetisi, dan program rekrutmen terbaru yang diselenggarakan oleh BEM STMIK Tazkia.",
    alternates: getAlternates('/agenda', locale),
  };
}

export default async function AgendaPage() {
  const kegiatans = await getCachedAgenda();

  return <AgendaClient data={kegiatans as any[]} />;
}
