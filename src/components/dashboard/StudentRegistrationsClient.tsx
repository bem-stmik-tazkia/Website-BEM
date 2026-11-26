"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { markStudentCategoryReadFromClient } from "@/lib/student-notifications";
import { useTranslatedList } from "@/hooks/useTranslatedContent";
import type { StudentRegistrationRecord } from "@/lib/student-dashboard";
import {
  dedupeCategoryLabel,
  getDefaultPosterBgClass,
  getKegiatanPosterUrl,
  isDefaultPosterPath,
  isSvgImageUrl,
} from "@/lib/default-posters";

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

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

export default function StudentRegistrationsClient({
  userId,
  registrations,
}: {
  userId: string;
  registrations: StudentRegistrationRecord[];
}) {
  const t = useTranslations("StudentDashboard");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Tandai notifikasi pendaftaran terbaca saat halaman dibuka & listen realtime
  useEffect(() => {
    markStudentCategoryReadFromClient(supabase, "registration");

    const channel = supabase
      .channel(`student_regs_${userId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_applications",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, router]);

  const agendaDocs = useMemo(
    () =>
      registrations.map((r) => ({
        id: r.agenda?.id || r.agenda_id,
        title: r.agenda?.title || t("untitledAgenda"),
        category: r.agenda?.category || "",
      })),
    [registrations, t]
  );

  const { data: translatedAgendas } = useTranslatedList(
    agendaDocs,
    "agenda_kegiatan",
    locale,
    ["title", "category"]
  );

  const counts = useMemo(
    () => ({
      all: registrations.length,
      pending: registrations.filter((r) => r.status === "pending").length,
      accepted: registrations.filter((r) => r.status === "accepted").length,
      rejected: registrations.filter((r) => r.status === "rejected").length,
    }),
    [registrations]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations
      .map((reg, idx) => ({
        reg,
        displayTitle:
          translatedAgendas[idx]?.title || reg.agenda?.title || t("untitledAgenda"),
        displayCategory:
          translatedAgendas[idx]?.category || reg.agenda?.category || "",
      }))
      .filter(({ reg, displayTitle }) => {
        if (statusFilter !== "all" && reg.status !== statusFilter) return false;
        if (q) {
          const matchTitle = displayTitle.toLowerCase().includes(q);
          const matchItem = (reg.item_name || "").toLowerCase().includes(q);
          if (!matchTitle && !matchItem) return false;
        }
        return true;
      });
  }, [registrations, translatedAgendas, statusFilter, searchQuery, t]);

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
          <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">
            {t("activitiesPageTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 max-w-2xl">
            {t("activitiesPageSubtitle")}
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

      {/* Filters & Search */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", t("filterAll"), counts.all],
              ["pending", t("filterPending"), counts.pending],
              ["accepted", t("filterAccepted"), counts.accepted],
              ["rejected", t("filterRejected"), counts.rejected],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === key
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-variant/30 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === key ? "bg-white/20 text-white" : "bg-surface text-on-surface"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <FiSearch
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-background border border-outline-variant/50 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Registration Cards */}
      {registrations.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-3xl p-10 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <FiCalendar size={26} />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
            {t("emptyRegistrationsTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">
            {t("emptyRegistrationsDesc")}
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
          <h3 className="text-base font-extrabold text-on-surface">
            {t("emptyFilterTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {t("emptyFilterDesc")}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("resetFilter")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ reg, displayTitle, displayCategory }) => {
            const agendaType = reg.agenda?.type === "volunteer" ? "volunteer" : "event";
            const poster = getKegiatanPosterUrl(reg.agenda?.image_url, agendaType);
            const isDefault = isDefaultPosterPath(poster);
            const detailHref = `/agenda/${reg.agenda?.slug || reg.agenda_id}?from=dashboard-kegiatan`;
            const catLabel = dedupeCategoryLabel(displayCategory);

            const isAccepted = reg.status === "accepted";
            const isRejected = reg.status === "rejected";

            return (
              <div
                key={reg.id}
                className="bg-surface border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row gap-4 sm:gap-5"
              >
                {/* Poster Thumbnail */}
                <Link
                  href={detailHref}
                  className={`w-full md:w-52 aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 ${
                    isDefault ? getDefaultPosterBgClass(agendaType) : "bg-surface-variant"
                  }`}
                >
                  <Image
                    src={poster}
                    alt={displayTitle}
                    fill
                    unoptimized={isSvgImageUrl(poster)}
                    sizes="(max-width: 768px) 100vw, 220px"
                    className="object-cover"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            agendaType === "volunteer"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {agendaType === "volunteer" ? t("typeVolunteer") : t("typeEvent")}
                        </span>
                        {catLabel && (
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                            {catLabel}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-700"
                            : isRejected
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isAccepted ? (
                          <FiCheckCircle size={13} />
                        ) : isRejected ? (
                          <FiXCircle size={13} />
                        ) : (
                          <FiClock size={13} />
                        )}
                        {isAccepted
                          ? t("statusAccepted")
                          : isRejected
                            ? t("statusRejected")
                            : t("statusPending")}
                      </span>
                    </div>

                    <Link
                      href={detailHref}
                      className="font-extrabold text-base sm:text-lg text-on-surface hover:text-primary transition-colors line-clamp-2"
                    >
                      {displayTitle}
                    </Link>

                    <p
                      className={`text-xs mt-1 font-medium ${
                        isAccepted
                          ? "text-emerald-700"
                          : isRejected
                            ? "text-rose-600"
                            : "text-amber-700"
                      }`}
                    >
                      {isAccepted
                        ? t("statusAcceptedHint")
                        : isRejected
                          ? t("statusRejectedHint")
                          : t("statusPendingHint")}
                    </p>
                  </div>

                  {/* Metadata & E-Certificate Slot */}
                  <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      {reg.item_name && (
                        <span>
                          {t("positionLabel")}:{" "}
                          <strong className="text-on-surface">{reg.item_name}</strong>
                        </span>
                      )}
                      {reg.agenda?.date && (
                        <span>
                          {t("eventDateLabel")}:{" "}
                          <strong className="text-on-surface">
                            {formatShortDate(reg.agenda.date, locale)}
                          </strong>
                        </span>
                      )}
                      <span>
                        {t("appliedAtLabel")}:{" "}
                        <strong className="text-on-surface">
                          {formatShortDate(reg.created_at, locale)}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold">
                          <FiAward size={13} />
                          <span>
                            {t("certificateLabel")}: {t("certificatePending")}
                          </span>
                        </span>
                      )}
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-variant/40 hover:bg-primary hover:text-white text-on-surface text-xs font-bold transition-colors"
                      >
                        {t("viewDetailBtn")} <FiArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
