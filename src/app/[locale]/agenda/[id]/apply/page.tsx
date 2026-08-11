import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerApplications } from "@/app/(internal)/admin/kegiatan/actions";
import ApplyClientForm from "./ApplyClientForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);
  const hasRegistration = agenda?.form_schema && agenda.form_schema.length > 0;
  
  if (!agenda || (agenda.type !== 'volunteer' && !(agenda.type === 'event' && hasRegistration))) {
    return { title: "Pendaftaran Tidak Ditemukan - BEM STMIK Tazkia" };
  }
  return {
    title: `Daftar ${agenda.title} - BEM STMIK Tazkia`,
    description: `Formulir pendaftaran untuk ${agenda.title}`,
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);
  const hasRegistration = agenda?.form_schema && agenda.form_schema.length > 0;

  if (!agenda || (agenda.type !== 'volunteer' && !(agenda.type === 'event' && hasRegistration))) {
    notFound();
  }

  const applications = await getVolunteerApplications(agenda.id);
  const participantCount = applications ? applications.length : 0;
  const maxQuota = agenda.max_participants;
  const isQuotaFull = maxQuota !== null && maxQuota !== undefined && participantCount >= maxQuota;

  // Cek apakah pendaftaran sudah ditutup
  const isClosed = agenda.deadline && new Date(agenda.deadline).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans">
      <ApplyClientForm agenda={agenda} isClosed={!!isClosed} isQuotaFull={!!isQuotaFull} />
    </div>
  );
}
