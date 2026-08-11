import React from "react";
import { createClient } from "@/utils/supabase/server";
import KabinetForm from "./KabinetForm";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export default async function AdminKabinetPage() {
  const supabase = await createClient();
  const { data: kabinet, error } = await supabase
    .from("kabinet_profiles")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !kabinet) {
    return (
      <div className="p-6 md:p-10 text-center">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Profil Kabinet Belum Ada</h1>
        <p className="text-on-surface-variant mb-6">Silakan jalankan script migrasi SQL di Supabase terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <RealtimeRefresher table="kabinet_profiles" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Kelola Profil Kabinet</h1>
        <p className="text-on-surface-variant">Update struktur kepengurusan, visi, misi, dan departemen yang sedang aktif.</p>
      </div>

      <KabinetForm initialData={kabinet} />
    </div>
  );
}
