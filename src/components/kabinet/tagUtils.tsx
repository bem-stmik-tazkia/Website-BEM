"use client";

import React from "react";
import { useLocale } from "next-intl";

export const TAG_COLORS: Record<string, string> = {
  Rutin: "bg-emerald-100 text-emerald-700",
  Bulanan: "bg-blue-100 text-blue-700",
  Triwulan: "bg-violet-100 text-violet-700",
  Semester: "bg-amber-100 text-amber-700",
  Semesteran: "bg-amber-100 text-amber-700",
  Tahunan: "bg-rose-100 text-rose-700",
  Insidental: "bg-purple-100 text-purple-700",
  Kondisional: "bg-orange-100 text-orange-700",
  Mingguan: "bg-teal-100 text-teal-700",
  Harian: "bg-cyan-100 text-cyan-700",
};

export const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  Rutin: { id: "Rutin", en: "Routine", ar: "روتيني", fr: "Routinier", ja: "定期的" },
  Bulanan: { id: "Bulanan", en: "Monthly", ar: "شهري", fr: "Mensuel", ja: "毎月" },
  Triwulan: { id: "Triwulan", en: "Quarterly", ar: "فصلي", fr: "Trimestriel", ja: "四半期" },
  Semester: { id: "Semester", en: "Semester", ar: "فصل دراسي", fr: "Semestre", ja: "セメスター" },
  Semesteran: { id: "Semesteran", en: "Semester", ar: "فصل دراسي", fr: "Semestre", ja: "セメスター" },
  Tahunan: { id: "Tahunan", en: "Yearly", ar: "سنوي", fr: "Annuel", ja: "毎年" },
  Insidental: { id: "Insidental", en: "Incidental", ar: "عرضي", fr: "Occasionnel", ja: "臨時" },
  Kondisional: { id: "Kondisional", en: "Conditional", ar: "مشروط", fr: "Conditionnel", ja: "条件付き" },
  Mingguan: { id: "Mingguan", en: "Weekly", ar: "أسبوعي", fr: "Hebdomadaire", ja: "毎週" },
  Harian: { id: "Harian", en: "Daily", ar: "يومي", fr: "Quotidien", ja: "毎日" },
};

export function getLocalizedTag(tag?: string, locale = "id"): string {
  if (!tag || typeof tag !== "string") return "";
  const cleanKey = tag.replace(/[\s\(\)-]/g, "");
  if (!cleanKey) return tag;
  const langKey = locale.slice(0, 2).toLowerCase();
  return TAG_TRANSLATIONS[cleanKey]?.[langKey] || TAG_TRANSLATIONS[cleanKey]?.["en"] || tag;
}

export function ProkerTag({ tag }: { tag?: string }) {
  const locale = useLocale();
  if (!tag || !tag.trim()) return null;
  const label = getLocalizedTag(tag, locale);
  const colorClass = TAG_COLORS[tag] ?? "bg-surface-variant/30 text-on-surface-variant";

  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

