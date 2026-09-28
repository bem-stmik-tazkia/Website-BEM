import React from "react";
import DokumentasiClient from "./DokumentasiClient";
import { getKegiatans } from "@/app/(internal)/admin/kegiatan/actions";

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

export default async function DokumentasiPage() {
  const kegiatans = await getKegiatans();

  return <DokumentasiClient data={kegiatans} />;
}
