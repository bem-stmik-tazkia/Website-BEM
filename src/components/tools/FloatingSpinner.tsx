"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function FloatingSpinner() {
  const t = useTranslations("Spinner");
  const router = useRouter();
  const pathname = usePathname();
  const [hasTour, setHasTour] = useState(false);

  useEffect(() => {
    const checkTourBtn = () => {
      const btn = document.querySelector('[data-tour-btn="true"]');
      setHasTour(!!btn);
    };

    checkTourBtn();
    const interval = setInterval(checkTourBtn, 300);
    const observer = new MutationObserver(checkTourBtn);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [pathname]);

  if (pathname.includes("/tools/acak-nama")) {
    return null;
  }

  const bottomClass = hasTour ? "bottom-40 md:bottom-32" : "bottom-24 md:bottom-24";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed ${bottomClass} right-4 md:right-8 z-50 cursor-pointer drop-shadow-lg group flex items-center justify-end gap-3 transition-all duration-500`}
        onClick={() => router.push("/tools/acak-nama")}
      >
        {/* Tooltip Label */}
        <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container text-on-surface px-4 py-2 rounded-xl font-bold shadow-soft text-sm items-center gap-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-secondary">
            casino
          </span>
          {t("title") || "Alat Acak"}
        </div>

        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/90 dark:bg-inverse-surface/90 backdrop-blur-md rounded-full border-2 border-secondary shadow-glow flex items-center justify-center overflow-hidden relative">
          <motion.div
            className="w-9 h-9 md:w-10 md:h-10 rounded-full shadow-inner"
            style={{
              background:
                "conic-gradient(#1b4086 0deg 60deg, #f2791e 60deg 120deg, #1b4086 120deg 180deg, #f2791e 180deg 240deg, #1b4086 240deg 300deg, #f2791e 300deg 360deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
          />
          {/* Center Dot */}
          <div className="absolute w-2.5 h-2.5 bg-white dark:bg-inverse-surface rounded-full shadow-sm z-10 border-2 border-secondary" />
          {/* Pointer indicator */}
          <div className="absolute top-1 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-white drop-shadow-sm z-20" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
