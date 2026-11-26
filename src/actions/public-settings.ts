"use server";

import { getServiceRoleClient } from "@/lib/auth";
import { unstable_cache } from "next/cache";

const getCachedSystemSettingsMap = unstable_cache(
  async () => {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "admin_whatsapp",
        "maintenance_mode",
        "maintenance_estimated_time",
        "maintenance_message",
        "release_notes",
      ]);

    if (error || !data) {
      return {} as Record<string, string>;
    }

    return data.reduce((acc, row) => {
      if (row.key && typeof row.value === "string") {
        acc[row.key] = row.value;
      }
      return acc;
    }, {} as Record<string, string>);
  },
  ["public-system-settings"],
  { revalidate: 30, tags: ["system-settings"] }
);

/**
 * Server Action: Mengambil nomor kontak WhatsApp admin dari system_settings
 * untuk tombol kontak publik di FloatingActionMenu.
 */
export async function getAdminWhatsappContact(): Promise<string> {
  try {
    const map = await getCachedSystemSettingsMap();
    return map["admin_whatsapp"] || "";
  } catch (error) {
    console.error("[public-settings] Gagal mengambil nomor WhatsApp admin:", error);
    return "";
  }
}

/**
 * Server Action: Mengambil status maintenance publik untuk layout wrapper (ter-cache 30 detik).
 */
export async function getPublicMaintenanceSettings(): Promise<{
  maintenanceMode: boolean;
  estimatedTime: string;
  message: string;
  releaseNotes: string | null;
}> {
  try {
    const map = await getCachedSystemSettingsMap();
    return {
      maintenanceMode: map["maintenance_mode"] === "true",
      estimatedTime: map["maintenance_estimated_time"] || "1-2 Jam",
      message: map["maintenance_message"] || "",
      releaseNotes: map["release_notes"] || null,
    };
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

/**
 * Server Action: Membaca status maintenance langsung tanpa cache (dipakai saat event Realtime masuk).
 */
export async function getFreshPublicMaintenanceSettings(): Promise<{
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
      .in("key", [
        "maintenance_mode",
        "maintenance_estimated_time",
        "maintenance_message",
        "release_notes",
      ]);

    if (!error && data) {
      return {
        maintenanceMode: data.find((s) => s.key === "maintenance_mode")?.value === "true",
        estimatedTime: data.find((s) => s.key === "maintenance_estimated_time")?.value || "1-2 Jam",
        message: data.find((s) => s.key === "maintenance_message")?.value || "",
        releaseNotes: data.find((s) => s.key === "release_notes")?.value || null,
      };
    }
  } catch (error) {
    console.error("[public-settings] Gagal memuat status maintenance terbaru:", error);
  }

  return getPublicMaintenanceSettings();
}

