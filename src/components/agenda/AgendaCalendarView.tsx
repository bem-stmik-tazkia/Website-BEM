"use client";

import React, { useState, useMemo } from "react";
import { FiChevronLeft, FiChevronRight, FiClock, FiMapPin, FiArrowRight, FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AgendaKegiatan } from "@/types/agenda";
import { formatDateToIndo } from "@/utils/dateFormatter";
import { useTranslations } from "next-intl";

interface AgendaCalendarViewProps {
  agendas: AgendaKegiatan[];
  isVolunteer?: boolean;
}

// We will fetch these dynamically using useTranslations now.

export default function AgendaCalendarView({ agendas, isVolunteer = false }: AgendaCalendarViewProps) {
  const t = useTranslations("AgendaPage");
  
  // Use translations for array-based keys
  const daysOfWeek = t.raw("daysOfWeek");
  const monthNames = t.raw("monthNames");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Set selected date to midnight for comparison
  if (selectedDate) {
    selectedDate.setHours(0, 0, 0, 0);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Parse agendas into a dictionary by date string (YYYY-MM-DD)
  const agendaByDate = useMemo(() => {
    const map = new Map<string, AgendaKegiatan[]>();
    agendas.forEach(agenda => {
      if (!agenda.date) return;
      const dateObj = new Date(agenda.date);
      // Format to YYYY-MM-DD local
      const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(agenda);
    });
    return map;
  }, [agendas]);

  const days = [];
  // Empty cells before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 sm:h-12" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(currentYear, currentMonth, day);
    dateObj.setHours(0, 0, 0, 0);
    
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAgendas = agendaByDate.get(dateKey) || [];
    
    const isToday = new Date().setHours(0,0,0,0) === dateObj.getTime();
    const isSelected = selectedDate?.getTime() === dateObj.getTime();
    const hasEvents = dayAgendas.length > 0;

    days.push(
      <button
        key={`day-${day}`}
        onClick={() => setSelectedDate(dateObj)}
        className={`relative h-10 sm:h-12 flex flex-col items-center justify-center sm:justify-start sm:pt-1.5 rounded-lg transition-all border ${
          isSelected 
            ? "border-primary bg-primary/10 shadow-sm" 
            : "border-transparent hover:border-outline-variant/50 hover:bg-surface-variant/30"
        }`}
      >
        <span className={`text-sm md:text-base font-semibold ${
          isToday 
            ? "bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full" 
            : isSelected 
              ? "text-primary font-bold" 
              : dateObj.getDay() === 0
                ? "text-red-500"
                : "text-on-surface"
        }`}>
          {day}
        </span>
        
        {/* Indicators for events */}
        {hasEvents && (
          <div className="absolute bottom-1 sm:bottom-auto sm:top-7 flex gap-0.5 mt-1">
            {dayAgendas.slice(0, 3).map((_, idx) => (
              <span key={idx} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSelected ? "bg-primary" : "bg-secondary"}`} />
            ))}
            {dayAgendas.length > 3 && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-outline" />}
          </div>
        )}
      </button>
    );
  }

  // Determine selected day's events
  const selectedDateKey = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;
  const selectedAgendas = selectedDateKey ? (agendaByDate.get(selectedDateKey) || []) : [];

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      {/* Calendar Header */}
      <div id="tour-agenda-calendar" className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-background">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-full bg-surface-variant/50 hover:bg-primary hover:text-white transition-colors text-on-surface"
            >
              <FiChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-full bg-surface-variant/50 hover:bg-primary hover:text-white transition-colors text-on-surface"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((day: string, idx: number) => (
            <div key={day} className={`text-center text-xs md:text-sm font-bold uppercase tracking-wider mb-2 ${idx === 0 ? "text-red-500" : "text-on-surface-variant"}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days}
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedDateKey || "none"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-surface-variant/20 rounded-2xl p-4 sm:p-5 border border-outline-variant/30"
        >
          <div className="flex items-center gap-3 mb-4 border-b border-outline-variant/20 pb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FiCalendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-background">{isVolunteer ? t("recruitDeadline") : t("dailyAgenda")}</h3>
              <p className="text-sm text-on-surface-variant">
                {selectedDate ? formatDateToIndo(selectedDate.toISOString()) : t("selectDate")}
              </p>
            </div>
          </div>

          {selectedAgendas.length > 0 ? (
            <div className="flex flex-col gap-3">
              {selectedAgendas.map((agenda, index) => {
                 const agendaDateValue = agenda.date || "";
                 const isPast = agendaDateValue ? new Date(agendaDateValue).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) : false;
                 const isToday = agendaDateValue ? new Date(agendaDateValue).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) : false;
                 
                 return (
                  <Link 
                    href={`/agenda/${agenda.id}?from=${isVolunteer ? 'agenda-volunteer' : 'agenda-event'}`}
                    key={agenda.id} 
                    className="bg-surface border border-outline-variant/30 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-2 py-1 rounded-md">
                        {agenda.category}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-500 px-2 py-1 rounded-md flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> {t("statusLive").toUpperCase()}
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-variant/50 px-2 py-1 rounded-md">
                          {t("statusDone")}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-base text-on-background group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {agenda.title}
                    </h4>
                    
                    <div className="flex flex-col gap-1 text-xs text-on-surface-variant mb-4 mt-auto">
                      <span className="flex items-center gap-1.5">
                        <FiClock size={12} className="text-primary shrink-0" /> {agenda.time_range}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiMapPin size={12} className="text-primary shrink-0" /> {agenda.location}
                      </span>
                    </div>

                    <div className="flex items-center text-primary text-xs font-bold group-hover:text-secondary transition-colors gap-1 mt-2">
                      {isVolunteer ? t("detailRecruit") : (isPast ? t("viewDocs") : t("detailEvent"))} <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                 )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-on-surface-variant font-medium">{isVolunteer ? t("noDeadlineOnDate") : t("noEventOnDate")}</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">{isVolunteer ? t("pickDateRecruitDesc") : t("pickDateEventDesc")}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
