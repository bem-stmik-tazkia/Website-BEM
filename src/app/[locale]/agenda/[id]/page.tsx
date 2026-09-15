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

  const cleanDescription = (agenda.description || "").replace(/<[^>]*>?/gm, '');
  const excerpt = cleanDescription.substring(0, 160) + (cleanDescription.length > 160 ? "..." : "");

  return {
    title: `${agenda.title} - BEM STMIK Tazkia`,
    description: excerpt,
    openGraph: {
      title: agenda.title,
      description: excerpt,
      url: `https://bem.stmik.tazkia.ac.id/agenda/${agenda.slug || id}`,
      images: [
        {
          url: agenda.image_url,
          alt: agenda.title,
        }
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: agenda.title,
      description: excerpt,
      images: [agenda.image_url],
    }
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
