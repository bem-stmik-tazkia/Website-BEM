"use server";

import { requireAdmin } from "@/lib/auth";
import { KabinetProfile } from "@/types/kabinet";
import { revalidatePath, revalidateTag } from "next/cache";

export async function saveKabinetProfile(
  profile: KabinetProfile
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { supabase } = await requireAdmin();

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
      await supabase
        .from("kabinet_profiles")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { error } = await supabase
        .from("kabinet_profiles")
        .insert({
          ...profile,
          is_active: true,
        });

      if (error) throw new Error(error.message);
    }

    try {
      revalidatePath("/kabinet");
      revalidatePath("/[locale]/kabinet", "page");
      revalidatePath("/admin/kabinet");
      revalidateTag("kabinet", "max");
    } catch (revalErr) {
      console.warn("[saveKabinetProfile] Revalidation warning:", revalErr);
    }

    return { success: true };
  } catch (err) {
    console.error("[saveKabinetProfile] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan profil kabinet.",
    };
  }
}
