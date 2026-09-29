"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function BeritaTourClient() {
  const t = useTranslations("Tour");

  const { startTour } = useTour({
    tourId: "berita_tour_v1",
    steps: [
      {
        element: "#tour-berita-header",
        popover: {
          title: t("berita.header_title"),
          description: t("berita.header_desc"),
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-berita-search",
        popover: {
          title: t("berita.search_title"),
          description: t("berita.search_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-berita-featured",
        popover: {
          title: t("berita.featured_title"),
          description: t("berita.featured_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-berita-grid",
        popover: {
          title: t("berita.grid_title"),
          description: t("berita.grid_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-berita-popular",
        popover: {
          title: t("berita.popular_title"),
          description: t("berita.popular_desc"),
          side: "left",
          align: "start"
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
