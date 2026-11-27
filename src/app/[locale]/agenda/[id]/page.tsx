import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerParticipantCount } from "@/app/(internal)/admin/kegiatan/actions";
import AgendaDetailClient from "./AgendaDetailClient";
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  resolveValidOgImage,
  safeJsonLdStringify,
  stripHtmlAndMarkdown,
} from "@/utils/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const agenda = await getKegiatanById(id);

  if (!agenda || !agenda.is_published) {
    return {
      title: "Kegiatan Tidak Ditemukan - BEM STMIK Tazkia",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const excerpt =
    stripHtmlAndMarkdown(agenda.description, 160) ||
    "Lihat detail agenda kegiatan di website BEM STMIK Tazkia.";
  const canonicalSlug = agenda.slug || id;

  return buildPageMetadata({
    locale,
    path: `/agenda/${canonicalSlug}`,
    title: `${agenda.title} - BEM STMIK Tazkia`,
    description: excerpt,
    image: agenda.image_url,
    imageAlt: agenda.title,
    type: "article",
    publishedTime: agenda.created_at,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const agenda = await getKegiatanById(id);

  if (!agenda || !agenda.is_published) {
    notFound();
  }

  const participantCount = await getVolunteerParticipantCount(agenda.id);
  const canonicalSlug = agenda.slug || id;
  const pageUrl = `${SITE_URL}/${locale}/agenda/${canonicalSlug}`;
  const ogImage = resolveValidOgImage(agenda.image_url);
  const description =
    stripHtmlAndMarkdown(agenda.description, 260) ||
    "Informasi agenda dan kegiatan mahasiswa BEM STMIK Tazkia.";
  const locationName = (agenda.location || "").trim();
  const isOnlineEvent = /online|zoom|google meet|gmeet|discord|daring|virtual/i.test(locationName);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: agenda.title,
    description,
    image: [ogImage],
    url: pageUrl,
    ...(agenda.date ? { startDate: agenda.date } : agenda.created_at ? { startDate: agenda.created_at } : {}),
    ...(agenda.end_date ? { endDate: agenda.end_date } : agenda.date ? { endDate: agenda.date } : {}),
    eventAttendanceMode: isOnlineEvent
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: isOnlineEvent
      ? {
          "@type": "VirtualLocation",
          url: pageUrl,
        }
      : {
          "@type": "Place",
          name: locationName || "Kampus STMIK Tazkia",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Bogor",
            addressRegion: "Jawa Barat",
            addressCountry: "ID",
          },
        },
    organizer: {
      "@type": "Organization",
      name: "BEM STMIK Tazkia",
      url: SITE_URL,
    },
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: `${SITE_URL}/${locale}` },
    { name: "Agenda", url: `${SITE_URL}/${locale}/agenda` },
    { name: agenda.title, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbJsonLd) }}
      />
      <AgendaDetailClient agenda={agenda} participantCount={participantCount} />
    </>
  );
}
