"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiExternalLink,
  FiImage,
  FiPrinter,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiXCircle,
  FiZoomIn,
} from "react-icons/fi";
import {
  AgendaItem,
  AgendaKegiatan,
  ApplicationStatus,
  DynamicFormField,
  VolunteerApplication,
} from "@/types/agenda";
import {
  deleteVolunteerApplication,
  updateVolunteerApplicationStatus,
} from "../../actions";
import ExportPendaftarButton from "./ExportPendaftarButton";
import { useToast } from "@/components/ui/Toast";
import {
  getRegistrationImagePreviewUrl,
  getSafeHttpsUrl,
} from "@/lib/registration-utils";
import { hasAnyImageField } from "@/lib/registration-validation";

interface DisplayFormField extends DynamicFormField {
  itemId?: string;
  itemTag?: string;
}

function buildDisplayFields(
  commonFields: DynamicFormField[],
  items: AgendaItem[],
  filterItemId: string
): DisplayFormField[] {
  const result: DisplayFormField[] = [...commonFields];
  const seenIds = new Set(commonFields.map((f) => f.id));

  const targetItems =
    filterItemId === "all"
      ? items
      : items.filter((it) => it.id === filterItemId);

  for (const item of targetItems) {
    for (const extra of item.extra_fields || []) {
      if (!seenIds.has(extra.id)) {
        seenIds.add(extra.id);
        result.push({
          ...extra,
          itemId: item.id,
          itemTag: filterItemId === "all" ? item.name : undefined,
        });
      }
    }
  }

  return result;
}

const formatDateWithTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

