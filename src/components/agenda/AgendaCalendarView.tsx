"use client";

import React, { useState, useMemo } from "react";
import { FiChevronLeft, FiChevronRight, FiClock, FiMapPin, FiArrowRight, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";
import { useTranslations } from "next-intl";
import SafeLottie from "@/components/ui/SafeLottie";

interface AgendaCalendarViewProps {
  agendas: AgendaKegiatan[];
  isVolunteer?: boolean;
}

// Palette warna untuk membedakan event (untuk range blocking)
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

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateLocal(dateStr: string): Date {
  // Parse YYYY-MM-DD tanpa timezone shift
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export default function AgendaCalendarView({ agendas, isVolunteer = false }: AgendaCalendarViewProps) {
  const t = useTranslations("AgendaPage");
  const daysOfWeek: string[] = t.raw("daysOfWeek");
  const monthNames: string[] = t.raw("monthNames");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Assign warna ke setiap event berdasarkan index
  const agendasWithColor = useMemo(
    () => agendas.map((a, i) => ({ ...a, colorIdx: i % EVENT_COLORS.length })),
    [agendas]
  );

  // Build map: dateKey → list of (agenda + colorIdx) yang mencakup tanggal tersebut (termasuk range)
  const agendaByDate = useMemo(() => {
    const map = new Map<string, typeof agendasWithColor>();
    agendasWithColor.forEach((agenda) => {
      if (!agenda.date) return;
      const start = parseDateLocal(agenda.date);
      const end = agenda.end_date ? parseDateLocal(agenda.end_date) : new Date(start);

      const cur = new Date(start);
      while (cur <= end) {
        const key = toLocalDateKey(cur);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(agenda);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [agendasWithColor]);

  // Build calendar days
  const days = useMemo(() => {
    const cells: React.ReactNode[] = [];

    // Empty cells before month start
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 sm:h-11" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      dateObj.setHours(0, 0, 0, 0);
      const dateKey = toLocalDateKey(dateObj);
      const dayAgendas = agendaByDate.get(dateKey) || [];

      const isToday = today.getTime() === dateObj.getTime();
      const isSelected = selectedDate?.getTime() === dateObj.getTime();
      const hasEvents = dayAgendas.length > 0;

      // Tentukan apakah hari ini adalah start/middle/end dari sebuah event range
      // untuk menentukan sudut mana yang di-round
      const rangeInfos = dayAgendas.map((agenda) => {
        const start = agenda.date ? parseDateLocal(agenda.date) : dateObj;
        const end = agenda.end_date ? parseDateLocal(agenda.end_date) : start;
        const isStart = dateObj.getTime() === start.getTime();
        const isEnd = dateObj.getTime() === end.getTime();
        const isSingle = isStart && isEnd;
        return { agenda, isStart, isEnd, isSingle };
      });

      // Primary color dari event pertama (untuk day cell bg)
      const primaryColor = hasEvents ? EVENT_COLORS[dayAgendas[0].colorIdx] : null;

      cells.push(
        <button
          key={`day-${day}`}
          onClick={() => setSelectedDate(dateObj)}
          className={`relative h-10 sm:h-11 flex flex-col items-center justify-center sm:justify-start sm:pt-1.5 rounded-lg transition-all border ${
            isSelected
              ? "border-primary bg-primary/10 shadow-sm"
              : hasEvents
              ? `border-transparent`
              : "border-transparent hover:border-outline-variant/50 hover:bg-surface-variant/30"
          }`}
          style={
            hasEvents && !isSelected
              ? { backgroundColor: EVENT_COLORS[dayAgendas[0].colorIdx].rangeBg }
              : undefined
          }
        >
          <span
            className={`text-sm font-semibold z-10 relative ${
              isToday
                ? "bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full"
                : isSelected
                ? "text-primary font-bold"
                : dateObj.getDay() === 0
                ? "text-red-500"
                : hasEvents
                ? ""
                : "text-on-surface"
            }`}
            style={
              hasEvents && !isToday && !isSelected
                ? { color: EVENT_COLORS[dayAgendas[0].colorIdx].rangeText, fontWeight: 700 }
                : undefined
            }
          >
            {day}
          </span>

          {/* Colored dots for multiple events */}
          {hasEvents && (
            <div className="absolute bottom-0.5 sm:bottom-auto sm:top-7 flex gap-0.5 z-10">
              {dayAgendas.slice(0, 4).map((ag, idx) => (
                <span
                  key={idx}
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                  style={{ backgroundColor: EVENT_COLORS[ag.colorIdx].rangeText }}
                />
              ))}
              {dayAgendas.length > 4 && (
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-outline" />
              )}
            </div>
          )}
        </button>
      );
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfMonth, agendaByDate, today, selectedDate]);

  // Selected date's agendas
  const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : null;
  const selectedAgendas = selectedDateKey ? (agendaByDate.get(selectedDateKey) || []) : [];

  const formatDateRange = (agenda: AgendaKegiatan) => {
    if (!agenda.date) return "-";
    if (agenda.end_date && agenda.end_date !== agenda.date) {
      return `${formatDateToIndo(agenda.date)} – ${formatDateToIndo(agenda.end_date)}`;
    }
    return formatDateToIndo(agenda.date);
  };

  return (
    <div className="w-full flex flex-col gap-5 md:gap-6">
      {/* ── CALENDAR ─────────────────────────────────────────── */}
      <div id="tour-agenda-calendar" className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-on-background">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex gap-1.5">
            <button onClick={prevMonth} className="p-1.5 rounded-full bg-surface-variant/50 hover:bg-primary hover:text-white transition-colors text-on-surface">
              <FiChevronLeft size={18} />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-full bg-surface-variant/50 hover:bg-primary hover:text-white transition-colors text-on-surface">
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-1">
          {daysOfWeek.map((day: string, idx: number) => (
            <div
              key={day}
              className={`text-center text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 ${idx === 0 ? "text-red-500" : "text-on-surface-variant"}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">{days}</div>
      </div>

      {/* ── DAILY AGENDA PANEL ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDateKey || "none"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4 border-b border-outline-variant/20 pb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FiCalendar size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-background">
                {isVolunteer ? t("recruitDeadline") : t("dailyAgenda")}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {selectedDate ? formatDateToIndo(selectedDate.toISOString()) : t("selectDate")}
              </p>
            </div>
          </div>

          {selectedAgendas.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {selectedAgendas.map((agenda) => {
                const color = EVENT_COLORS[agenda.colorIdx];
                const end = agenda.end_date ? parseDateLocal(agenda.end_date) : (agenda.date ? parseDateLocal(agenda.date) : today);
                const isPast = end < today;
                const isLive = !isPast && agenda.date ? parseDateLocal(agenda.date) <= today : false;
                return (
                  <Link
                    href={`/agenda/${agenda.id}?from=${isVolunteer ? "agenda-volunteer" : "agenda-event"}`}
                    key={agenda.id}
                    className={`block border rounded-xl p-3 transition-all group hover:shadow-md ${color.border} ${color.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${color.text}`}>
                        {agenda.category}
                      </span>
                      {isLive && (
                        <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> LIVE
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[9px] font-bold text-on-surface-variant bg-surface-variant/60 px-1.5 py-0.5 rounded-full shrink-0">
                          {t("statusDone")}
                        </span>
                      )}
                    </div>
                    <h4 className={`font-bold text-sm text-on-background group-hover:${color.text} transition-colors mb-1.5 line-clamp-2`}>
                      {agenda.title}
                    </h4>
                    <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant">
                      {agenda.time_range && (
                        <span className="flex items-center gap-1.5">
                          <FiClock size={11} className={color.text} /> {agenda.time_range}
                        </span>
                      )}
                      {agenda.location && (
                        <span className="flex items-center gap-1.5">
                          <FiMapPin size={11} className={color.text} /> {agenda.location}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${color.text}`}>
                      {isPast ? t("viewDocs") : t("detailEvent")}
                      <FiArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 flex flex-col items-center gap-1">
              <div className="w-24 h-24 relative -my-1">
                <SafeLottie src="/animations/Calendar.lottie" loop autoplay />
              </div>
              <p className="text-sm font-medium text-on-surface-variant mt-1">
                {isVolunteer ? t("noDeadlineOnDate") : t("noEventOnDate")}
              </p>
              <p className="text-xs text-on-surface-variant/70">
                {isVolunteer ? t("pickDateRecruitDesc") : t("pickDateEventDesc")}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
