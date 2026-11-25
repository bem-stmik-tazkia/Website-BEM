import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerApplications } from "../../actions";
import PendaftarClient from "./PendaftarClient";
import { hasAnyFormQuestions } from "@/lib/registration-validation";

export const metadata = {
  title: "Kelola Pendaftar - BEM STMIK Tazkia Admin",
};

export default async function KelolaPendaftarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);

  const hasRegistration = hasAnyFormQuestions(agenda?.form_schema, agenda?.items);

  if (
    !agenda ||
    (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))
  ) {
    notFound();
  }

  const applications = await getVolunteerApplications(id);

  return <PendaftarClient agenda={agenda} initialApplications={applications} />;
}
