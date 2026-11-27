"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiExternalLink,
  FiEye,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import type { CertificateRecord } from "@/types/certificate";
import {
  CERTIFICATE_DESIGN_PRESETS,
  DEFAULT_CERTIFICATE_SIGNERS,
  formatIndonesianLongDate,
} from "@/lib/certificate-utils";
import {
  deleteCertificateTemplate,
  saveCertificateTemplate,
  type CertificateAdminOverview,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import CertificatePreviewModal from "@/components/certificates/CertificatePreviewModal";

export default function CertificatesAdminClient({
  initialOverview,
  initialAgendaId,
}: {
  initialOverview: CertificateAdminOverview;
  initialAgendaId?: string | null;
}) {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [templates, setTemplates] = useState(initialOverview.templates);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const preselectedAgenda = initialAgendaId
    ? initialOverview.agendas.find((a) => a.id === initialAgendaId) || null
    : null;
  const matchingExistingTemplate = initialAgendaId
    ? templates.find((t) => t.agenda_id === initialAgendaId) || null
    : null;

  const [isCreateOpen, setIsCreateOpen] = useState(
    Boolean(initialAgendaId && !matchingExistingTemplate && initialOverview.schemaReady)
  );
  const [creating, setCreating] = useState(false);

  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(
    preselectedAgenda?.id || ""
  );
  const [title, setTitle] = useState<string>(preselectedAgenda?.title || "");
  const [subtitle, setSubtitle] = useState("SERTIFIKAT PENGHARGAAN");
  const [eventDateLabel, setEventDateLabel] = useState<string>(
    preselectedAgenda?.date ? formatIndonesianLongDate(preselectedAgenda.date) : ""
  );
  const [location, setLocation] = useState<string>(preselectedAgenda?.location || "");
  const [designPreset, setDesignPreset] = useState<
    "classic-navy" | "emerald-gold" | "modern-royal" | "custom-bg"
  >("classic-navy");

  const handleAgendaSelect = (agendaId: string) => {
    setSelectedAgendaId(agendaId);
    const found = initialOverview.agendas.find((a) => a.id === agendaId);
    if (found) {
      setTitle(found.title);
      setEventDateLabel(found.date ? formatIndonesianLongDate(found.date) : "");
      setLocation(found.location || "");
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.number_prefix.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError("Judul kegiatan sertifikat wajib diisi.");
      return;
    }

    setCreating(true);
    try {
      const res = await saveCertificateTemplate({
        agenda_id: selectedAgendaId || null,
        title: title.trim(),
        subtitle: subtitle.trim() || "SERTIFIKAT PENGHARGAAN",
        event_date_label: eventDateLabel.trim() || null,
        location: location.trim() || null,
        design_preset: designPreset,
        signers: DEFAULT_CERTIFICATE_SIGNERS,
        issued_city: "Bogor",
        issued_date_label: formatIndonesianLongDate(new Date()),
      });

      if (!res.ok || !res.id) {
        showError(res.error || "Gagal membuat template sertifikat.");
        return;
      }

      success("Template sertifikat berhasil dibuat! Mengarahkan ke editor...");
      setIsCreateOpen(false);
      router.push(`/admin/sertifikat/${res.id}`);
      router.refresh();
    } catch (err: any) {
      showError(err?.message || "Terjadi kesalahan saat menyimpan template.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      const res = await deleteCertificateTemplate(templateId);
      if (!res.ok) {
        showError(res.error || "Gagal menghapus template.");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setConfirmDeleteId(null);
      success("Template sertifikat berhasil dihapus.");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (!initialOverview.schemaReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
            Kelola E-Sertifikat
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Terbitkan e-sertifikat resmi dengan nomor seri &amp; QR code verifikasi.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-950 space-y-3">
          <div className="flex items-start gap-3">
            <FiAlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-extrabold text-base">
                Tabel Database E-Sertifikat Belum Dijalankan
              </h2>
              <p className="text-sm mt-1 text-amber-900">
                Untuk mengaktifkan fitur E-Sertifikat secara penuh, jalankan file migrasi SQL berikut di{" "}
                <strong>Supabase Dashboard → SQL Editor</strong>:
              </p>
              <code className="block mt-2 px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-mono text-amber-950">
                supabase/migrations/20261127140000_create_certificates_system.sql
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
              Kelola E-Sertifikat
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <FiShield size={12} /> QR Verifikasi Aktif
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Buat desain sertifikat otomatis atau template Canva kustom, lalu terbitkan massal dari pendaftar atau CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/sertifikat"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            <FiExternalLink size={15} />
            <span>Halaman Cek Sertifikat</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus size={17} />
            <span>Buat Sertifikat Acara Baru</span>
          </button>
        </div>
      </div>

      {/* Pintasan khusus jika datang dari ?agendaId= dan sudah punya template */}
      {matchingExistingTemplate && (
        <div className="bg-primary/5 border border-primary/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Template Terkait Kegiatan Ditemukan
            </p>
            <p className="text-sm font-extrabold text-on-surface mt-0.5">
              {matchingExistingTemplate.title} ({matchingExistingTemplate.issued_count || 0} sertifikat terbit)
            </p>
          </div>
          <Link
            href={`/admin/sertifikat/${matchingExistingTemplate.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shrink-0"
          >
            <span>Buka &amp; Terbitkan</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-bold">
            <span>Template / Acara</span>
            <FiAward className="text-primary" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">
            {initialOverview.stats.totalTemplates}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Konfigurasi desain tersedia
          </p>
        </div>
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-bold">
            <span>Sertifikat Sah</span>
            <FiCheckCircle className="text-emerald-600" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {initialOverview.stats.totalIssued}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Aktif &amp; lolos verifikasi QR
          </p>
        </div>
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-bold">
            <span>Tertaut Akun</span>
            <FiUsers className="text-blue-600" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
            {initialOverview.stats.linkedToAccountCount}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Tampil otomatis di dashboard mahasiswa
          </p>
        </div>
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-bold">
            <span>Dicabut</span>
            <FiAlertTriangle className="text-rose-500" size={16} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {initialOverview.stats.totalRevoked}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Ditandai tidak berlaku
          </p>
        </div>
      </div>

      {/* Templates Table / Grid */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
              Daftar Acara &amp; Template Sertifikat
            </h2>
            <p className="text-xs text-on-surface-variant">
              Klik &quot;Kelola &amp; Terbitkan&quot; untuk atur desain, terbitkan dari pendaftar, tambah manual, atau import CSV.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <FiSearch
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan sertifikat..."
              className="w-full bg-background border border-outline-variant/50 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-primary outline-none"
            />
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <FiAward size={26} />
            </div>
            <p className="font-extrabold text-on-surface text-base">
              {templates.length === 0
                ? "Belum Ada Template E-Sertifikat"
                : "Tidak Ada Template yang Cocok"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md">
              Klik tombol &quot;Buat Sertifikat Acara Baru&quot; di kanan atas untuk mulai membuat desain &amp; menerbitkan e-sertifikat kegiatan.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-outline-variant/25">
              {filteredTemplates.map((tpl) => {
                const presetMeta = CERTIFICATE_DESIGN_PRESETS.find(
                  (p) => p.id === tpl.design_preset
                );
                return (
                  <div key={tpl.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface break-words">
                          {tpl.title}
                        </p>
                        <p className="font-mono text-[11px] font-semibold text-primary mt-0.5 break-all">
                          {tpl.number_prefix}
                        </p>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
                        {tpl.issued_count || 0}/{tpl.certificate_count || 0}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: presetMeta?.primaryColor || "#143470" }}
                        />
                        {presetMeta?.label || tpl.design_preset}
                      </span>
                      {tpl.event_date_label && (
                        <span className="inline-flex items-center gap-1">
                          • <FiCalendar size={11} /> {tpl.event_date_label}
                        </span>
                      )}
                      {tpl.agenda_id && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                          Terhubung Agenda
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/admin/sertifikat/${tpl.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                      >
                        <span>Kelola &amp; Terbitkan</span>
                        <FiArrowRight size={13} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(tpl.id)}
                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Hapus Template"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-outline-variant/30">Acara / Sertifikat</th>
                    <th className="p-4 font-bold border-b border-outline-variant/30">Tema Desain</th>
                    <th className="p-4 font-bold border-b border-outline-variant/30 text-center">Terbit</th>
                    <th className="p-4 font-bold border-b border-outline-variant/30 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/25">
                  {filteredTemplates.map((tpl) => {
                    const presetMeta = CERTIFICATE_DESIGN_PRESETS.find(
                      (p) => p.id === tpl.design_preset
                    );
                    return (
                      <tr key={tpl.id} className="hover:bg-surface-variant/10 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-sm text-on-surface">{tpl.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant mt-0.5">
                            <span className="font-mono text-primary font-semibold">
                              {tpl.number_prefix}
                            </span>
                            {tpl.event_date_label && (
                              <span className="inline-flex items-center gap-1">
                                <FiCalendar size={11} /> {tpl.event_date_label}
                              </span>
                            )}
                            {tpl.agenda_id && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                                Terhubung Agenda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: presetMeta?.primaryColor || "#143470" }}
                            />
                            {presetMeta?.label || tpl.design_preset}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                            {tpl.issued_count || 0} / {tpl.certificate_count || 0}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/admin/sertifikat/${tpl.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                            >
                              <span>Kelola &amp; Terbitkan</span>
                              <FiArrowRight size={13} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tpl.id)}
                              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus Template"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Recent Certificates Quick List */}
      {initialOverview.recentCertificates.length > 0 && (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant/25">
            <h2 className="text-base font-extrabold text-on-surface">
              Sertifikat Terbaru Diterbitkan
            </h2>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-outline-variant/20 text-xs">
            {initialOverview.recentCertificates.map((cert) => (
              <div key={cert.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-primary break-all">
                    {cert.certificate_code}
                  </span>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      cert.status === "revoked"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {cert.status === "revoked" ? "Dicabut" : "Sah"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">{cert.recipient_name}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {cert.role_title} • {cert.activity_title}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewCert(cert)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                  >
                    <FiEye size={13} /> Pratinjau
                  </button>
                  {cert.template_id && (
                    <Link
                      href={`/admin/sertifikat/${cert.template_id}`}
                      className="flex-1 text-center px-3 py-2 rounded-xl border border-outline-variant/40 font-bold text-on-surface hover:border-primary hover:text-primary"
                    >
                      Kelola
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-variant/20 text-on-surface-variant uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 font-bold border-b border-outline-variant/25">Kode</th>
                  <th className="p-3.5 font-bold border-b border-outline-variant/25">Penerima</th>
                  <th className="p-3.5 font-bold border-b border-outline-variant/25">Peran &amp; Acara</th>
                  <th className="p-3.5 font-bold border-b border-outline-variant/25 text-center">Status</th>
                  <th className="p-3.5 font-bold border-b border-outline-variant/25 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {initialOverview.recentCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-variant/10">
                    <td className="p-3.5 font-mono font-bold text-primary whitespace-nowrap">
                      {cert.certificate_code}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-on-surface">{cert.recipient_name}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant">
                        {cert.certificate_number}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-on-surface">{cert.role_title}</p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">
                        {cert.activity_title}
                      </p>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          cert.status === "revoked"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {cert.status === "revoked" ? "Dicabut" : "Sah"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                          <FiEye size={13} /> Pratinjau
                        </button>
                        {cert.template_id && (
                          <Link
                            href={`/admin/sertifikat/${cert.template_id}`}
                            className="px-2.5 py-1.5 rounded-lg border border-outline-variant/40 font-bold text-on-surface hover:border-primary hover:text-primary"
                          >
                            Kelola
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Buat Template Sertifikat Baru */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-xl max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-outline-variant/25 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
                  Buat Template Sertifikat Acara
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Pilih kegiatan BEM atau buat kegiatan eksternal mandiri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-full hover:bg-surface-variant/40 cursor-pointer shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Hubungkan ke Agenda / Kegiatan BEM (Opsional)
                </label>
                <select
                  value={selectedAgendaId}
                  onChange={(e) => handleAgendaSelect(e.target.value)}
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">-- Acara Mandiri / Eksternal (Tidak terhubung agenda) --</option>
                  {initialOverview.agendas.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.title} ({ag.accepted_count} pendaftar diterima)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant">
                  Jika dihubungkan, pendaftar yang berstatus &quot;Diterima&quot; dapat langsung diterbitkan massal.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Nama Kegiatan yang Tercetak di Sertifikat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Seminar Nasional Teknologi Informasi 2026"
                  required
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Judul Sertifikat</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="SERTIFIKAT PENGHARGAAN"
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Tanggal Pelaksanaan</label>
                  <input
                    type="text"
                    value={eventDateLabel}
                    onChange={(e) => setEventDateLabel(e.target.value)}
                    placeholder="Contoh: 26 November 2026"
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Lokasi Acara</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Auditorium STMIK Tazkia"
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Tema Desain Awal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CERTIFICATE_DESIGN_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDesignPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        designPreset === preset.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-outline-variant/40 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span className="text-xs font-bold text-on-surface">
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-bold text-on-surface cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
                >
                  {creating ? "Menyimpan..." : "Simpan & Buka Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Template */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 space-y-4">
            <h3 className="text-lg font-extrabold text-on-surface">Hapus Template Sertifikat?</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Template akan dihapus dari daftar kelola. Sertifikat yang sudah terbit tetap menyimpan salinan desainnya sehingga link verifikasi mahasiswa tidak ikut rusak.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-bold text-on-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDeleteTemplate(confirmDeleteId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
              >
                {deletingId === confirmDeleteId ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CertificatePreviewModal
        certificate={previewCert}
        isOpen={Boolean(previewCert)}
        onClose={() => setPreviewCert(null)}
      />
    </div>
  );
}
