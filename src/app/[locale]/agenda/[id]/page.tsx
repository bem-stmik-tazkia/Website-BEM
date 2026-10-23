import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerApplications } from "@/app/(internal)/admin/kegiatan/actions";
import AgendaDetailClient from "./AgendaDetailClient";

function getValidOgImage(url?: string | null): string {
  if (!url) return "https://bem.stmik.tazkia.ac.id/images/logo2.webp";
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//i);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://bem.stmik.tazkia.ac.id${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const agenda = await getKegiatanById(id);
  const { getAlternates } = await import('@/utils/seo');

  if (!agenda) {
    return {
      title: "Kegiatan Tidak Ditemukan - BEM STMIK Tazkia",
    };
  }

  const cleanDescription = (agenda.description || "").replace(/<[^>]*>?/gm, '').trim();
  const excerpt = cleanDescription.length > 160
    ? cleanDescription.substring(0, 160) + "..."
    : (cleanDescription || "Lihat detail agenda kegiatan di website BEM STMIK Tazkia.");
  const imageUrl = getValidOgImage(agenda.image_url);
  const targetUrl = `https://bem.stmik.tazkia.ac.id/${locale}/agenda/${agenda.slug || id}`;

  return {
    title: `${agenda.title} - BEM STMIK Tazkia`,
    description: excerpt,
    alternates: getAlternates(`/agenda/${agenda.slug || id}`, locale),
    openGraph: {
      title: agenda.title,
      description: excerpt,
      url: targetUrl,
      siteName: "BEM STMIK Tazkia",
      locale: locale,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: agenda.title,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: agenda.title,
      description: excerpt,
      images: [imageUrl],
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
