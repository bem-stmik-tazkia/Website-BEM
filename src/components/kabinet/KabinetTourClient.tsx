"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function KabinetTourClient() {
  const t = useTranslations("Tour");

  const { startTour } = useTour({
    tourId: "kabinet_tour_v1",
    steps: [
      {
        element: "#tour-kabinet-header",
        popover: {
          title: t("kabinet.header_title"),
          description: t("kabinet.header_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-kabinet-visi",
        popover: {
          title: t("kabinet.vision_title"),
          description: t("kabinet.vision_desc"),
          side: "bottom",
          align: "center"
        }
      },
      {
        element: "#tour-kabinet-pengurus",
        popover: {
          title: t("kabinet.board_title"),
          description: t("kabinet.board_desc"),
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-kabinet-proker",
        popover: {
          title: t("kabinet.proker_title"),
          description: t("kabinet.proker_desc"),
          side: "top",
          align: "start"
        }
      },
      {
        element: "#tour-kabinet-departemen",
        popover: {
          title: t("kabinet.dept_title"),
          description: t("kabinet.dept_desc"),
          side: "top",
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
