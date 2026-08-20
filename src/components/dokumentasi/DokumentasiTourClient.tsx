"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function DokumentasiTourClient() {
  const t = useTranslations("Tour");

  const { startTour } = useTour({
    tourId: "dokumentasi_tour_v1",
    steps: [
      {
        element: "#tour-dokumentasi-header",
        popover: {
          title: t("dokumentasi.header_title"),
          description: t("dokumentasi.header_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-dokumentasi-search",
        popover: {
          title: t("dokumentasi.search_title"),
          description: t("dokumentasi.search_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-dokumentasi-grid",
        popover: {
          title: t("dokumentasi.grid_title"),
          description: t("dokumentasi.grid_desc"),
          side: "top",
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
