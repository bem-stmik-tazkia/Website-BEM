"use client";

import React from "react";
import { FiSearch, FiFilter } from "react-icons/fi";

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
  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "published", label: "Tayang", count: counts.published },
    { key: "pending", label: "Menunggu", count: counts.pending },
    { key: "draft", label: "Draf", count: counts.draft },
    { key: "rejected", label: "Perlu Revisi", count: counts.rejected },
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
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari judul artikel..."
          className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-surface border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60 shadow-sm"
        />
      </div>
    </div>
  );
}

