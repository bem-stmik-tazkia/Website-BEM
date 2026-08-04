import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardKaryaList from "../DashboardKaryaList";
import DashboardHeader from "../DashboardHeader";
import DashboardCardPanel from "../DashboardCardPanel";
import CarAnimation from "../CarAnimation";

export const revalidate = 0;

export default async function DashboardKaryaPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's karya (owned OR collaborated)
  const { data: karyaList } = await supabase
    .from("karya")
    .select("*")
    .or(`user_id.eq.${user.id},team.cs.[{"user_id":"${user.id}"}]`)
    .order("created_at", { ascending: false });

  return (
    <div className="w-full">
      <div className="w-full">
        
        {/* Header — animated client component */}
        <DashboardHeader name={profile?.full_name || 'User'} />

        <div className="relative mt-8">
          <CarAnimation />
          <DashboardCardPanel>
            <DashboardKaryaList initialKaryaList={karyaList || []} />
          </DashboardCardPanel>
        </div>
      </div>
    </div>
  );
}
