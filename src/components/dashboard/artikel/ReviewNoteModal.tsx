"use client";

import React from "react";
import { FiAlertCircle, FiX, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  note: string | null;
}

export default function ReviewNoteModal({ isOpen, onClose, title, note }: Props) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Catatan Review Admin</h3>
                <p className="text-xs text-on-surface-variant truncate max-w-[240px]">
                  {title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-variant/40 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Note Content */}
          <div className="bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-4 mb-5">
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1.5">
              Umpan Balik Moderator:
            </p>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {note || "Tidak ada catatan spesifik dari administrator."}
            </p>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

