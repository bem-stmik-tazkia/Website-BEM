"use client";

import React, { useMemo, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiImage,
  FiShield,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import type { CertificateRecord, CertificateTemplate } from "@/types/certificate";
import {
  certificateRecordToRenderData,
  getCertificateVerifyUrl,
  sanitizeCertificateAssetUrl,
} from "@/lib/certificate-utils";
import { downloadCertificatePdf, downloadCertificatePng } from "@/lib/certificate-canvas";
import CertificateCanvasPreview from "./CertificateCanvasPreview";

export default function CertificatePreviewModal({
  certificate,
  liveTemplate,
  isOpen,
  onClose,
}: {
  certificate: CertificateRecord | null;
  liveTemplate?: CertificateTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [downloadingType, setDownloadingType] = useState<"pdf" | "png" | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const renderData = useMemo(() => {
    if (!certificate) return null;
    return certificateRecordToRenderData(certificate, origin, liveTemplate);
  }, [certificate, origin, liveTemplate]);

  if (!isOpen || !certificate || !renderData) return null;

  const isRevoked = certificate.status === "revoked";
  const safeCustomFileHref = sanitizeCertificateAssetUrl(certificate.custom_file_url, {
    allowPdf: true,
  });
  const verifyHref = getCertificateVerifyUrl(certificate.certificate_code, origin);

  const handleCopyVerifyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyHref);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingType("pdf");
    try {
      await downloadCertificatePdf(renderData);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadPng = async () => {
    setDownloadingType("png");
    try {
      await downloadCertificatePng(renderData);
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2.5 sm:p-5 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[94dvh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-outline-variant/25 flex items-center justify-between gap-2.5 bg-surface-variant/15 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
                  isRevoked
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isRevoked ? <FiAlertTriangle size={12} /> : <FiShield size={12} />}
                {isRevoked ? "Sertifikat Dicabut" : "E-Sertifikat Resmi"}
              </span>
              <span className="font-mono text-[10px] sm:text-xs font-bold text-primary bg-primary/10 px-2 sm:px-2.5 py-0.5 rounded-full">
                {certificate.certificate_code}
              </span>
            </div>
            <h3 className="text-sm sm:text-lg font-extrabold text-on-surface line-clamp-2 sm:truncate mt-1">
              {certificate.recipient_name} — {certificate.activity_title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-variant/50 text-on-surface-variant shrink-0 cursor-pointer"
            aria-label="Tutup"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {isRevoked && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <FiAlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Status sertifikat ini sedang dicabut oleh panitia/admin.</p>
                {certificate.revoked_reason && (
                  <p className="text-xs mt-0.5">Alasan: {certificate.revoked_reason}</p>
                )}
              </div>
            </div>
          )}

          {/* High-res live canvas preview */}
          <div className="max-w-3xl mx-auto">
            <CertificateCanvasPreview data={renderData} scale={0.55} />
          </div>

          {/* Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-surface-variant/20 border border-outline-variant/25 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Nomor Sertifikat
              </span>
              <span className="font-bold text-on-surface break-all mt-0.5 block">
                {certificate.certificate_number}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-variant/20 border border-outline-variant/25 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Peran / Predikat
              </span>
              <span className="font-bold text-primary break-words mt-0.5 block">
                {certificate.role_title}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-variant/20 border border-outline-variant/25 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Tanggal Terbit
              </span>
              <span className="font-bold text-on-surface mt-0.5 block">
                {renderData.issued_date_label || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:px-6 sm:py-4 border-t border-outline-variant/25 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyVerifyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/50 text-[11px] sm:text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {copiedCode ? <FiCheck size={14} className="text-emerald-600 shrink-0" /> : <FiCopy size={14} className="shrink-0" />}
              <span className="truncate">{copiedCode ? "Link Disalin" : "Salin Link QR"}</span>
            </button>
            <a
              href={`/sertifikat/${encodeURIComponent(certificate.certificate_code)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/50 text-[11px] sm:text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
            >
              <FiExternalLink size={14} className="shrink-0" />
              <span className="truncate">Halaman QR</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {safeCustomFileHref && (
              <a
                href={safeCustomFileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:col-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <FiDownload size={14} />
                <span>File Upload Khusus</span>
              </a>
            )}
            <button
              type="button"
              disabled={downloadingType !== null}
              onClick={handleDownloadPng}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-surface-variant/60 hover:bg-surface-variant text-on-surface border border-outline-variant/40 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
            >
              <FiImage size={14} className="shrink-0" />
              <span>{downloadingType === "png" ? "PNG..." : "Download PNG"}</span>
            </button>
            <button
              type="button"
              disabled={downloadingType !== null}
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              <FiFileText size={14} className="shrink-0" />
              <span>{downloadingType === "pdf" ? "PDF..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
