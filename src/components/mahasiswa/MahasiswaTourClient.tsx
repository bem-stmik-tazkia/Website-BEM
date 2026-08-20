"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MahasiswaTourInner() {
  const t = useTranslations("Tour");
  const searchParams = useSearchParams();
  // Jangan tampilkan tour auto jika user datang dari share link (?id=)
  const isFromShareLink = !!searchParams.get("id");

  const { startTour } = useTour({
    tourId: "mahasiswa_tour_v1",
    steps: [
      {
        element: "#tour-mahasiswa-header",
        popover: {
          title: t("mahasiswa.header_title"),
          description: t("mahasiswa.header_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-stats",
        popover: {
          title: t("mahasiswa.stats_title"),
          description: t("mahasiswa.stats_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-search",
        popover: {
          title: t("mahasiswa.search_title"),
          description: t("mahasiswa.search_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-mahasiswa-filters",
        popover: {
          title: t("mahasiswa.filter_title"),
          description: t("mahasiswa.filter_desc"),
          side: "top",
          align: "center"
        }
      }
    ],
    autoStart: !isFromShareLink,
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

export default function MahasiswaTourClient() {
  return (
    <Suspense fallback={null}>
      <MahasiswaTourInner />
    </Suspense>
  );
}
