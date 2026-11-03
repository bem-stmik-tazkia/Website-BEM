import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Artikel Mahasiswa - BEM STMIK Tazkia",
  description: "Kelola, tulis, dan pantau status publikasi artikel mahasiswa STMIK Tazkia.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-variant/20 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}

