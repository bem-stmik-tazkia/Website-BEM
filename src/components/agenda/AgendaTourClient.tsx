"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function AgendaTourClient() {
  const t = useTranslations("Tour");

  const { startTour } = useTour({
    tourId: "agenda_tour_v1",
    steps: [
      {
        element: "#tour-agenda-header",
        popover: {
          title: t("agenda.header_title"),
          description: t("agenda.header_desc"),
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-tabs",
        popover: {
          title: t("agenda.nav_title"),
          description: t("agenda.nav_desc"),
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-search",
        popover: {
          title: t("agenda.search_title"),
          description: t("agenda.search_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-agenda-filters",
        popover: {
          title: t("agenda.filter_title"),
          description: t("agenda.filter_desc"),
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-agenda-calendar",
        popover: {
          title: t("agenda.calendar_title"),
          description: t("agenda.calendar_desc"),
          side: "left",
          align: "center"
        }
      }
    ],
    autoStart: true,
  });

  return (
    <motion.button
      data-tour-btn="true"
      initial={{ opacity: 0, scale: 0.5, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      onClick={startTour}
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 p-3 sm:p-4 rounded-full bg-surface shadow-xl border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:border-transparent hover:text-white transition-all hover:scale-110 flex items-center justify-center group"
      aria-label={t("startBtn")}
    >
      <FiHelpCircle size={24} />
      <span className="absolute right-full mr-3 bg-surface text-on-surface-variant text-xs font-bold py-1.5 px-3 rounded-lg border border-outline-variant/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {t("startBtn")}
      </span>
    </motion.button>
  );
}
