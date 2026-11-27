"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiFilePlus,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiShield,
  FiSliders,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import type {
  CertificateCsvRow,
  CertificateRecord,
  CertificateTemplate,
} from "@/types/certificate";
import {
  deleteCertificateRecord,
  issueCertificatesBatch,
  setCertificateStatus,
  updateCertificateRecord,
  type AcceptedApplicantCandidate,
  type CertificateTemplateDetailData,
} from "../actions";
import {
  formatIndonesianLongDate,
  parseCertificateCsvImport,
  sanitizeCertificateFilename,
} from "@/lib/certificate-utils";
import { downloadCsvFile } from "@/lib/excel-export";
import { useToast } from "@/components/ui/Toast";
import CertificateDesignStudio from "@/components/certificates/CertificateDesignStudio";
import CertificatePreviewModal from "@/components/certificates/CertificatePreviewModal";

type ActiveTab = "issue" | "list" | "design";
type IssueMode = "applicants" | "manual" | "csv";

const QUICK_ROLES = [
  "Peserta",
  "Panitia",
  "Narasumber",
  "Moderator",
  "Juara 1",
  "Juara 2",
  "Juara 3",
];

export default function TemplateDetailClient({
  initialDetail,
}: {
  initialDetail: CertificateTemplateDetailData;
}) {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [template, setTemplate] = useState<CertificateTemplate>(
    initialDetail.template!
  );
  const [certificates, setCertificates] = useState<CertificateRecord[]>(
    initialDetail.certificates
  );
  const [acceptedCandidates, setAcceptedCandidates] = useState<
    AcceptedApplicantCandidate[]
  >(initialDetail.acceptedCandidates);

  useEffect(() => {
    if (initialDetail.template) setTemplate(initialDetail.template);
    setCertificates(initialDetail.certificates);
    setAcceptedCandidates(initialDetail.acceptedCandidates);
  }, [initialDetail]);

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialDetail.acceptedCandidates.some((c) => !c.already_issued)
      ? "issue"
      : initialDetail.certificates.length > 0
        ? "list"
        : "issue"
  );
  const [issueMode, setIssueMode] = useState<IssueMode>(
    initialDetail.acceptedCandidates.length > 0 ? "applicants" : "manual"
  );

  // Applicant batch issue state
  const [applicantEdits, setApplicantEdits] = useState<
    Record<
      string,
      {
        selected: boolean;
        recipient_name: string;
        role_title: string;
      }
    >
  >(() => {
    const init: Record<string, any> = {};
    for (const c of initialDetail.acceptedCandidates) {
      init[c.application_id] = {
        selected: !c.already_issued,
        recipient_name: c.recipient_name,
        role_title: c.role_title,
      };
    }
    return init;
  });

  useEffect(() => {
    setApplicantEdits((prev) => {
      const next: Record<string, any> = {};
      for (const c of acceptedCandidates) {
        const existing = prev[c.application_id];
        next[c.application_id] = {
          selected: c.already_issued ? false : existing?.selected ?? true,
          recipient_name: existing?.recipient_name ?? c.recipient_name,
          role_title: existing?.role_title ?? c.role_title,
        };
      }
      return next;
    });
  }, [acceptedCandidates]);

  // Manual issue state
  const [manualName, setManualName] = useState("");
  const [manualRole, setManualRole] = useState("Peserta");
  const [manualNumber, setManualNumber] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualCustomFileUrl, setManualCustomFileUrl] = useState("");
  const [uploadingManualFile, setUploadingManualFile] = useState(false);

  // CSV bulk import state
  const [csvRawText, setCsvRawText] = useState("");
  const [csvDefaultRole, setCsvDefaultRole] = useState("Peserta");

  // Issuing state
  const [issuing, setIssuing] = useState(false);

  // List filter & modals
  const [listSearch, setListSearch] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState<"all" | "issued" | "revoked">("all");
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [revokingCert, setRevokingCert] = useState<CertificateRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit form fields
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editIssuedDate, setEditIssuedDate] = useState("");
  const [editDescOverride, setEditDescOverride] = useState("");
  const [editCustomFileUrl, setEditCustomFileUrl] = useState("");
  const [uploadingEditFile, setUploadingEditFile] = useState(false);

  const openEditModal = (cert: CertificateRecord) => {
    setEditingCert(cert);
    setEditName(cert.recipient_name);
    setEditRole(cert.role_title);
    setEditNumber(cert.certificate_number);
    setEditIssuedDate(
      cert.issued_date_label || formatIndonesianLongDate(cert.issued_at)
    );
    setEditDescOverride(cert.description_override || "");
    setEditCustomFileUrl(cert.custom_file_url || "");
  };

  const uploadCustomCertFile = async (
    file: File,
    onUrl: (url: string) => void,
    setBusy: (val: boolean) => void
  ) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "custom");
      const res = await fetch("/api/admin/certificates/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.publicUrl) {
        throw new Error(json.error || "Gagal mengunggah berkas.");
      }
      onUrl(json.publicUrl as string);
      success("Berkas sertifikat khusus berhasil diunggah!");
    } catch (err: any) {
      showError(err?.message || "Gagal mengunggah file sertifikat.");
    } finally {
      setBusy(false);
    }
  };

  const selectedApplicantRows = useMemo(() => {
    return acceptedCandidates.filter(
      (c) => !c.already_issued && applicantEdits[c.application_id]?.selected
    );
  }, [acceptedCandidates, applicantEdits]);

  const unissuedCount = useMemo(
    () => acceptedCandidates.filter((c) => !c.already_issued).length,
    [acceptedCandidates]
  );

  const parsedCsv = useMemo<{ rows: CertificateCsvRow[]; errors: string[] }>(() => {
    if (!csvRawText.trim()) return { rows: [], errors: [] };
    return parseCertificateCsvImport(csvRawText, csvDefaultRole || "Peserta");
  }, [csvRawText, csvDefaultRole]);

  const filteredCertificates = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return certificates.filter((c) => {
      if (listStatusFilter !== "all" && c.status !== listStatusFilter) return false;
      if (!q) return true;
      return (
        c.recipient_name.toLowerCase().includes(q) ||
        c.certificate_code.toLowerCase().includes(q) ||
        c.certificate_number.toLowerCase().includes(q) ||
        c.role_title.toLowerCase().includes(q)
      );
    });
  }, [certificates, listSearch, listStatusFilter]);

  const handleIssueApplicants = async () => {
    if (selectedApplicantRows.length === 0) {
      showError("Pilih minimal 1 pendaftar yang belum diterbitkan.");
      return;
    }
    setIssuing(true);
    try {
      const recipients = selectedApplicantRows.map((c) => {
        const ed = applicantEdits[c.application_id];
        return {
          application_id: c.application_id,
          user_id: c.user_id,
          recipient_name: ed.recipient_name,
          role_title: ed.role_title,
        };
      });

      const res = await issueCertificatesBatch({
        templateId: template.id,
        recipients,
      });

      if (!res.ok) {
        showError(res.error || "Gagal menerbitkan sertifikat.");
        return;
      }

      success(`${res.insertedCount} e-sertifikat berhasil diterbitkan!`);
      router.refresh();
      setActiveTab("list");
    } finally {
      setIssuing(false);
    }
  };

  const handleIssueManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      showError("Nama penerima wajib diisi.");
      return;
    }

    setIssuing(true);
    try {
      const res = await issueCertificatesBatch({
        templateId: template.id,
        recipients: [
          {
            recipient_name: manualName.trim(),
            role_title: manualRole.trim() || "Peserta",
            certificate_number: manualNumber.trim() || null,
            description_override: manualDesc.trim() || null,
            custom_file_url: manualCustomFileUrl.trim() || null,
          },
        ],
      });

      if (!res.ok) {
        showError(res.error || "Gagal menerbitkan sertifikat manual.");
        return;
      }

      success(`E-sertifikat untuk ${manualName.trim()} berhasil diterbitkan!`);
      setManualName("");
      setManualNumber("");
      setManualDesc("");
      setManualCustomFileUrl("");
      router.refresh();
    } finally {
      setIssuing(false);
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    setCsvRawText(text);
  };

  const handleIssueCsv = async () => {
    if (parsedCsv.rows.length === 0) {
      showError("Tidak ada baris valid untuk diterbitkan.");
      return;
    }
    setIssuing(true);
    try {
      const res = await issueCertificatesBatch({
        templateId: template.id,
        recipients: parsedCsv.rows,
      });
      if (!res.ok) {
        showError(res.error || "Gagal import sertifikat CSV.");
        return;
      }
      success(`${res.insertedCount} e-sertifikat berhasil diterbitkan dari CSV!`);
      setCsvRawText("");
      router.refresh();
      setActiveTab("list");
    } finally {
      setIssuing(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    setBusyAction(true);
    try {
      const res = await updateCertificateRecord(editingCert.id, {
        recipient_name: editName,
        role_title: editRole,
        certificate_number: editNumber,
        issued_date_label: editIssuedDate || null,
        description_override: editDescOverride || null,
        custom_file_url: editCustomFileUrl || null,
      });
      if (!res.ok) {
        showError(res.error || "Gagal memperbarui data sertifikat.");
        return;
      }
      success("Data sertifikat berhasil diperbarui!");
      setEditingCert(null);
      router.refresh();
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingCert) return;
    setBusyAction(true);
    try {
      const res = await setCertificateStatus(
        revokingCert.id,
        "revoked",
        revokeReason
      );
      if (!res.ok) {
        showError(res.error || "Gagal mencabut sertifikat.");
        return;
      }
      success("Status sertifikat diubah menjadi Dicabut.");
      setRevokingCert(null);
      setRevokeReason("");
      router.refresh();
    } finally {
      setBusyAction(false);
    }
  };

  const handleRestoreStatus = async (certId: string) => {
    setBusyAction(true);
    try {
      const res = await setCertificateStatus(certId, "issued", null);
      if (!res.ok) {
        showError(res.error || "Gagal mengaktifkan kembali sertifikat.");
        return;
      }
      success("Sertifikat berhasil diaktifkan kembali sebagai Sah.");
      router.refresh();
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    setBusyAction(true);
    try {
      const res = await deleteCertificateRecord(certId);
      if (!res.ok) {
        showError(res.error || "Gagal menghapus sertifikat.");
        return;
      }
      setDeletingCertId(null);
      success("Sertifikat berhasil dihapus.");
      router.refresh();
    } finally {
      setBusyAction(false);
    }
  };

  const handleExportCertificatesCsv = () => {
    const headers = [
      "No",
      "Kode Verifikasi",
      "Nomor Sertifikat",
      "Nama Penerima",
      "Peran / Predikat",
      "Status",
      "Tanggal Terbit",
      "Link Verifikasi",
    ];
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const rows = filteredCertificates.map((c, idx) => [
      idx + 1,
      c.certificate_code,
      c.certificate_number,
      c.recipient_name,
      c.role_title,
      c.status === "revoked" ? "Dicabut" : "Sah",
      c.issued_date_label || formatIndonesianLongDate(c.issued_at),
      `${origin}/sertifikat/${c.certificate_code}`,
    ]);
    downloadCsvFile(
      `Daftar_Sertifikat_${sanitizeCertificateFilename(template.title)}`,
      headers,
      rows,
      ";"
    );
  };

  const copyVerifyLink = async (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${origin}/sertifikat/${code}`);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/sertifikat"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-2"
          >
            <FiArrowLeft size={14} /> Kembali ke Daftar E-Sertifikat
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface break-words">
            {template.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-on-surface-variant">
            <span className="font-mono font-bold text-primary">{template.number_prefix}</span>
            {template.event_date_label && <span>• {template.event_date_label}</span>}
            {template.agenda_id && (
              <Link
                href={`/admin/kegiatan/${template.agenda_id}/pendaftar`}
                className="text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                <FiUsers size={12} /> Lihat Pendaftar Agenda
              </Link>
            )}
          </div>
        </div>

        {/* Main Workspace Tabs */}
        <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 lg:inline-flex items-center gap-1.5 bg-surface border border-outline-variant/30 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("issue")}
            className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "issue"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FiPlus size={14} />
            <span>Terbitkan Penerima</span>
            {unissuedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
                {unissuedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FiShield size={14} />
            <span>Daftar Terbit ({certificates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("design")}
            className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "design"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FiSliders size={14} />
            <span>Desain &amp; TTD</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DESIGN STUDIO */}
      {activeTab === "design" && (
        <CertificateDesignStudio
          template={template}
          agendas={initialDetail.agendas}
          onSaved={(updated) => {
            setTemplate(updated);
            router.refresh();
          }}
        />
      )}

      {/* TAB 2: ISSUE RECIPIENTS */}
      {activeTab === "issue" && (
        <div className="space-y-5">
          {/* Sub-mode switcher */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            {template.agenda_id && (
              <button
                type="button"
                onClick={() => setIssueMode("applicants")}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  issueMode === "applicants"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-surface border-outline-variant/40 text-on-surface hover:border-primary"
                }`}
              >
                <FiUsers size={14} />
                <span>Dari Pendaftar Diterima ({acceptedCandidates.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIssueMode("manual")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                issueMode === "manual"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface border-outline-variant/40 text-on-surface hover:border-primary"
              }`}
            >
              <FiPlus size={14} />
              <span>Tambah Manual (Pembicara / Panitia / Juara)</span>
            </button>
            <button
              type="button"
              onClick={() => setIssueMode("csv")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                issueMode === "csv"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface border-outline-variant/40 text-on-surface hover:border-primary"
              }`}
            >
              <FiFilePlus size={14} />
              <span>Import Massal CSV / Excel</span>
            </button>
          </div>

          {/* MODE A: APPLICANTS */}
          {issueMode === "applicants" && template.agenda_id && (
            <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-on-surface">
                    Terbitkan Massal dari Pendaftar Diterima
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Nama dan peran/divisi sudah ditarik otomatis. Anda dapat menyunting ejaan sebelum menekan Terbitkan.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {unissuedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = selectedApplicantRows.length === unissuedCount;
                        setApplicantEdits((prev) => {
                          const next = { ...prev };
                          for (const c of acceptedCandidates) {
                            if (!c.already_issued && next[c.application_id]) {
                              next[c.application_id] = {
                                ...next[c.application_id],
                                selected: !allSelected,
                              };
                            }
                          }
                          return next;
                        });
                      }}
                      className="px-3 py-2 rounded-xl border border-outline-variant/50 text-xs font-bold text-on-surface hover:border-primary cursor-pointer"
                    >
                      {selectedApplicantRows.length === unissuedCount
                        ? "Batal Pilih Semua"
                        : `Pilih Semua Belum Terbit (${unissuedCount})`}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={issuing || selectedApplicantRows.length === 0}
                    onClick={handleIssueApplicants}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <FiCheckCircle size={14} />
                    <span>
                      {issuing
                        ? "Menerbitkan..."
                        : `Terbitkan Terpilih (${selectedApplicantRows.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {acceptedCandidates.length === 0 ? (
                <div className="p-10 text-center text-xs text-on-surface-variant">
                  Belum ada pendaftar berstatus <strong>Diterima</strong> pada kegiatan yang terhubung ini.
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-outline-variant/25">
                    {acceptedCandidates.map((cand) => {
                      const edit = applicantEdits[cand.application_id] || {
                        selected: false,
                        recipient_name: cand.recipient_name,
                        role_title: cand.role_title,
                      };
                      return (
                        <div
                          key={cand.application_id}
                          className={`p-4 space-y-2.5 ${cand.already_issued ? "bg-emerald-50/30 opacity-80" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={cand.already_issued}
                                checked={Boolean(edit.selected)}
                                onChange={(e) =>
                                  setApplicantEdits((prev) => ({
                                    ...prev,
                                    [cand.application_id]: {
                                      ...edit,
                                      selected: e.target.checked,
                                    },
                                  }))
                                }
                              />
                              <span>{cand.already_issued ? "Sudah Terbit" : "Pilih Penerima"}</span>
                            </label>
                            {cand.already_issued ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                                <FiCheckCircle size={12} /> {cand.existing_certificate_code}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-variant/50 text-on-surface-variant font-bold text-[11px]">
                                Siap Terbit
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              disabled={cand.already_issued}
                              value={edit.recipient_name}
                              onChange={(e) =>
                                setApplicantEdits((prev) => ({
                                  ...prev,
                                  [cand.application_id]: {
                                    ...edit,
                                    recipient_name: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Nama di Sertifikat"
                              className="w-full bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
                            />
                            <input
                              type="text"
                              disabled={cand.already_issued}
                              value={edit.role_title}
                              onChange={(e) =>
                                setApplicantEdits((prev) => ({
                                  ...prev,
                                  [cand.application_id]: {
                                    ...edit,
                                    role_title: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Peran / Predikat"
                              className="w-full bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-variant/25 text-on-surface-variant uppercase tracking-wider text-[11px]">
                        <th className="p-3.5 border-b border-outline-variant/25 w-10 text-center">Pilih</th>
                        <th className="p-3.5 border-b border-outline-variant/25">Nama di Sertifikat</th>
                        <th className="p-3.5 border-b border-outline-variant/25">Peran / Predikat</th>
                        <th className="p-3.5 border-b border-outline-variant/25 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {acceptedCandidates.map((cand) => {
                        const edit = applicantEdits[cand.application_id] || {
                          selected: false,
                          recipient_name: cand.recipient_name,
                          role_title: cand.role_title,
                        };
                        return (
                          <tr
                            key={cand.application_id}
                            className={cand.already_issued ? "bg-emerald-50/30 opacity-80" : ""}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                disabled={cand.already_issued}
                                checked={Boolean(edit.selected)}
                                onChange={(e) =>
                                  setApplicantEdits((prev) => ({
                                    ...prev,
                                    [cand.application_id]: {
                                      ...edit,
                                      selected: e.target.checked,
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                disabled={cand.already_issued}
                                value={edit.recipient_name}
                                onChange={(e) =>
                                  setApplicantEdits((prev) => ({
                                    ...prev,
                                    [cand.application_id]: {
                                      ...edit,
                                      recipient_name: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full min-w-[180px] bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                disabled={cand.already_issued}
                                value={edit.role_title}
                                onChange={(e) =>
                                  setApplicantEdits((prev) => ({
                                    ...prev,
                                    [cand.application_id]: {
                                      ...edit,
                                      role_title: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full min-w-[160px] bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
                              />
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              {cand.already_issued ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                                  <FiCheckCircle size={12} /> {cand.existing_certificate_code}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant font-bold text-[11px]">
                                  Siap Terbit
                                </span>
                              )}
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
          )}

          {/* MODE B: MANUAL ADD */}
          {issueMode === "manual" && (
            <form
              onSubmit={handleIssueManual}
              className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 max-w-3xl"
            >
              <div>
                <h2 className="text-base font-extrabold text-on-surface">
                  Tambah Penerima Sertifikat Manual
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Cocok untuk Narasumber, Panitia Inti, Dosen, Juara Lomba, atau peserta yang tidak mengisi form online.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    Nama Lengkap Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzan, S.Kom."
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    Peran / Predikat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value)}
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {QUICK_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setManualRole(r)}
                        className="px-2 py-0.5 rounded-md bg-surface-variant/40 hover:bg-primary/15 text-[10px] font-bold text-on-surface cursor-pointer"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    Nomor Sertifikat Kustom (Opsional)
                  </label>
                  <input
                    type="text"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    placeholder="Kosongkan untuk nomor otomatis"
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    Upload File Jadi PDF/PNG Khusus (Opsional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-variant/20 text-xs font-bold cursor-pointer hover:border-primary">
                      <FiUpload size={13} />
                      <span>
                        {uploadingManualFile
                          ? "Mengunggah..."
                          : manualCustomFileUrl
                            ? "Ganti File"
                            : "Upload PDF/PNG"}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) {
                            uploadCustomCertFile(
                              f,
                              setManualCustomFileUrl,
                              setUploadingManualFile
                            );
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {manualCustomFileUrl && (
                      <button
                        type="button"
                        onClick={() => setManualCustomFileUrl("")}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Hapus File
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Catatan / Keterangan Khusus Penerima (Opsional)
                </label>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Contoh: Pembicara Sesi AI & Cyber Security"
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={issuing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
                >
                  <FiCheckCircle size={15} />
                  <span>{issuing ? "Menerbitkan..." : "Terbitkan E-Sertifikat"}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE C: CSV IMPORT */}
          {issueMode === "csv" && (
            <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-on-surface">
                    Import Massal dari CSV / Copy-Paste Excel
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Format kolom yang dikenali otomatis: <code>nama; peran; nomor; keterangan</code> (dipisah koma <code>,</code>, titik koma <code>;</code>, atau Tab dari Excel). Kolom <code>nomor</code> &amp; <code>keterangan</code> bersifat opsional.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface-variant/20 text-xs font-bold cursor-pointer hover:border-primary shrink-0">
                  <FiUpload size={14} />
                  <span>Pilih File .CSV</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <textarea
                    rows={5}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder={`nama;peran;nomor;keterangan\nLailatul Qodria;Panitia Div. PDD\nNazwa Azahra;Panitia Div. Logistik`}
                    className="w-full bg-background border border-outline-variant/50 rounded-xl p-3 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-3 bg-surface-variant/15 rounded-xl p-3.5 border border-outline-variant/25">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">
                      Peran Default (Jika Kolom Kosong)
                    </label>
                    <input
                      type="text"
                      value={csvDefaultRole}
                      onChange={(e) => setCsvDefaultRole(e.target.value)}
                      className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="text-xs text-on-surface-variant space-y-1">
                    <p>
                      Baris terbaca: <strong className="text-on-surface">{parsedCsv.rows.length}</strong>
                    </p>
                    {parsedCsv.errors.length > 0 && (
                      <p className="text-amber-700 font-semibold">
                        {parsedCsv.errors.length} catatan peringatan
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={issuing || parsedCsv.rows.length === 0}
                    onClick={handleIssueCsv}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {issuing
                      ? "Memproses..."
                      : `Terbitkan ${parsedCsv.rows.length} Sertifikat`}
                  </button>
                </div>
              </div>

              {parsedCsv.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-0.5">
                  {parsedCsv.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {parsedCsv.rows.length > 0 && (
                <div className="overflow-x-auto border border-outline-variant/25 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-variant/25 text-on-surface-variant text-[11px] uppercase">
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Nama</th>
                        <th className="p-2.5">Peran</th>
                        <th className="p-2.5">Nomor Kustom</th>
                        <th className="p-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {parsedCsv.rows.slice(0, 25).map((r, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold">{i + 1}</td>
                          <td className="p-2.5 font-semibold">{r.recipient_name}</td>
                          <td className="p-2.5 font-bold text-primary">{r.role_title}</td>
                          <td className="p-2.5 text-on-surface-variant font-mono">
                            {r.certificate_number || "Otomatis"}
                          </td>
                          <td className="p-2.5 text-on-surface-variant">
                            {r.description_override || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ISSUED LIST */}
      {activeTab === "list" && (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant/25 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["all", "Semua", certificates.length],
                  ["issued", "Sah", certificates.filter((c) => c.status === "issued").length],
                  ["revoked", "Dicabut", certificates.filter((c) => c.status === "revoked").length],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setListStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    listStatusFilter === key
                      ? "bg-primary text-white"
                      : "bg-surface-variant/30 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <FiSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Cari nama, kode, nomor..."
                  className="w-full bg-background border border-outline-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                disabled={filteredCertificates.length === 0}
                onClick={handleExportCertificatesCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-outline-variant/50 text-xs font-bold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer"
              >
                <FiDownload size={13} /> Export CSV
              </button>
            </div>
          </div>

          {filteredCertificates.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant">
              Belum ada e-sertifikat yang cocok dengan filter ini.
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-outline-variant/25 text-xs">
                {filteredCertificates.map((cert) => {
                  const isRevoked = cert.status === "revoked";
                  return (
                    <div key={cert.id} className={`p-4 space-y-2.5 ${isRevoked ? "bg-rose-50/40" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-primary break-all">
                              {cert.certificate_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyVerifyLink(cert.certificate_code)}
                              className="p-1 rounded hover:bg-primary/10 text-on-surface-variant hover:text-primary cursor-pointer shrink-0"
                            >
                              {copiedId === cert.certificate_code ? (
                                <FiCheckCircle size={12} className="text-emerald-600" />
                              ) : (
                                <FiCopy size={12} />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] font-mono text-on-surface-variant break-all">
                            {cert.certificate_number}
                          </p>
                        </div>
                        {isRevoked ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            <FiXCircle size={12} /> Dicabut
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            <FiCheckCircle size={12} /> Sah
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-sm text-on-surface">{cert.recipient_name}</p>
                        <div className="text-[11px] text-on-surface-variant flex flex-wrap gap-x-2">
                          <span className="font-bold text-primary">{cert.role_title}</span>
                          {cert.certificate_number && <span>• {cert.certificate_number}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold cursor-pointer"
                        >
                          <FiEye size={13} /> Unduh / Lihat
                        </button>
                        <Link
                          href={`/sertifikat/${encodeURIComponent(cert.certificate_code)}`}
                          target="_blank"
                          className="p-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary"
                        >
                          <FiExternalLink size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(cert)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 cursor-pointer"
                        >
                          <FiEdit2 size={13} />
                        </button>
                        {isRevoked ? (
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() => handleRestoreStatus(cert.id)}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 cursor-pointer"
                          >
                            <FiRotateCcw size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingCert(cert);
                              setRevokeReason("");
                            }}
                            className="p-2 rounded-lg bg-amber-50 text-amber-600 cursor-pointer"
                          >
                            <FiAlertTriangle size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingCertId(cert.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-variant/25 text-on-surface-variant uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 border-b border-outline-variant/25">Kode &amp; Nomor</th>
                    <th className="p-3.5 border-b border-outline-variant/25">Penerima</th>
                    <th className="p-3.5 border-b border-outline-variant/25">Peran</th>
                    <th className="p-3.5 border-b border-outline-variant/25 text-center">Status</th>
                    <th className="p-3.5 border-b border-outline-variant/25 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredCertificates.map((cert) => {
                    const isRevoked = cert.status === "revoked";
                    return (
                      <tr key={cert.id} className={isRevoked ? "bg-rose-50/40" : "hover:bg-surface-variant/10"}>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-primary">
                              {cert.certificate_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyVerifyLink(cert.certificate_code)}
                              className="p-1 rounded hover:bg-primary/10 text-on-surface-variant hover:text-primary cursor-pointer"
                              title="Salin Link Verifikasi"
                            >
                              {copiedId === cert.certificate_code ? (
                                <FiCheckCircle size={12} className="text-emerald-600" />
                              ) : (
                                <FiCopy size={12} />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                            {cert.certificate_number}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-on-surface text-sm">{cert.recipient_name}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                            {cert.role_title}
                          </span>
                          {cert.custom_file_url && (
                            <span className="block text-[10px] text-amber-700 font-bold mt-1">
                              + File Upload Khusus
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
                              <FiXCircle size={12} /> Dicabut
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                              <FiCheckCircle size={12} /> Sah
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewCert(cert)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold cursor-pointer"
                            >
                              <FiEye size={13} /> Unduh / Lihat
                            </button>
                            <Link
                              href={`/sertifikat/${encodeURIComponent(cert.certificate_code)}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary"
                              title="Buka Halaman Verifikasi Publik"
                            >
                              <FiExternalLink size={13} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEditModal(cert)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer"
                              title="Edit Data Penerima"
                            >
                              <FiEdit2 size={13} />
                            </button>
                            {isRevoked ? (
                              <button
                                type="button"
                                disabled={busyAction}
                                onClick={() => handleRestoreStatus(cert.id)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer"
                                title="Aktifkan Kembali"
                              >
                                <FiRotateCcw size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevokingCert(cert);
                                  setRevokeReason("");
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white cursor-pointer"
                                title="Cabut Sertifikat"
                              >
                                <FiAlertTriangle size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeletingCertId(cert.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                              title="Hapus"
                            >
                              <FiTrash2 size={13} />
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
      )}

      {/* Modal Preview & Download */}
      <CertificatePreviewModal
        certificate={previewCert}
        liveTemplate={template}
        isOpen={Boolean(previewCert)}
        onClose={() => setPreviewCert(null)}
      />

      {/* Modal Edit Penerima */}
      {editingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-lg max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-outline-variant/25 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-extrabold text-on-surface truncate pr-2">
                Edit Data Sertifikat ({editingCert.certificate_code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingCert(null)}
                className="p-1.5 rounded-full hover:bg-surface-variant/40 cursor-pointer shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Peran / Predikat *</label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Nomor Sertifikat *</label>
                  <input
                    type="text"
                    required
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Tanggal Terbit</label>
                <input
                  type="text"
                  value={editIssuedDate}
                  onChange={(e) => setEditIssuedDate(e.target.value)}
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Catatan Khusus (Override)</label>
                <input
                  type="text"
                  value={editDescOverride}
                  onChange={(e) => setEditDescOverride(e.target.value)}
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-on-surface block">
                  File Khusus PDF/PNG (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/50 font-bold cursor-pointer hover:border-primary">
                    <FiUpload size={13} />
                    <span>
                      {uploadingEditFile
                        ? "Mengunggah..."
                        : editCustomFileUrl
                          ? "Ganti File"
                          : "Upload File PDF/PNG"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) {
                          uploadCustomCertFile(
                            f,
                            setEditCustomFileUrl,
                            setUploadingEditFile
                          );
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {editCustomFileUrl && (
                    <button
                      type="button"
                      onClick={() => setEditCustomFileUrl("")}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Hapus File
                    </button>
                  )}
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/50 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busyAction}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
                >
                  {busyAction ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cabut Sertifikat */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmRevoke}
            className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 space-y-4"
          >
            <h3 className="text-base font-extrabold text-on-surface">
              Cabut Keabsahan Sertifikat?
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Sertifikat atas nama <strong>{revokingCert.recipient_name}</strong> ({revokingCert.certificate_code}) akan berstatus <strong>Dicabut</strong> saat dicek melalui QR verifikasi publik.
            </p>
            <textarea
              rows={2}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Alasan pencabutan (opsional)..."
              className="w-full bg-background border border-outline-variant/50 rounded-xl p-3 text-xs outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busyAction}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
              >
                {busyAction ? "Memproses..." : "Ya, Cabut Sertifikat"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Hapus Permanen */}
      {deletingCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 space-y-4">
            <h3 className="text-base font-extrabold text-on-surface">Hapus Sertifikat?</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Data sertifikat ini akan dihapus permanen. Gunakan fitur <strong>Cabut</strong> jika Anda hanya ingin menonaktifkan validitas sertifikat tanpa menghapus arsipnya.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCertId(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() => handleDeleteCert(deletingCertId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
              >
                {busyAction ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
