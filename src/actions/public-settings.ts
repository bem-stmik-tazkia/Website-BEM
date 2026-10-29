"use server";

import { getServiceRoleClient } from "@/lib/auth";

/**
 * Server Action: Mengambil nomor kontak WhatsApp admin dari system_settings
 * untuk tombol kontak publik di FloatingActionMenu.
 */
export async function getAdminWhatsappContact(): Promise<string> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "admin_whatsapp")
      .maybeSingle();

    return data?.value || "";
  } catch (error) {
    console.error("[public-settings] Gagal mengambil nomor WhatsApp admin:", error);
    return "";
  }
}

/**
 * Server Action: Mengambil status maintenance publik untuk layout wrapper.
 */
export async function getPublicMaintenanceSettings(): Promise<{
  maintenanceMode: boolean;
  estimatedTime: string;
  message: string;
  releaseNotes: string | null;
}> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "maintenance_estimated_time", "maintenance_message", "release_notes"]);

    if (!error && data) {
      const mMode = data.find((s) => s.key === "maintenance_mode")?.value === "true";
      const mTime = data.find((s) => s.key === "maintenance_estimated_time")?.value || "1-2 Jam";
      const mMsg = data.find((s) => s.key === "maintenance_message")?.value || "";
      const rNotesStr = data.find((s) => s.key === "release_notes")?.value || null;

      return {
        maintenanceMode: mMode,
        estimatedTime: mTime,
        message: mMsg,
        releaseNotes: rNotesStr,
      };
    }
  } catch (error) {
    console.error("[public-settings] Gagal mengambil status maintenance:", error);
  }

  return {
    maintenanceMode: false,
    estimatedTime: "1-2 Jam",
    message: "",
    releaseNotes: null,
  };
}
