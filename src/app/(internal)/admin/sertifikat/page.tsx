import React from "react";
import { getCertificateAdminOverview } from "./actions";
import CertificatesAdminClient from "./CertificatesAdminClient";

export const metadata = {
  title: "Kelola E-Sertifikat - Admin BEM STMIK Tazkia",
};

export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialAgendaId =
    typeof resolvedParams.agendaId === "string" ? resolvedParams.agendaId : null;

  const overview = await getCertificateAdminOverview();

  return (
    <CertificatesAdminClient
      initialOverview={overview}
      initialAgendaId={initialAgendaId}
    />
  );
}
