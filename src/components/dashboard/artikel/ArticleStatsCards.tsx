"use client";

import React from "react";
import { FiBookOpen, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface StatsProps {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  draft: number;
}

export default function ArticleStatsCards({
  total,
  published,
  pending,
  rejected,
  draft,
}: StatsProps) {
  const t = useTranslations("DashboardArtikel");

  const cards = [
    {
      label: t("statTotal"),
      value: total,
      desc: t("statTotalDesc"),
      icon: FiBookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: t("statPublished"),
      value: published,
      desc: t("statPublishedDesc"),
      icon: FiCheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: t("statPending"),
      value: pending,
      desc: t("statPendingDesc"),
      icon: FiClock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: t("statRejected"),
      value: rejected,
      desc: t("statRejectedDesc"),
      icon: FiAlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl bg-surface border border-outline-variant/30 hover:${card.border} transition-all duration-200 shadow-sm flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-on-surface-variant line-clamp-1">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}
              >
                <Icon size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mb-1">
                {card.value}
              </div>
              <p className="text-[11px] text-on-surface-variant/70 line-clamp-1">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
