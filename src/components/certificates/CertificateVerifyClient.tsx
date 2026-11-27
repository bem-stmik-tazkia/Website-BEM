"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiHome,
  FiMapPin,
  FiSearch,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import type { PublicCertificateVerification } from "@/types/certificate";

export default function CertificateVerifyClient({
  initialCode = "",
  schemaReady = true,
  rateLimited = false,
  verification = null,
}: {
  initialCode?: string;
  schemaReady?: boolean;
  rateLimited?: boolean;
  verification?: PublicCertificateVerification | null;
}) {
  const t = useTranslations("CertificateVerify");
  const router = useRouter();
  const [queryCode, setQueryCode] = useState(initialCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryCode.trim();
    if (!clean) return;
    router.push(`/sertifikat/${encodeURIComponent(clean)}`);
  };

  const hasResult = verification !== null;
  const isFound = Boolean(verification?.found);
  const isValid = isFound && verification?.status === "issued";

  return (
    <div className="min-h-screen bg-surface-variant/20 pt-24 sm:pt-28 pb-28 sm:pb-24 px-3.5 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* Header Card */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm text-center space-y-3.5 sm:space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2">
            <Image
              src="/images/logo2.webp"
              alt="Logo BEM STMIK Tazkia"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="inline-flex items-center justify-center gap-1.5 max-w-full px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide sm:tracking-wider leading-snug text-center">
              <FiShield size={12} className="shrink-0" />
              <span>{t("badgeOfficial")}</span>
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-on-surface mt-2.5 leading-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-xl mx-auto leading-relaxed">
              {t("pageSubtitle")}
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-2.5 pt-1 sm:pt-2">
            <div className="relative flex-1 min-w-0">
              <FiSearch
                size={16}
                className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder={t("inputPlaceholder")}
                className="w-full bg-background border border-outline-variant/50 rounded-xl sm:rounded-2xl pl-10 sm:pl-11 pr-3.5 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-mono uppercase placeholder:normal-case focus:border-primary outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <span>{t("verifyBtn")}</span>
              <FiArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Schema not migrated notice */}
        {!schemaReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-950 flex items-start gap-3">
            <FiAlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm">{t("serviceUnavailable")}</p>
          </div>
        )}

        {/* Rate limit guard notice */}
        {schemaReady && rateLimited && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl sm:rounded-3xl p-6 text-center text-amber-950 space-y-2 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FiAlertTriangle size={24} />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold">{t("rateLimitedTitle")}</h2>
            <p className="text-xs sm:text-sm text-amber-900 max-w-md mx-auto">
              {t("rateLimitedDesc")}
            </p>
          </div>
        )}

        {/* Verification Result */}
        {schemaReady && !rateLimited && hasResult && (
          <>
            {!isFound ? (
              <div className="bg-surface border border-rose-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center shadow-sm space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <FiXCircle size={28} />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">
                  {t("notFoundTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto break-words">
                  {t("notFoundDesc", { code: initialCode })}
                </p>
              </div>
            ) : (
              <div
                className={`bg-surface rounded-2xl sm:rounded-3xl shadow-md overflow-hidden border-2 ${
                  isValid ? "border-emerald-500/40" : "border-rose-500/40"
                }`}
              >
                {/* Status Banner */}
                <div
                  className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isValid
                      ? "bg-emerald-50 border-b border-emerald-200/80"
                      : "bg-rose-50 border-b border-rose-200/80"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                        isValid
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {isValid ? <FiCheckCircle size={22} /> : <FiAlertTriangle size={22} />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm sm:text-base font-black uppercase tracking-wider break-words ${
                          isValid ? "text-emerald-800" : "text-rose-800"
                        }`}
                      >
                        {isValid ? t("statusValid") : t("statusRevoked")}
                      </p>
                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${
                          isValid ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isValid
                          ? t("statusValidDesc")
                          : verification?.revoked_reason || t("statusRevokedDesc")}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] sm:text-xs font-extrabold px-3 py-1.5 rounded-xl bg-white border border-outline-variant/40 text-on-surface self-start sm:self-auto break-all shrink-0">
                    {verification?.certificate_code}
                  </span>
                </div>

                {/* Credential Details */}
                <div className="p-4 sm:p-7 space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-variant/15 border border-outline-variant/25 space-y-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <FiUser size={12} /> {t("recipientLabel")}
                      </span>
                      <p className="text-base sm:text-lg font-extrabold text-on-surface break-words">
                        {verification?.recipient_name}
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-variant/15 border border-outline-variant/25 space-y-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <FiAward size={12} /> {t("roleLabel")}
                      </span>
                      <p className="text-base sm:text-lg font-extrabold text-primary break-words">
                        {verification?.role_title}
                      </p>
                      <p className="text-xs font-mono text-on-surface-variant break-all">
                        {t("numberLabel")}: {verification?.certificate_number}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                      {verification?.subtitle || "SERTIFIKAT PENGHARGAAN"}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
                      {verification?.activity_title}
                    </h3>
                    {verification?.description && (
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {verification.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-on-surface-variant">
                      {verification?.activity_date_label && (
                        <span className="inline-flex items-center gap-1.5">
                          <FiCalendar size={13} className="text-primary" />
                          <span>
                            {t("activityDateLabel")}:{" "}
                            <strong className="text-on-surface">
                              {verification.activity_date_label}
                            </strong>
                          </span>
                        </span>
                      )}
                      {verification?.issued_date_label && (
                        <span className="inline-flex items-center gap-1.5">
                          <FiMapPin size={13} className="text-primary" />
                          <span>
                            {t("issuedAtLabel")}:{" "}
                            <strong className="text-on-surface">
                              {verification.issued_city ? `${verification.issued_city}, ` : ""}
                              {verification.issued_date_label}
                            </strong>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {verification?.signers_summary && verification.signers_summary.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("signersLabel")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {verification.signers_summary.map((s, idx) => (
                          <div
                            key={idx}
                            className="px-3.5 py-2.5 rounded-xl bg-surface-variant/15 border border-outline-variant/25"
                          >
                            <p className="text-xs font-extrabold text-on-surface">{s.name}</p>
                            {s.role && (
                              <p className="text-[11px] text-on-surface-variant">{s.role}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            <FiHome size={14} /> {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
