import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerApplications } from "@/app/(internal)/admin/kegiatan/actions";
import AgendaDetailClient from "./AgendaDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);
  if (!agenda) {
    return {
      title: "Kegiatan Tidak Ditemukan - BEM STMIK Tazkia",
    };
  }
  return {
    title: `${agenda.title} - BEM STMIK Tazkia`,
    description: agenda.description?.substring(0, 160) || "Detail kegiatan BEM STMIK Tazkia.",
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);

  if (!agenda) {
    notFound();
  }

  const applications = await getVolunteerApplications(agenda.id);
  const participantCount = applications ? applications.length : 0;

  return <AgendaDetailClient agenda={agenda} participantCount={participantCount} />;
}
