import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";

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
    notFound();
  }

  const { user, supabase } = admin;
  let adminProfile: { full_name?: string | null; avatar_url?: string | null; bio?: string | null } | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, bio")
      .eq("id", user.id)
      .maybeSingle();
    adminProfile = data;
  } catch {
    adminProfile = null;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 print:bg-white print:block print:min-h-0 text-slate-900 dark:text-slate-100 print:text-black flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col print:block">
        <AdminTopbar user={user} profile={adminProfile} />
        <div className="p-4 sm:p-6 lg:p-8 print:p-0 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
