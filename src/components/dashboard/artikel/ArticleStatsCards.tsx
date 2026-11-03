"use client";

import React from "react";
import { FiBookOpen, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";

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
  const cards = [
    {
      label: "Total Artikel",
      value: total,
      desc: "Semua tulisan Anda",
      icon: FiBookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Tayang / Terbit",
      value: published,
      desc: "Dapat dibaca publik",
      icon: FiCheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Menunggu Moderasi",
      value: pending,
      desc: "Dalam antrean admin",
      icon: FiClock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Perlu Revisi / Ditolak",
      value: rejected,
      desc: "Perlu diperbaiki",
      icon: FiAlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-outline-variant transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs sm:text-sm font-medium text-on-surface-variant truncate">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center shrink-0`}
              >
                <Icon className={`text-base sm:text-lg ${card.color}`} />
              </div>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {card.value}
              </span>
              <p className="text-[11px] text-on-surface-variant/70 mt-0.5 truncate">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

