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
      className="hidden" data-tour-btn="true"
      aria-label={t("startBtn")}
    >
      <FiHelpCircle size={24} />
      <span className="absolute right-full mr-3 bg-surface text-on-surface-variant text-xs font-bold py-1.5 px-3 rounded-lg border border-outline-variant/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {t("startBtn")}
      </span>
    </motion.button>
  );
}
