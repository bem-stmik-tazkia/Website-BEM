import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerApplications } from "../../actions";
import PendaftarClient from "./PendaftarClient";

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

  const hasRegistration =
    (agenda?.form_schema && agenda.form_schema.length > 0) ||
    (agenda?.items && agenda.items.length > 0);

  if (
    !agenda ||
    (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))
  ) {
    notFound();
  }

  const applications = await getVolunteerApplications(id);

  return <PendaftarClient agenda={agenda} initialApplications={applications} />;
}
