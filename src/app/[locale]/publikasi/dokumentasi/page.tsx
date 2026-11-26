import React from "react";
import DokumentasiClient from "./DokumentasiClient";
import { getCachedAgenda } from "@/app/(public)/actions/public-data";
import { AgendaKegiatan } from "@/types/agenda";

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { getAlternates } = await import('@/utils/seo');
  return {
    title: "Dokumentasi Kegiatan - BEM STMIK Tazkia",
    description: "Galeri foto dan dokumentasi kegiatan yang telah diselenggarakan oleh BEM STMIK Tazkia.",
    alternates: getAlternates('/publikasi/dokumentasi', locale),
  };
}

export const revalidate = 60;

export default async function DokumentasiPage() {
  const kegiatans = (await getCachedAgenda()) as AgendaKegiatan[];

  return <DokumentasiClient data={kegiatans} />;
}
