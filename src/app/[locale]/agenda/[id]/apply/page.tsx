import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerParticipantCount } from "@/app/(internal)/admin/kegiatan/actions";
import { isDeadlinePassedJakarta } from "@/lib/registration-validation";
import ApplyClientForm from "./ApplyClientForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const agenda = await getKegiatanById(id);
  const { getAlternates } = await import("@/utils/seo");
  const hasRegistration =
    (agenda?.form_schema && agenda.form_schema.length > 0) ||
    (agenda?.items && agenda.items.length > 0);

  if (!agenda || (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))) {
    return { title: "Pendaftaran Tidak Ditemukan - BEM STMIK Tazkia" };
  }
  return {
    title: `Daftar ${agenda.title} - BEM STMIK Tazkia`,
    description: `Formulir pendaftaran untuk ${agenda.title}`,
    alternates: getAlternates(`/agenda/${id}/apply`, locale),
  };
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ item?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const preselectedItemId = resolvedSearchParams?.item;

  const agenda = await getKegiatanById(id);
  const hasRegistration =
    (agenda?.form_schema && agenda.form_schema.length > 0) ||
    (agenda?.items && agenda.items.length > 0);

  if (!agenda || (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))) {
    notFound();
  }

  const items = agenda.items || [];
  const participantCount = await getVolunteerParticipantCount(agenda.id);
  const maxQuota = agenda.max_participants;

  const isQuotaFull =
    items.length > 0
      ? items.every((it) => typeof it.quota === "number" && (it.filled_count || 0) >= it.quota)
      : maxQuota !== null && maxQuota !== undefined && participantCount >= maxQuota;

  const isClosed = isDeadlinePassedJakarta(agenda.deadline);

  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans">
      <ApplyClientForm
        agenda={agenda}
        isClosed={isClosed}
        isQuotaFull={isQuotaFull}
        preselectedItemId={preselectedItemId}
      />
    </div>
  );
}
