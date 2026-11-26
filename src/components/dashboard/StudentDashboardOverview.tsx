"use client";

import React, { useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiPlus,
  FiSearch,
  FiSettings,
  FiXCircle,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
import type {
  StudentArticleSummary,
  StudentDashboardUser,
  StudentRegistrationRecord,
} from "@/lib/student-dashboard";
import {
  getDefaultPosterBgClass,
  getKegiatanPosterUrl,
  isDefaultPosterPath,
  isSvgImageUrl,
} from "@/lib/default-posters";

function formatShortDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentDashboardOverview({
  user,
  registrations,
  articles,
}: {
  user: StudentDashboardUser;
  registrations: StudentRegistrationRecord[];
  articles: StudentArticleSummary[];
}) {
  const t = useTranslations("StudentDashboard");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  // Realtime refresh jika status pendaftaran atau artikel user berubah
  useEffect(() => {
    const channel = supabase
      .channel(`student_overview_${user.id}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_applications",
          filter: `user_id=eq.${user.id}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "articles",
          filter: `author_id=eq.${user.id}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id, router]);

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const acceptedCount = registrations.filter((r) => r.status === "accepted").length;
  const publishedArticlesCount = articles.filter((a) => a.status === "published").length;

  const recentRegs = registrations.slice(0, 3);
  const recentRegAgendas = React.useMemo(
    () =>
      recentRegs.map((r) => ({
        id: r.agenda?.id || r.agenda_id,
        title: r.agenda?.title || t("untitledAgenda"),
      })),
    [recentRegs, t]
  );
  const { data: translatedRegAgendas } = useTranslatedList(
    recentRegAgendas,
    "agenda_kegiatan",
    locale,
    ["title"]
  );

  const recentArticles = articles.slice(0, 3);
  const { data: translatedArticles } = useTranslatedList(
    recentArticles,
    "articles",
    locale,
    ["title"]
  );

  const initials = (user.fullName || "M")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Greeting Header Card */}
      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-lg sm:text-xl overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <span className="inline-block bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
              {t("studentBadge")}
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-on-surface truncate">
              {t("welcomePrefix")} {user.fullName}
            </h2>
            {user.email && (
              <p className="text-xs sm:text-sm text-on-surface-variant truncate">
                {user.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/profil"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-variant/30 hover:bg-surface-variant text-on-surface border border-outline-variant/40 text-xs sm:text-sm font-bold transition-colors"
          >
            <FiSettings size={15} />
            <span>{t("editProfileBtn")}</span>
          </Link>
          <Link
            href="/agenda"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-variant/40 hover:bg-primary/10 text-on-surface hover:text-primary border border-outline-variant/40 text-xs sm:text-sm font-bold transition-colors"
          >
            <FiSearch size={15} />
            <span>{t("btnFindActivities")}</span>
          </Link>
          <Link
            href="/dashboard/artikel/baru"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
          >
            <FiPlus size={15} />
            <span>{t("btnWriteArticle")}</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/dashboard/kegiatan"
          className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-amber-400/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock size={18} />
            </div>
            <FiArrowRight
              size={14}
              className="text-on-surface-variant/40 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface">{pendingCount}</p>
          <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">
            {t("kpiPendingTitle")}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{t("kpiPendingSub")}</p>
        </Link>

        <Link
          href="/dashboard/kegiatan"
          className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-emerald-400/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle size={18} />
            </div>
            <FiArrowRight
              size={14}
              className="text-on-surface-variant/40 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{acceptedCount}</p>
          <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">
            {t("kpiAcceptedTitle")}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{t("kpiAcceptedSub")}</p>
        </Link>

        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiAward size={18} />
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/70">
              {t("kpiCertSoon")}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface">0</p>
          <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">
            {t("kpiCertTitle")}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{t("kpiCertSub")}</p>
        </div>

        <Link
          href="/dashboard/artikel"
          className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FiBookOpen size={18} />
            </div>
            <FiArrowRight
              size={14}
              className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-primary">{articles.length}</p>
          <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">
            {t("kpiArticlesTitle")}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {t("kpiArticlesSub", {
              published: publishedArticlesCount,
              total: articles.length,
            })}
          </p>
        </Link>
      </div>

      {/* 2-Column Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <section className="bg-surface border border-outline-variant/30 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-on-surface flex items-center gap-2">
              <FiCalendar className="text-primary" size={18} />
              <span>{t("recentRegistrationsTitle")}</span>
            </h3>
            <Link
              href="/dashboard/kegiatan"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
            >
              {t("viewAll")} <FiArrowRight size={13} />
            </Link>
          </div>

          {recentRegs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 bg-surface-variant/15 rounded-2xl border border-dashed border-outline-variant/40">
              <FiCalendar size={28} className="text-on-surface-variant/40 mb-2" />
              <p className="text-sm font-bold text-on-surface">
                {t("emptyRegistrationsTitle")}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
                {t("emptyRegistrationsDesc")}
              </p>
              <Link
                href="/agenda"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {t("exploreActivities")} <FiArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRegs.map((reg, idx) => {
                const displayTitle =
                  translatedRegAgendas[idx]?.title ||
                  reg.agenda?.title ||
                  t("untitledAgenda");
                const poster = getKegiatanPosterUrl(
                  reg.agenda?.image_url,
                  reg.agenda?.type === "volunteer" ? "volunteer" : "event"
                );
                const isDefault = isDefaultPosterPath(poster);
                const targetHref = `/agenda/${reg.agenda?.slug || reg.agenda_id}?from=dashboard`;

                return (
                  <Link
                    key={reg.id}
                    href={targetHref}
                    className="flex items-center gap-3.5 p-3 rounded-2xl border border-outline-variant/25 hover:border-primary/40 hover:bg-surface-variant/15 transition-all group"
                  >
                    <div
                      className={`w-16 h-11 rounded-xl overflow-hidden shrink-0 relative ${
                        isDefault
                          ? getDefaultPosterBgClass(
                              reg.agenda?.type === "volunteer" ? "volunteer" : "event"
                            )
                          : "bg-surface-variant"
                      }`}
                    >
                      <Image
                        src={poster}
                        alt={displayTitle}
                        fill
                        unoptimized={isSvgImageUrl(poster)}
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {displayTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-on-surface-variant mt-0.5">
                        {reg.item_name && (
                          <span className="font-semibold text-primary">{reg.item_name}</span>
                        )}
                        <span>{formatShortDate(reg.created_at, locale)}</span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        reg.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : reg.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {reg.status === "accepted" ? (
                        <FiCheckCircle size={11} />
                      ) : reg.status === "rejected" ? (
                        <FiXCircle size={11} />
                      ) : (
                        <FiClock size={11} />
                      )}
                      {reg.status === "accepted"
                        ? t("statusAccepted")
                        : reg.status === "rejected"
                          ? t("statusRejected")
                          : t("statusPending")}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Articles */}
        <section className="bg-surface border border-outline-variant/30 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-extrabold text-on-surface flex items-center gap-2">
              <FiEdit3 className="text-primary" size={18} />
              <span>{t("recentArticlesTitle")}</span>
            </h3>
            <Link
              href="/dashboard/artikel"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
            >
              {t("manageArticles")} <FiArrowRight size={13} />
            </Link>
          </div>

          {recentArticles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 bg-surface-variant/15 rounded-2xl border border-dashed border-outline-variant/40">
              <FiBookOpen size={28} className="text-on-surface-variant/40 mb-2" />
              <p className="text-sm font-bold text-on-surface">{t("emptyArticlesTitle")}</p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
                {t("emptyArticlesDesc")}
              </p>
              <Link
                href="/dashboard/artikel/baru"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={13} /> {t("writeFirstArticle")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((art, idx) => {
                const displayTitle = translatedArticles[idx]?.title || art.title;
                const badgeClass =
                  art.status === "published"
                    ? "bg-emerald-100 text-emerald-700"
                    : art.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : art.status === "rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-surface-variant text-on-surface-variant";
                const badgeText =
                  art.status === "published"
                    ? t("articleStatusPublished")
                    : art.status === "pending"
                      ? t("articleStatusPending")
                      : art.status === "rejected"
                        ? t("articleStatusRejected")
                        : t("articleStatusDraft");

                return (
                  <Link
                    key={art.id}
                    href="/dashboard/artikel"
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-outline-variant/25 hover:border-primary/40 hover:bg-surface-variant/15 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {displayTitle}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {formatShortDate(art.created_at, locale)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
