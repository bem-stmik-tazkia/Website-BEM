"use server";

import { createClient } from "@/utils/supabase/server";
import { KabinetProfile } from "@/types/kabinet";
import { revalidatePath } from "next/cache";

export async function saveKabinetProfile(profile: KabinetProfile) {
  const supabase = await createClient();
  
  // Update the existing profile or insert if not exists
  if (profile.id) {
    const { error } = await supabase
      .from("kabinet_profiles")
      .update({
        periode: profile.periode,
        nama_kabinet: profile.nama_kabinet,
        visi: profile.visi,
        misi: profile.misi,
        pengurus_inti: profile.pengurus_inti,
        proker_utama: profile.proker_utama,
        departemen: profile.departemen,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) throw new Error(error.message);
  } else {
    // If no ID, it's a new insertion (e.g. creating next year's cabinet)
    // First, set all others to inactive
    await supabase.from("kabinet_profiles").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000"); // Just a dummy condition to update all

    const { error } = await supabase
      .from("kabinet_profiles")
      .insert({
        ...profile,
        is_active: true,
      });

    if (error) throw new Error(error.message);
  }

  // Revalidate the public kabinet page
  revalidatePath("/kabinet");
  revalidatePath("/admin/kabinet");
  
  return { success: true };
}
