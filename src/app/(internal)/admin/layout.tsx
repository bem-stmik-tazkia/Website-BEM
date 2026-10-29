import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { getAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard - BEM STMIK Tazkia",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/login');
  }

  const { user } = admin;

  return (
    <div className="min-h-screen bg-surface-variant/20 flex flex-col md:flex-row">
      {/* Sidebar wrapper: relative and z-50 so it sits ABOVE AdminTopbar (z-40) */}
      <div className="relative shrink-0 z-50">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <AdminTopbar user={user} />
        <div className="p-5 md:p-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
