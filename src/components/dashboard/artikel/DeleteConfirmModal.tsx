"use client";

import React from "react";
import { FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
}: Props) {
  const t = useTranslations("DashboardArtikel");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-3">
              <FiAlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-base text-on-surface">{t("deleteModalTitle")}</h3>
            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 px-2">
              "{title}"
            </p>
            <p className="text-[11px] text-rose-500 mt-2">
              {t("deleteModalWarning")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onClose}
              disabled={isDeleting}
              type="button"
              className="py-2.5 px-4 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t("deleteModalCancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              type="button"
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiTrash2 size={15} />
              )}
              <span>{isDeleting ? t("deleteModalDeleting") : t("deleteModalConfirm")}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
