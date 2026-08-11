"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import DynamicGreeting from "./DynamicGreeting";

import { useTranslations } from "next-intl";

interface DashboardHeaderProps {
  name: string;
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  const t = useTranslations("DashboardKarya");
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.5, ease: "easeOut" }}
          className="text-3xl font-extrabold text-[var(--color-primary)] mb-2"
        >
          {t("title")}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: "easeOut" }}
          className="flex flex-col gap-1.5"
        >
          <div className="text-on-surface-variant text-base md:text-lg">
            <DynamicGreeting name={name} />
          </div>
          <p className="text-on-surface-variant/80 text-sm md:text-base leading-relaxed">
            {t("desc")}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
      >
        <Link
          href="/dashboard/upload"
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-primary)]/90 transition-all shadow-lg hover:shadow-xl"
        >
          <FiPlus size={20} /> {t("uploadNew")}
        </Link>
      </motion.div>
    </div>
  );
}
