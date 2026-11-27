import React from "react";
import { notFound } from "next/navigation";
import { getCertificateTemplateDetail } from "../actions";
import TemplateDetailClient from "./TemplateDetailClient";

export const metadata = {
  title: "Editor & Penerbit E-Sertifikat - Admin BEM STMIK Tazkia",
};

export const dynamic = "force-dynamic";

export default async function AdminCertificateTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCertificateTemplateDetail(id);

  if (!detail.schemaReady) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950">
        <p className="font-bold">Tabel database E-Sertifikat belum dijalankan.</p>
        <p className="text-xs mt-1">
          Jalankan file <code>supabase/migrations/20261127140000_create_certificates_system.sql</code> di Supabase SQL Editor.
        </p>
      </div>
    );
  }

  if (!detail.template) {
    notFound();
  }

  return <TemplateDetailClient initialDetail={detail} />;
}
