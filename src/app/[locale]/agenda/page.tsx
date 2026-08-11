import React from "react";
import AgendaClient from "./AgendaClient";
import { getKegiatans } from "@/app/(internal)/admin/kegiatan/actions";

export const metadata = {
  title: "Agenda & Kegiatan - BEM STMIK Tazkia",
  description: "Ikuti berbagai acara, kompetisi, dan program rekrutmen terbaru yang diselenggarakan oleh BEM STMIK Tazkia.",
};

export default async function AgendaPage() {
  const kegiatans = await getKegiatans();

  return <AgendaClient data={kegiatans} />;
}
