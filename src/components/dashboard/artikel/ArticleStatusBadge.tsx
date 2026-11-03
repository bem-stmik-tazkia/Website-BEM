"use client";

import React from "react";
import { FiCheckCircle, FiClock, FiXCircle, FiFileText } from "react-icons/fi";
import { useTranslations } from "next-intl";

export type ArticleStatus = "published" | "pending" | "rejected" | "draft";

interface Props {
  status: ArticleStatus | string;
  size?: "sm" | "md";
}

export default function ArticleStatusBadge({ status, size = "md" }: Props) {
  const t = useTranslations("DashboardArtikel");
  const isSm = size === "sm";

  switch (status) {
    case "published":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${
            isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          }`}
        >
          <FiCheckCircle className={isSm ? "text-[11px]" : "text-xs"} />
          <span>{t("statusPublished")}</span>
        </span>
      );

    case "pending":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${
            isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          }`}
        >
          <FiClock className={isSm ? "text-[11px]" : "text-xs"} />
          <span>{t("statusPending")}</span>
        </span>
      );

    case "rejected":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${
            isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          }`}
        >
          <FiXCircle className={isSm ? "text-[11px]" : "text-xs"} />
          <span>{t("statusRejected")}</span>
        </span>
      );

    case "draft":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-surface-variant/60 text-on-surface-variant border border-outline-variant/30 ${
            isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          }`}
        >
          <FiFileText className={isSm ? "text-[11px]" : "text-xs"} />
          <span>{t("statusDraft")}</span>
        </span>
      );
  }
}
