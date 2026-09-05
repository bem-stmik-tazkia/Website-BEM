"use client";

import { useTour } from "@/hooks/useTour";
import { FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function HomeTourClient() {
  const t = useTranslations("Tour");

  const { startTour } = useTour({
    tourId: "beranda_tour_v1",
    steps: [
      {
        popover: {
          title: t("home.welcome_title"),
          description: t("home.welcome_desc"),
        }
      },
      {
        element: "#tour-berita-sorotan",
        popover: {
          title: t("home.news_title"),
          description: t("home.news_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-event-live",
        popover: {
          title: t("home.live_title"),
          description: t("home.live_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#upcoming",
        popover: {
          title: t("home.upcoming_title"),
          description: t("home.upcoming_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#volunteer",
        popover: {
          title: t("home.volunteer_title"),
          description: t("home.volunteer_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#past-events",
        popover: {
          title: t("home.archive_title"),
          description: t("home.archive_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-saran-aduan",
        popover: {
          title: t("home.voice_title"),
          description: t("home.voice_desc"),
          side: "top",
          align: "center"
        }
      },
      {
        element: "#tour-login-btn",
        popover: {
          title: t("home.login_title"),
          description: t("home.login_desc"),
          side: "bottom",
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