function ThumbnailCell({
  url,
  label,
  onZoom,
}: {
  url: unknown;
  label: string;
  onZoom: (src: string, href: string, title: string) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const safeLink = getSafeHttpsUrl(url);
  const previewUrl = getRegistrationImagePreviewUrl(url);

  if (!safeLink) {
    return url ? (
      <span className="text-red-500/80 text-xs italic" title="Nilai bukan tautan https yang valid">
        Tautan tidak valid
      </span>
    ) : (
      <span className="text-on-surface-variant/50 italic text-xs">Kosong</span>
    );
  }

  if (previewUrl && !imgErr) {
    return (
      <button
        type="button"
        onClick={() => onZoom(previewUrl, safeLink.href, label)}
        className="group relative w-14 h-14 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-variant/30 shadow-2xs hover:ring-2 hover:ring-primary transition-all cursor-zoom-in block"
        title="Klik untuk perbesar foto"
      >
        <img
          src={previewUrl}
          alt={label}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <FiZoomIn size={16} />
        </span>
      </button>
    );
  }

  return (
    <a
      href={safeLink.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
      title={safeLink.href}
    >
      <span className="truncate max-w-[130px]">{safeLink.hostname}</span>
      <FiExternalLink size={12} className="shrink-0" />
    </a>
  );
}

function PrintPhotoCell({ url, label }: { url: unknown; label: string }) {
  const safeLink = getSafeHttpsUrl(url);
  const previewUrl = getRegistrationImagePreviewUrl(url);

  if (!safeLink) {
    return <span className="text-slate-400 italic text-[10px]">-</span>;
  }

  if (previewUrl) {
    return (
      <div className="flex flex-col items-start gap-1">
        <img
          src={previewUrl}
          alt={label}
          className="w-20 h-20 object-cover rounded border border-slate-300 bg-slate-50"
        />
      </div>
    );
  }

  return (
    <span className="text-[10px] text-blue-700 break-all">{safeLink.href}</span>
  );
}

function PrintableReportDocument({
  agendaTitle,
  itemLabel,
  hasItems,
  itemStats,
  fields,
  applications,
  onlyAccepted,
  includePhotos,
}: {
  agendaTitle: string;
  itemLabel: string;
  hasItems: boolean;
  itemStats: Array<AgendaItem & { filled_count: number; remaining: number | null }>;
  fields: DisplayFormField[];
  applications: VolunteerApplication[];
  onlyAccepted: boolean;
  includePhotos: boolean;
}) {
  return (
    <div className="bg-white text-slate-900 space-y-5">
      <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-800">
            BEM STMIK TAZKIA — LAPORAN DATA PENDAFTAR
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{agendaTitle}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Total data: <strong>{applications.length}</strong> pendaftar
            {onlyAccepted ? " (Status: Diterima)" : ""}
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          Dicetak:{" "}
          {new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {itemStats.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Ringkasan Kuota per {itemLabel}
          </h4>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left">{itemLabel}</th>
                <th className="border border-slate-300 p-2 text-center">Dibutuhkan</th>
                <th className="border border-slate-300 p-2 text-center">Terisi</th>
                <th className="border border-slate-300 p-2 text-center">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {itemStats.map((it) => (
                <tr key={it.id} className="break-inside-avoid">
                  <td className="border border-slate-300 p-2 font-semibold">{it.name}</td>
                  <td className="border border-slate-300 p-2 text-center">
                    {it.quota ?? "Tanpa batas"}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-bold">
                    {it.filled_count}
                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    {it.remaining ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-left">No</th>
              {hasItems && <th className="border border-slate-300 p-2 text-left">{itemLabel}</th>}
              <th className="border border-slate-300 p-2 text-left">Status</th>
              {fields.map((f) => (
                <th key={f.id} className="border border-slate-300 p-2 text-left">
                  <div>{f.label}</div>
                  {f.itemTag && (
                    <div className="text-[9px] font-semibold text-blue-700 mt-0.5">
                      [{f.itemTag}]
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr key={app.id} className="break-inside-avoid">
                <td className="border border-slate-300 p-2 align-top font-bold">{idx + 1}</td>
                {hasItems && (
                  <td className="border border-slate-300 p-2 align-top font-semibold">
                    {app.item_name || "-"}
                  </td>
                )}
                <td className="border border-slate-300 p-2 align-top">
                  {app.status === "rejected" ? "Ditolak" : "Diterima"}
                </td>
                {fields.map((field) => {
                  const answer = app.responses?.[field.id];
                  const notApplicable =
                    !answer && Boolean(field.itemId) && app.item_id !== field.itemId;
                  const isImg =
                    includePhotos &&
                    !notApplicable &&
                    (field.type === "image" || Boolean(getRegistrationImagePreviewUrl(answer)));
                  return (
                    <td key={field.id} className="border border-slate-300 p-2 align-top">
                      {notApplicable ? (
                        <span className="text-slate-300">—</span>
                      ) : isImg ? (
                        <PrintPhotoCell url={answer} label={field.label} />
                      ) : (
                        <span className="break-words">{answer || "-"}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + (hasItems ? 3 : 2)}
                  className="border border-slate-300 p-6 text-center text-slate-500"
                >
                  Tidak ada data pendaftar pada filter laporan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PendaftarClient({
  agenda,
  initialApplications,
}: {
  agenda: AgendaKegiatan;
  initialApplications: VolunteerApplication[];
}) {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [applications, setApplications] =
    useState<VolunteerApplication[]>(initialApplications);
  const [selectedItemId, setSelectedItemId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "rejected">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteApp, setConfirmDeleteApp] =
    useState<VolunteerApplication | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<{
    src: string;
    href: string;
    title: string;
  } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOnlyAccepted, setReportOnlyAccepted] = useState(true);
  const [reportItemId, setReportItemId] = useState<string>("all");
  const [reportIncludePhotos, setReportIncludePhotos] = useState(true);

  const fields: DynamicFormField[] = useMemo(
    () => agenda.form_schema || [],
    [agenda.form_schema]
  );
  const items: AgendaItem[] = useMemo(
    () => agenda.items || [],
    [agenda.items]
  );
  const hasItems = items.length > 0 || applications.some((a) => Boolean(a.item_name));
  const itemLabel = agenda.type === "volunteer" ? "Posisi" : "Cabang Lomba";
  const hasImageFields = hasAnyImageField(fields, items);

  const displayFields = useMemo(
    () => buildDisplayFields(fields, items, selectedItemId),
    [fields, items, selectedItemId]
  );

  const reportFields = useMemo(
    () => buildDisplayFields(fields, items, reportItemId),
    [fields, items, reportItemId]
  );

  // Compute live item statistics directly from applications state
  const itemStats = useMemo(() => {
    return items.map((item) => {
      const matching = applications.filter((a) => a.item_id === item.id);
      const filled = matching.filter((a) => a.status !== "rejected").length;
      const rejected = matching.filter((a) => a.status === "rejected").length;
      const remaining =
        typeof item.quota === "number" ? Math.max(0, item.quota - filled) : null;
      const isFull = typeof item.quota === "number" && filled >= item.quota;
      return {
        ...item,
        filled_count: filled,
        rejected_count: rejected,
        remaining,
        isFull,
      };
    });
  }, [items, applications]);

  const totalAccepted = useMemo(
    () => applications.filter((a) => a.status !== "rejected").length,
    [applications]
  );
  const totalRejected = useMemo(
    () => applications.filter((a) => a.status === "rejected").length,
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (selectedItemId !== "all") {
        if (selectedItemId === "none") {
          if (app.item_id) return false;
        } else if (app.item_id !== selectedItemId) {
          return false;
        }
      }

      const appStatus = app.status === "rejected" ? "rejected" : "accepted";
      if (statusFilter !== "all" && appStatus !== statusFilter) {
        return false;
      }

      if (q) {
        const matchItem = (app.item_name || "").toLowerCase().includes(q);
        const matchResponses = Object.values(app.responses || {}).some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(q)
        );
        if (!matchItem && !matchResponses) return false;
      }

      return true;
    });
  }, [applications, selectedItemId, statusFilter, searchQuery]);

  const reportApplications = useMemo(() => {
    return applications.filter((app) => {
      const appStatus = app.status === "rejected" ? "rejected" : "accepted";
      if (reportOnlyAccepted && appStatus !== "accepted") return false;
      if (reportItemId !== "all" && app.item_id !== reportItemId) return false;
      return true;
    });
  }, [applications, reportOnlyAccepted, reportItemId]);

  const handleStatusChange = async (
    app: VolunteerApplication,
    nextStatus: ApplicationStatus
  ) => {
    setBusyId(app.id);
    try {
      await updateVolunteerApplicationStatus(app.id, agenda.id, nextStatus);
      setApplications((prev) =>
        prev.map((row) => (row.id === app.id ? { ...row, status: nextStatus } : row))
      );
      success(
        nextStatus === "rejected"
          ? "Pendaftar ditolak. Slot kuota otomatis terbuka kembali."
          : "Pendaftar diaktifkan kembali dan mengisi slot kuota."
      );
      router.refresh();
    } catch (err: any) {
      showError(err?.message || "Gagal memperbarui status pendaftar.");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteApp) return;
    const target = confirmDeleteApp;
    setBusyId(target.id);
    try {
      await deleteVolunteerApplication(target.id, agenda.id);
      setApplications((prev) => prev.filter((row) => row.id !== target.id));
      setConfirmDeleteApp(null);
      success("Data pendaftar dihapus. Slot kuota otomatis diperbarui.");
      router.refresh();
    } catch (err: any) {
      showError(err?.message || "Gagal menghapus data pendaftar.");
    } finally {
      setBusyId(null);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <>
      {/* ============================================================ */}
      {/* INTERACTIVE SCREEN UI (Hidden during print)                  */}
      {/* ============================================================ */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/kegiatan"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-variant/30 transition-colors shrink-0"
            >
              <FiArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
                Data Pendaftar
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {agenda.type === "volunteer" ? "Open Recruitment" : "Event"}:{" "}
                <strong className="text-on-surface">{agenda.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <FiPrinter size={16} /> Laporan PDF{hasImageFields ? " Berfoto" : ""}
            </button>
            <ExportPendaftarButton
              applications={filteredApplications}
              fields={displayFields}
              agendaTitle={agenda.title}
              hasItems={hasItems}
              itemLabel={itemLabel}
            />
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Terisi / Diterima
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {totalAccepted}
              {items.length === 0 && agenda.max_participants
                ? ` / ${agenda.max_participants}`
                : " orang"}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Mengisi slot kuota saat ini
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Ditolak Admin
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{totalRejected} orang</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Tidak menghitung ke kuota terisi
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Data Masuk
            </p>
            <p className="text-2xl font-black text-primary mt-1">
              {applications.length} baris
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {items.length > 0
                ? `${items.length} ${itemLabel.toLowerCase()} terdaftar`
                : "Pendaftaran tunggal"}
            </p>
          </div>
        </div>

        {/* Per-Position / Per-Competition Quota Cards */}
        {itemStats.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <FiUsers className="text-primary" /> Rekap Kuota per {itemLabel}
              </h2>
              {selectedItemId !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedItemId("all")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Tampilkan Semua {itemLabel}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {itemStats.map((it) => {
                const isSelected = selectedItemId === it.id;
                const pct =
                  typeof it.quota === "number" && it.quota > 0
                    ? Math.min(100, Math.round((it.filled_count / it.quota) * 100))
                    : 0;
                return (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() =>
                      setSelectedItemId(isSelected ? "all" : it.id)
                    }
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                        : "bg-surface border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-bold text-sm text-on-surface line-clamp-1">
                        {it.name}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          it.isFull
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {it.isFull ? "Penuh" : "Terbuka"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                      <span>
                        Terisi:{" "}
                        <strong className="text-on-surface">{it.filled_count}</strong>
                        {typeof it.quota === "number" ? ` / ${it.quota}` : " (Tanpa batas)"}
                      </span>
                      {typeof it.remaining === "number" && (
                        <span className="font-semibold text-primary">
                          Sisa {it.remaining}
                        </span>
                      )}
                    </div>

                    {typeof it.quota === "number" && (
                      <div className="w-full h-2 rounded-full bg-surface-variant/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            it.isFull
                              ? "bg-rose-500"
                              : pct >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}

                    {it.rejected_count > 0 && (
                      <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                        {it.rejected_count} ditolak
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Table Container + Filters */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-variant/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial min-w-[220px]">
                <FiSearch
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIM, atau jawaban..."
                  className="w-full bg-background border border-outline-variant/50 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-primary outline-none"
                />
              </div>

              {items.length > 0 && (
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="bg-background border border-outline-variant/50 rounded-xl px-3 py-2 text-xs font-semibold focus:border-primary outline-none"
                >
                  <option value="all">Semua {itemLabel}</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-background border border-outline-variant/50 rounded-xl p-0.5 text-xs font-bold">
                {(
                  [
                    ["all", "Semua"],
                    ["accepted", "Diterima"],
                    ["rejected", "Ditolak"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      statusFilter === key
                        ? "bg-primary text-white"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-on-surface-variant font-medium">
              Menampilkan <strong className="text-on-surface">{filteredApplications.length}</strong>{" "}
              dari {applications.length} pendaftar
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant text-sm">
              {applications.length === 0
                ? "Belum ada pendaftar untuk kegiatan ini."
                : "Tidak ada data pendaftar yang cocok dengan filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">No</th>
                    <th className="p-4 font-bold">Waktu Submit</th>
                    {hasItems && <th className="p-4 font-bold">{itemLabel}</th>}
                    <th className="p-4 font-bold">Status</th>
                    {displayFields.map((field) => (
                      <th key={field.id} className="p-4 font-bold">
                        <div>{field.label}</div>
                        {field.itemTag && (
                          <div className="text-[10px] font-semibold text-primary normal-case mt-0.5">
                            [{field.itemTag}]
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="p-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredApplications.map((app, rowIdx) => {
                    const isRejected = app.status === "rejected";
                    const isBusy = busyId === app.id;
                    const firstLabel =
                      String(
                        Object.values(app.responses || {}).find(
                          (v) =>
                            typeof v === "string" &&
                            v.trim().length > 0 &&
                            !v.startsWith("http")
                        ) || `Pendaftar #${rowIdx + 1}`
                      );

                    return (
                      <tr
                        key={app.id}
                        className={`transition-colors ${
                          isRejected
                            ? "bg-rose-50/40 hover:bg-rose-50/70 opacity-80"
                            : "hover:bg-surface-variant/5"
                        }`}
                      >
                        <td className="p-4 text-xs font-bold text-on-surface-variant">
                          {rowIdx + 1}
                        </td>
                        <td className="p-4 text-xs whitespace-nowrap text-on-surface-variant font-medium">
                          {formatDateWithTime(app.created_at)}
                        </td>
                        {hasItems && (
                          <td className="p-4 text-xs whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                              {app.item_name || "-"}
                            </span>
                          </td>
                        )}
                        <td className="p-4 text-xs whitespace-nowrap">
                          {isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
                              <FiXCircle size={12} /> Ditolak
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                              <FiCheckCircle size={12} /> Diterima
                            </span>
                          )}
                        </td>

                        {displayFields.map((field) => {
                          const answer = app.responses?.[field.id];
                          const notApplicable =
                            !answer && Boolean(field.itemId) && app.item_id !== field.itemId;
                          const safeLink = getSafeHttpsUrl(answer);
                          const isImageField =
                            !notApplicable &&
                            (field.type === "image" ||
                              Boolean(getRegistrationImagePreviewUrl(answer)));

                          return (
                            <td
                              key={field.id}
                              className="p-4 text-sm text-on-surface max-w-[260px]"
                            >
                              {notApplicable ? (
                                <span
                                  className="text-on-surface-variant/35 text-xs"
                                  title={
                                    field.itemTag
                                      ? `Pertanyaan khusus untuk ${field.itemTag}`
                                      : "Tidak berlaku untuk pilihan ini"
                                  }
                                >
                                  —
                                </span>
                              ) : isImageField ? (
                                <ThumbnailCell
                                  url={answer}
                                  label={`${field.label} - ${firstLabel}`}
                                  onZoom={(src, href, title) =>
                                    setZoomPhoto({ src, href, title })
                                  }
                                />
                              ) : field.type === "file" ? (
                                safeLink ? (
                                  <a
                                    href={safeLink.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                                    title={safeLink.href}
                                  >
                                    <span className="truncate max-w-[130px]">
                                      {safeLink.hostname}
                                    </span>
                                    <FiExternalLink size={12} className="shrink-0" />
                                  </a>
                                ) : answer ? (
                                  <span
                                    className="text-red-500/80 text-xs italic"
                                    title="Nilai bukan tautan https yang valid"
                                  >
                                    Tautan tidak valid
                                  </span>
                                ) : (
                                  <span className="text-on-surface-variant/50 italic text-xs">
                                    Kosong
                                  </span>
                                )
                              ) : (
                                <div className="truncate" title={answer}>
                                  {answer || (
                                    <span className="text-on-surface-variant/50 italic text-xs">
                                      Kosong
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isRejected ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(app, "accepted")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
                                title="Terima kembali & isi slot"
                              >
                                <FiRotateCcw size={13} /> Terima
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(app, "rejected")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
                                title="Tolak pendaftar & buka kembali 1 slot"
                              >
                                <FiXCircle size={13} /> Tolak
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteApp(app)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                              title="Hapus permanen"
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
          )}
        </div>

        {/* Lightbox Zoom Foto */}
        {zoomPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoomPhoto(null)}
          >
            <div
              className="bg-surface rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-outline-variant/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FiImage className="text-primary shrink-0" />
                  <h3 className="font-bold text-sm text-on-surface truncate">
                    {zoomPhoto.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomPhoto.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    Buka Asli <FiExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setZoomPhoto(null)}
                    className="p-1.5 rounded-full hover:bg-surface-variant/50"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-black/5 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={zoomPhoto.src}
                  alt={zoomPhoto.title}
                  className="max-w-full max-h-[68vh] object-contain rounded-xl shadow"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDeleteApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <FiTrash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">
                  Hapus Data Pendaftar?
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Data pendaftar{confirmDeleteApp.item_name ? ` (${confirmDeleteApp.item_name})` : ""}{" "}
                  akan dihapus permanen dan slot kuota akan langsung terbuka kembali jika sebelumnya berstatus diterima.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteApp(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-outline-variant hover:bg-surface-variant/30"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={busyId === confirmDeleteApp.id}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {busyId === confirmDeleteApp.id ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview & Settings Modal untuk Laporan PDF Berfoto */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between gap-4 bg-surface-variant/10">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <FiPrinter className="text-emerald-600" /> Pratinjau Laporan PDF
                    {hasImageFields ? " Berfoto" : ""}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Atur filter laporan di bawah lalu klik <strong>Cetak / Simpan PDF</strong> (pilih Save as PDF di dialog print).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-2 rounded-full hover:bg-surface-variant/40"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Controls */}
              <div className="px-5 py-3 border-b border-outline-variant/20 bg-background flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportOnlyAccepted}
                    onChange={(e) => setReportOnlyAccepted(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  Hanya tampilkan pendaftar berstatus Diterima
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportIncludePhotos}
                    onChange={(e) => setReportIncludePhotos(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  Tampilkan Foto Langsung di Laporan
                </label>

                {items.length > 0 && (
                  <select
                    value={reportItemId}
                    onChange={(e) => setReportItemId(e.target.value)}
                    className="bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 font-semibold"
                  >
                    <option value="all">Semua {itemLabel}</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Preview Body */}
              <div className="p-6 overflow-auto flex-1 bg-slate-100">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 max-w-4xl mx-auto">
                  <PrintableReportDocument
                    agendaTitle={agenda.title}
                    itemLabel={itemLabel}
                    hasItems={hasItems}
                    itemStats={
                      reportItemId === "all"
                        ? itemStats
                        : itemStats.filter((it) => it.id === reportItemId)
                    }
                    fields={reportFields}
                    applications={reportApplications}
                    onlyAccepted={reportOnlyAccepted}
                    includePhotos={reportIncludePhotos}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-outline-variant/30 bg-surface flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-variant/20"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  disabled={reportApplications.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <FiPrinter size={16} /> Cetak / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DEDICATED PRINT LAYOUT (Visible ONLY when printing to PDF)    */}
      {/* ============================================================ */}
      <div className="hidden print:block bg-white text-black p-4">
        <PrintableReportDocument
          agendaTitle={agenda.title}
          itemLabel={itemLabel}
          hasItems={hasItems}
          itemStats={
            reportItemId === "all"
              ? itemStats
              : itemStats.filter((it) => it.id === reportItemId)
          }
          fields={reportFields}
          applications={reportApplications}
          onlyAccepted={reportOnlyAccepted}
          includePhotos={reportIncludePhotos}
        />
      </div>
    </>
  );
}
