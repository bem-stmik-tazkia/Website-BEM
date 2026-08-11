import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard - BEM STMIK Tazkia",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
      <div className="min-h-screen bg-surface-variant/20 flex flex-col md:flex-row">
        <AdminSidebar />

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
