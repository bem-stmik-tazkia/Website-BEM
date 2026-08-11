import React from "react";
import { createClient } from "@/utils/supabase/server";
import { KabinetProfile } from "@/types/kabinet";
import KabinetContentClient from "@/components/kabinet/KabinetContentClient";
import { getTranslations } from "next-intl/server";

export default async function KabinetPage() {
  const supabase = await createClient();
  const t = await getTranslations("KabinetPage");
  
  const { data: kabinet, error } = await supabase
    .from("kabinet_profiles")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error || !kabinet) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-on-background mb-4">{t("notAvailableTitle")}</h1>
        <p className="text-on-surface-variant">{t("notAvailableDesc")}</p>
      </div>
    );
  }

  const profile = kabinet as KabinetProfile;

  return <KabinetContentClient profile={profile} />;
}
