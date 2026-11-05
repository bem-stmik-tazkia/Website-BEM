"use client";

import React from "react";
import { FiAlertTriangle, FiLogOut, FiEdit3 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function UnsavedChangesModal({ isOpen, onStay, onLeave }: Props) {
  const t = useTranslations("ArticlePortal");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-sm bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden text-center"
        >
          {/* Glowing subtle ring & Warning Icon */}
          <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <span className="absolute inset-0 rounded-2xl bg-amber-500/15 animate-ping opacity-30" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <FiAlertTriangle size={30} className="drop-shadow-sm" />
            </div>
          </div>

          {/* Heading */}
          <h3 className="font-black text-lg text-on-surface tracking-tight">
            {t("unsavedModalTitle")}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed px-1">
            {t("unsavedModalDesc")}
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={onStay}
              type="button"
              className="py-2.5 px-4 rounded-xl border border-outline-variant/40 hover:bg-surface-variant/30 text-on-surface text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FiEdit3 size={15} />
              <span>{t("unsavedModalStay")}</span>
            </button>
            <button
              onClick={onLeave}
              type="button"
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiLogOut size={15} />
              <span>{t("unsavedModalLeave")}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

