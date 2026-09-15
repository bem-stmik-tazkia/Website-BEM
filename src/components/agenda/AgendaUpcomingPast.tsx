"use client";

import React, { useMemo } from "react";
import { FiClock, FiMapPin, FiArrowRight, FiCheckCircle, FiBriefcase } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";
import { useTranslations } from "next-intl";
import SafeLottie from "@/components/ui/SafeLottie";

interface AgendaUpcomingPastProps {
  agendas: AgendaKegiatan[];
  isVolunteer?: boolean;
}

const EVENT_COLORS = [
  { bg: "bg-primary/20",       text: "text-primary",       dot: "bg-primary",       border: "border-primary/40",       rangeBg: "#3b5bdb22", rangeText: "#3b5bdb" },
  { bg: "bg-secondary/20",     text: "text-secondary",     dot: "bg-secondary",     border: "border-secondary/40",     rangeBg: "#f59f0022", rangeText: "#f59f00" },
  { bg: "bg-emerald-500/20",   text: "text-emerald-600",   dot: "bg-emerald-500",   border: "border-emerald-400/40",   rangeBg: "#10b98122", rangeText: "#10b981" },
  { bg: "bg-purple-500/20",    text: "text-purple-600",    dot: "bg-purple-500",    border: "border-purple-400/40",    rangeBg: "#8b5cf622", rangeText: "#8b5cf6" },
  { bg: "bg-rose-500/20",      text: "text-rose-600",      dot: "bg-rose-500",      border: "border-rose-400/40",      rangeBg: "#f4363622", rangeText: "#f43636" },
  { bg: "bg-cyan-500/20",      text: "text-cyan-600",      dot: "bg-cyan-500",      border: "border-cyan-400/40",      rangeBg: "#06b6d422", rangeText: "#06b6d4" },
  { bg: "bg-amber-500/20",     text: "text-amber-600",     dot: "bg-amber-500",     border: "border-amber-400/40",     rangeBg: "#f59e0b22", rangeText: "#f59e0b" },
  { bg: "bg-pink-500/20",      text: "text-pink-600",      dot: "bg-pink-500",      border: "border-pink-400/40",      rangeBg: "#ec489922", rangeText: "#ec4899" },
];

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export default function AgendaUpcomingPast({ agendas, isVolunteer = false }: AgendaUpcomingPastProps) {
  const t = useTranslations("AgendaPage");
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const agendasWithColor = useMemo(
    () => agendas.map((a, i) => ({ ...a, colorIdx: i % EVENT_COLORS.length })),
    [agendas]
  );

  const upcomingAgendas = useMemo(
    () => agendasWithColor.filter((a) => {
      const end = a.end_date ? parseDateLocal(a.end_date) : (a.date ? parseDateLocal(a.date) : null);
      return end && end >= today;
    }).sort((a, b) => {
      const da = a.date ? parseDateLocal(a.date).getTime() : 0;
      const db = b.date ? parseDateLocal(b.date).getTime() : 0;
      return da - db;
    }),
    [agendasWithColor, today]
  );

  const pastAgendas = useMemo(
    () => agendasWithColor.filter((a) => {
      const end = a.end_date ? parseDateLocal(a.end_date) : (a.date ? parseDateLocal(a.date) : null);
      return end && end < today;
    }).sort((a, b) => {
      const da = a.date ? parseDateLocal(a.date).getTime() : 0;
      const db = b.date ? parseDateLocal(b.date).getTime() : 0;
      return db - da; 
    }),
    [agendasWithColor, today]
  );

  const formatDateRange = (agenda: AgendaKegiatan) => {
    if (!agenda.date) return "-";
    if (agenda.end_date && agenda.end_date !== agenda.date) {
      return `${formatDateToIndo(agenda.date)} – ${formatDateToIndo(agenda.end_date)}`;
    }
    return formatDateToIndo(agenda.date);
  };

  if (agendas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6">
      {/* ── UPCOMING EVENTS ──────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-bold text-on-background">
            {isVolunteer ? t("upcomingDeadlineTitle") : t("upcomingTitle")}
          </h3>
          <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {upcomingAgendas.length}
          </span>
        </div>

        <div className="flex-grow flex flex-col justify-center">
            {upcomingAgendas.length > 0 ? (
            <div className="flex flex-col gap-2">
                {upcomingAgendas.slice(0, 5).map((agenda) => {
                const color = EVENT_COLORS[agenda.colorIdx];
                const start = agenda.date ? parseDateLocal(agenda.date) : today;
                const daysLeft = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isLive = daysLeft <= 0;
                
                // Logika khusus Volunteer
                let volunteerBadgeText = "";
                let isVolunteerWaiting = false; // Belum buka
                
                if (isVolunteer) {
                  const end = agenda.end_date ? parseDateLocal(agenda.end_date) : null;
                  const volunteerDaysLeft = end ? Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  if (daysLeft > 0) {
                     isVolunteerWaiting = true;
                     volunteerBadgeText = `Buka dlm ${daysLeft} Hari`;
                  } else {
                     if (volunteerDaysLeft > 0) {
                        volunteerBadgeText = `Sisa ${volunteerDaysLeft} Hari`;
                     } else if (volunteerDaysLeft === 0) {
                        volunteerBadgeText = t("todayLabel");
                     } else {
                        volunteerBadgeText = "Ditutup";
                     }
                  }
                }

                return (
                    <Link
                    href={`/agenda/${agenda.id}?from=${isVolunteer ? "agenda-volunteer" : "agenda-event"}`}
                    key={agenda.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-variant/40 transition-colors group"
                    >
                    <div
                        className={`shrink-0 overflow-hidden flex items-center justify-center text-xs font-black relative ${
                          isVolunteer ? "w-10 h-10 rounded-xl border border-primary/20 bg-primary/5 text-primary shadow-sm" : "w-10 h-10 rounded-xl"
                        }`}
                        style={!isVolunteer && !agenda.image_url ? { backgroundColor: EVENT_COLORS[agenda.colorIdx].rangeBg, color: EVENT_COLORS[agenda.colorIdx].rangeText } : {}}
                    >
                        {agenda.image_url ? (
                          <Image src={agenda.image_url} alt={agenda.title} fill sizes="40px" className="object-cover" />
                        ) : (
                          isVolunteer ? <FiBriefcase size={18} /> : agenda.date ? new Date(agenda.date).getDate() : "?"
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-background group-hover:text-primary transition-colors line-clamp-1">
                        {agenda.title}
                        </p>
                        <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                        {isVolunteer && agenda.end_date ? `Batas: ${formatDateToIndo(agenda.end_date)}` : formatDateRange(agenda)}
                        </p>
                    </div>
                    
                    {isVolunteer ? (
                       <span className={`text-[10px] font-bold px-3 py-1 rounded-md whitespace-nowrap transition-colors border ${
                           isVolunteerWaiting 
                             ? "bg-surface-variant/50 text-on-surface-variant border-outline-variant/30 group-hover:bg-surface-variant group-hover:text-on-background" 
                             : "bg-secondary/10 text-secondary border-secondary/20 group-hover:bg-secondary group-hover:text-white"
                       }`}>
                         {volunteerBadgeText}
                       </span>
                    ) : (
                       <span
                           className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                           isLive
                               ? "bg-red-600 text-white"
                               : daysLeft <= 3
                               ? "bg-amber-500/20 text-amber-700"
                               : `${color.bg} ${color.text}`
                           }`}
                       >
                           {isLive ? "LIVE" : daysLeft === 0 ? t("todayLabel") : t("daysLeft", { days: daysLeft })}
                       </span>
                    )}
                    </Link>
                );
                })}
                {upcomingAgendas.length > 5 && (
                <p className="text-center text-[10px] text-on-surface-variant mt-2 font-medium">
                    {t("otherEvents", { count: upcomingAgendas.length - 5 })}
                </p>
                )}
            </div>
            ) : (
            <div className="flex flex-col items-center py-6 gap-2">
                <div className="w-20 h-20 relative">
                <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <p className="text-[11px] font-medium text-on-surface-variant text-center">
                {isVolunteer ? t("emptyUpcomingDeadline") : t("emptyUpcomingEvent")}
                </p>
            </div>
            )}
        </div>
      </div>

      {/* ── PAST EVENTS ──────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-3">
          <FiCheckCircle size={14} className="text-on-surface-variant" />
          <h3 className="text-sm font-bold text-on-background">
            {isVolunteer ? t("pastDeadlineTitle") : t("pastTitle")}
          </h3>
          <span className="ml-auto text-[10px] font-bold bg-surface-variant/60 text-on-surface-variant px-2 py-0.5 rounded-full">
            {pastAgendas.length}
          </span>
        </div>

        <div className="flex-grow flex flex-col justify-center">
            {pastAgendas.length > 0 ? (
            <div className="flex flex-col gap-2">
                {pastAgendas.slice(0, 5).map((agenda) => (
                <Link
                    href={`/agenda/${agenda.id}?from=${isVolunteer ? "agenda-volunteer" : "agenda-event"}`}
                    key={agenda.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-variant/40 transition-colors group opacity-75 hover:opacity-100"
                >
                    <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-xs font-black bg-surface-variant/60 text-on-surface-variant grayscale relative">
                    {agenda.image_url ? (
                      <Image src={agenda.image_url} alt={agenda.title} fill sizes="40px" className="object-cover" />
                    ) : (
                      isVolunteer ? <FiBriefcase size={18} /> : agenda.date ? new Date(agenda.date).getDate() : "?"
                    )}
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-background group-hover:text-primary transition-colors line-clamp-1">
                        {agenda.title}
                    </p>
                    <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                        {isVolunteer && agenda.end_date ? `Batas: ${formatDateToIndo(agenda.end_date)}` : formatDateRange(agenda)}
                    </p>
                    </div>
                    <span className="text-[10px] font-bold bg-surface-variant/60 text-on-surface-variant px-2 py-0.5 rounded-full shrink-0">
                    {t("statusDone")}
                    </span>
                </Link>
                ))}
                {pastAgendas.length > 5 && (
                <Link
                    href="/dokumentasi"
                    className="text-center text-[10px] text-primary hover:text-secondary font-semibold mt-2 flex items-center justify-center gap-1"
                >
                    {t("otherDocs", { count: pastAgendas.length - 5 })} <FiArrowRight size={10} />
                </Link>
                )}
            </div>
            ) : (
            <div className="flex flex-col items-center py-6 gap-2">
                <div className="w-20 h-20 relative">
                <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
                </div>
                <p className="text-[11px] font-medium text-on-surface-variant text-center">
                {isVolunteer ? t("emptyPastDeadline") : t("emptyPastEvent")}
                </p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
