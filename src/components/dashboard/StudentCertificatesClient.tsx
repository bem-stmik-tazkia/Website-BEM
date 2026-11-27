"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { markStudentCategoryReadFromClient } from "@/lib/student-notifications";
import type { CertificateRecord } from "@/types/certificate";
import { formatIndonesianLongDate } from "@/lib/certificate-utils";
import CertificatePreviewModal from "@/components/certificates/CertificatePreviewModal";

export default function StudentCertificatesClient({
  userId,
  certificates,
}: {
  userId: string;
  certificates: CertificateRecord[];
}) {
  const t = useTranslations("StudentDashboard");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  useEffect(() => {
    markStudentCategoryReadFromClient(supabase, "certificate");

    const channel = supabase
      .channel(`student_certs_${userId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "certificates",
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, router]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) =>
        c.activity_title.toLowerCase().includes(q) ||
        c.role_title.toLowerCase().includes(q) ||
        c.certificate_code.toLowerCase().includes(q) ||
        c.certificate_number.toLowerCase().includes(q) ||
        c.recipient_name.toLowerCase().includes(q)
    );
  }, [certificates, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-on-surface flex items-center gap-2">
            <FiAward className="text-primary" size={20} />
            <span>{t("certificatesPageTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 max-w-2xl">
            {t("certificatesPageSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FiRefreshCw size={14} className={refreshing ? "animate-spin text-primary" : ""} />
          <span>{t("refreshBtn")}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-bold text-on-surface-variant">
          Total: <strong className="text-on-surface">{certificates.length}</strong> e-sertifikat
        </div>
        <div className="relative w-full sm:w-80">
          <FiSearch
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("certificatesSearchPlaceholder")}
            className="w-full bg-background border border-outline-variant/50 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* List */}
      {certificates.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-3xl p-10 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FiAward size={26} />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
            {t("emptyCertificatesTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md leading-relaxed">
            {t("emptyCertificatesDesc")}
          </p>
          <Link
            href="/agenda"
            className="mt-5 inline-flex items-center gap-2 bg-primary text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("exploreActivities")} <FiArrowRight size={14} />
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-3xl p-10 text-center flex flex-col items-center">
          <h3 className="text-base font-extrabold text-on-surface">{t("emptyFilterTitle")}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">{t("emptyFilterDesc")}</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("resetFilter")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((cert) => {
            const isRevoked = cert.status === "revoked";
            const issuedDateDisplay =
              cert.issued_date_label ||
              (locale === "id"
                ? formatIndonesianLongDate(cert.issued_at)
                : new Date(cert.issued_at).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }));

            return (
              <div
                key={cert.id}
                className={`bg-surface border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between gap-4 min-w-0 ${
                  isRevoked
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-primary/10 text-primary break-all">
                      {cert.certificate_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        isRevoked
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isRevoked ? <FiAlertTriangle size={12} /> : <FiShield size={12} />}
                      {isRevoked ? t("certStatusRevoked") : t("certStatusIssued")}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-on-surface leading-snug line-clamp-2 break-words">
                      {cert.activity_title}
                    </h3>
                    <p className="text-xs font-bold text-primary mt-1 break-words">
                      {cert.role_title}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-on-surface-variant bg-surface-variant/15 rounded-2xl p-3 border border-outline-variant/20">
                    <p className="break-all">
                      <span className="font-semibold">{t("certNumberLabel")}:</span>{" "}
                      <span className="font-mono text-on-surface">{cert.certificate_number}</span>
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <FiCalendar size={12} />
                      <span>{issuedDateDisplay}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                  <a
                    href={`/sertifikat/${encodeURIComponent(cert.certificate_code)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
                  >
                    <FiExternalLink size={13} />
                    <span>{t("certVerifyBtn")}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewCert(cert)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-xs transition-colors cursor-pointer"
                  >
                    <FiDownload size={14} />
                    <span>{t("certDownloadBtn")}</span>
                  </button>
                </div>
              </div>
            );
          })}
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
