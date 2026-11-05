"use client";

import React from "react";
import { FiRotateCcw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isCancelling: boolean;
}

export default function CancelSubmissionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isCancelling,
}: Props) {
  const t = useTranslations("DashboardArtikel");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
              <FiRotateCcw size={22} />
            </div>
            <h3 className="font-bold text-base text-on-surface">
              {t("cancelSubmissionTitle")}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1 line-clamp-2 px-2">
              "{title}"
            </p>
            <p className="text-[11px] text-on-surface-variant/80 mt-2 leading-relaxed">
              {t("cancelSubmissionDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onClose}
              disabled={isCancelling}
              type="button"
              className="py-2.5 px-4 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t("deleteModalCancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isCancelling}
              type="button"
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isCancelling ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiRotateCcw size={14} />
              )}
              <span>
                {isCancelling
                  ? t("cancelSubmissionProcessing")
                  : t("cancelSubmissionConfirm")}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

