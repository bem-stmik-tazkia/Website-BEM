import React from "react";
import AgendaClient from "./AgendaClient";
import { getCachedAgenda } from "@/app/(public)/actions/public-data";

export const metadata = {
  title: "Agenda & Kegiatan - BEM STMIK Tazkia",
  description: "Ikuti berbagai acara, kompetisi, dan program rekrutmen terbaru yang diselenggarakan oleh BEM STMIK Tazkia.",
};

export default async function AgendaPage() {
  const kegiatans = await getCachedAgenda();

  return <AgendaClient data={kegiatans as any[]} />;
}
