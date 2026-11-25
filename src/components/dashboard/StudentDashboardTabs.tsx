"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FiGrid, FiCalendar, FiEdit3 } from "react-icons/fi";

export default function StudentDashboardTabs() {
  const pathname = usePathname();
  const t = useTranslations("StudentDashboard");

  // Sembunyikan header & tab saat berada di halaman editor artikel (/baru atau /[id]/edit)
  const isEditorPage =
    pathname.startsWith("/dashboard/artikel/baru") ||
    pathname.endsWith("/edit");

  if (isEditorPage) {
    return null;
  }

  const tabs = [
    {
      href: "/dashboard" as const,
      label: t("tabOverview"),
      icon: FiGrid,
      active: pathname === "/dashboard" || pathname === "/dashboard/",
    },
    {
      href: "/dashboard/kegiatan" as const,
      label: t("tabActivities"),
      icon: FiCalendar,
      active: pathname.startsWith("/dashboard/kegiatan"),
    },
    {
      href: "/dashboard/artikel" as const,
      label: t("tabArticles"),
      icon: FiEdit3,
      active: pathname.startsWith("/dashboard/artikel"),
    },
  ];

  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          {t("pageSubtitle")}
        </p>
      </div>

      <nav
        aria-label={t("pageTitle")}
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-outline-variant/30"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                tab.active
                  ? "border-primary text-primary bg-primary/[0.06]"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
