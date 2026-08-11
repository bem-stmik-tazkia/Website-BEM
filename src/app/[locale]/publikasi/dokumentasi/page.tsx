import React from "react";
import DokumentasiClient from "./DokumentasiClient";
import { getKegiatans } from "@/app/(internal)/admin/kegiatan/actions";

export const metadata = {
  title: "Dokumentasi Kegiatan - BEM STMIK Tazkia",
  description: "Galeri foto dan dokumentasi kegiatan yang telah diselenggarakan oleh BEM STMIK Tazkia.",
};

export default async function DokumentasiPage() {
  const kegiatans = await getKegiatans();

  return <DokumentasiClient data={kegiatans} />;
}
