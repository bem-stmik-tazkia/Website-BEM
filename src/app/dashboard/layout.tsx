import React from "react";
import DashboardBottomNav from "./DashboardBottomNav";
import DashboardTopbar from "./DashboardTopbar";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Dashboard Mahasiswa - BEM STMIK Tazkia",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-surface-variant/20 flex flex-col relative pb-24">
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <DashboardTopbar user={user} />
        <div className="p-4 md:p-8 pt-24 md:pt-28 flex-1">
          {children}
        </div>
      </main>

      {/* Interactive Floating Bottom Nav */}
      <DashboardBottomNav />
    </div>
  );
}
