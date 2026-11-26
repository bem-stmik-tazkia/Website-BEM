"use client";

import React, { useMemo, useState } from "react";
import { FiDownload, FiX, FiFileText, FiFile } from "react-icons/fi";
import { DynamicFormField, VolunteerApplication } from "@/types/agenda";
import { downloadCsvFile, downloadXlsxWorkbook } from "@/lib/excel-export";

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

interface ExportField extends DynamicFormField {
  itemTag?: string;
  itemId?: string;
}

interface ExportItemStat {
  name: string;
  quota?: number | null;
  filled_count: number;
  remaining: number | null;
  rejected_count?: number;
}

interface ExportPendaftarButtonProps {
  applications: VolunteerApplication[];
  fields: ExportField[];
  agendaTitle: string;
  hasItems?: boolean;
  itemLabel?: string;
  itemStats?: ExportItemStat[];
}

function getStatusLabel(status?: string | null): string {
  if (status === "rejected") return "Ditolak";
  if (status === "pending") return "Menunggu";
  return "Diterima";
}

export default function ExportPendaftarButton({
  applications,
  fields,
  agendaTitle,
  hasItems = false,
  itemLabel = "Posisi / Cabang",
  itemStats = [],
}: ExportPendaftarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasAccountEmails = useMemo(
    () => applications.some((app) => Boolean(app.applicant_email)),
    [applications]
  );

  const { headers, rows } = useMemo(() => {
    const cols = [
      "No",
      "Waktu Submit",
      ...(hasAccountEmails ? ["Email Akun"] : []),
      ...(hasItems ? [itemLabel] : []),
      "Status",
      ...fields.map((f) => (f.itemTag ? `${f.label} [${f.itemTag}]` : f.label)),
    ];

    const mappedRows = applications.map((app, idx) => {
      const baseCells: Array<string | number> = [
        idx + 1,
        formatDateWithTime(app.created_at),
        ...(hasAccountEmails ? [app.applicant_email || "-"] : []),
        ...(hasItems ? [app.item_name || "-"] : []),
        getStatusLabel(app.status),
      ];

      fields.forEach((field) => {
        const answer = app.responses?.[field.id];
        const notApplicable =
          !answer && Boolean(field.itemId) && app.item_id !== field.itemId;
        baseCells.push(notApplicable ? "—" : String(answer || "-"));
      });

      return baseCells;
    });

    return { headers: cols, rows: mappedRows };
  }, [applications, fields, hasItems, itemLabel, hasAccountEmails]);

  const baseFilename = `Data_Pendaftar_${agendaTitle.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Kegiatan"}`;

  const handleDownloadXlsx = () => {
    const sheets = [
      {
        name: "Data Pendaftar",
        headers,
        rows,
      },
      ...(itemStats.length > 0
        ? [
            {
              name: "Ringkasan Kuota",
              headers: [itemLabel, "Kuota Dibutuhkan", "Terisi Aktif", "Sisa Kuota", "Ditolak"],
              rows: itemStats.map((it) => [
                it.name,
                typeof it.quota === "number" ? it.quota : "Tanpa batas",
                it.filled_count,
                typeof it.remaining === "number" ? it.remaining : "-",
                it.rejected_count ?? 0,
              ]),
            },
          ]
        : []),
    ];

    downloadXlsxWorkbook(baseFilename, sheets);
    setIsOpen(false);
  };

  const handleDownloadCsv = () => {
    downloadCsvFile(baseFilename, headers, rows, ";");
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
      >
        <FiDownload size={16} /> Export Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-5xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-variant/10">
              <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                <FiFileText className="text-primary" /> Pratinjau Export Excel / CSV
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-auto flex-1 bg-surface-variant/5">
              <p className="text-xs sm:text-sm text-on-surface-variant mb-4 font-medium bg-blue-50 text-blue-800 p-3.5 rounded-xl border border-blue-200 leading-relaxed">
                <strong className="text-blue-900">Info Format:</strong> File{" "}
                <strong className="text-blue-900">Excel (.xlsx)</strong> sudah dilengkapi kolom rapi otomatis, header tebal, pemisah kolom yang benar, dan proteksi teks agar NIM/No. HP tidak berubah menjadi angka ilmiah (<code className="text-[11px]">2.6E+11</code>). Menampilkan pratinjau 5 dari{" "}
                <strong className="text-blue-900">{applications.length} data</strong> sesuai filter aktif.
              </p>

              <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-surface-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                      {headers.map((col, i) => (
                        <th
                          key={`${col}-${i}`}
                          className="p-3 font-bold border-b border-outline-variant/30 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {rows.slice(0, 5).map((row, rIdx) => (
                      <tr key={applications[rIdx]?.id || rIdx} className="align-top">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 text-xs ${
                              cIdx <= 1 ? "whitespace-nowrap font-medium" : "max-w-[220px] break-words"
                            }`}
                          >
                            {String(cell ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={headers.length}
                          className="p-8 text-center text-on-surface-variant text-sm"
                        >
                          Belum ada data pendaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {applications.length > 5 && (
                <p className="text-xs text-center text-on-surface-variant mt-4 font-medium italic">
                  ... dan {applications.length - 5} baris data lainnya (Total {applications.length} baris pendaftar).
                </p>
              )}
            </div>

            <div className="p-5 sm:p-6 border-t border-outline-variant/30 bg-surface flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-variant/20 transition-colors text-on-surface"
              >
                Batal
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={applications.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/60 hover:bg-surface-variant/30 text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiFile size={15} /> Download CSV (;)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadXlsx}
                  disabled={applications.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload size={16} /> Download Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
