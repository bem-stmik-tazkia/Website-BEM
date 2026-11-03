"use client";

import React from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import { useTranslations } from "next-intl";

export type FilterStatus = "all" | "published" | "pending" | "draft" | "rejected";

interface Props {
  activeTab: FilterStatus;
  onTabChange: (tab: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: {
    all: number;
    published: number;
    pending: number;
    draft: number;
    rejected: number;
  };
}

export default function ArticleFilterTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  counts,
}: Props) {
  const t = useTranslations("DashboardArtikel");

  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: t("tabAll"), count: counts.all },
    { key: "published", label: t("tabPublished"), count: counts.published },
    { key: "pending", label: t("tabPending"), count: counts.pending },
    { key: "draft", label: t("tabDraft"), count: counts.draft },
    { key: "rejected", label: t("tabRejected"), count: counts.rejected },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      {/* Scrollable Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none no-scrollbar -mx-1 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              type="button"
              className={`px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-surface border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-surface-variant text-on-surface-variant"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <FiSearch
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-xs sm:text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
