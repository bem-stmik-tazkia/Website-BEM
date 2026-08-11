"use client";

import React from "react";
import { FiFileText } from "react-icons/fi";
import { motion } from "framer-motion";

interface DashboardCardPanelProps {
  children: React.ReactNode;
}

export default function DashboardCardPanel({ children }: DashboardCardPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="bg-surface rounded-3xl shadow-sm border border-outline-variant/30 p-6 md:p-8 relative z-20"
    >
      <motion.h2
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2"
      >
        <FiFileText className="text-[var(--color-secondary)]" /> Karya Saya
      </motion.h2>

      {children}
    </motion.div>
  );
}
