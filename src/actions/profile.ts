"use server";

import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";

export interface UpdateProfileInput {
  full_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export async function updateMyProfile(input: UpdateProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }

    // 1. Sanitasi dan validasi keamanan
    const cleanName = input.full_name?.trim().slice(0, 80) || undefined;
    const cleanBio = input.bio !== undefined ? (input.bio ? input.bio.trim().slice(0, 300) : null) : undefined;
    let cleanAvatar = input.avatar_url?.trim() || null;

    if (cleanAvatar && !cleanAvatar.startsWith("http://") && !cleanAvatar.startsWith("https://")) {
      return { error: "Format URL foto profil tidak valid." };
    }

    const service = getServiceRoleClient();

    // 2. Siapkan payload pembaruan (Role & Email TERKUNCI & TIDAK BISA DIUBAH)
    const updatePayload: Record<string, any> = {};
    if (cleanName) updatePayload.full_name = cleanName;
    if (cleanAvatar !== undefined) updatePayload.avatar_url = cleanAvatar;
    if (cleanBio !== undefined) updatePayload.bio = cleanBio;

    // 3. Eksekusi pembaruan ke public.profiles
    const { error: updateError } = await service
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (updateError) {
      // Jika kolom 'bio' belum dibuat di DB Supabase, lakukan fallback tanpa bio
      if (updateError.message?.includes("bio") || updateError.code === "PGRST204") {
        delete updatePayload.bio;
        const { error: fallbackError } = await service
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id);

        if (fallbackError) {
          throw new Error(fallbackError.message);
        }
      } else {
        throw new Error(updateError.message);
      }
    }

    // 4. Sinkronisasi metadata auth.users
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName || user.user_metadata?.full_name,
          avatar_url: cleanAvatar,
        },
      });
    } catch (metaErr) {
      console.warn("[updateMyProfile] Warning saat update auth metadata:", metaErr);
    }

    return {
      success: true,
      profile: {
        id: user.id,
        full_name: cleanName,
        avatar_url: cleanAvatar,
        bio: cleanBio,
      },
    };
  } catch (err: any) {
    console.error("[actions:updateMyProfile] Error:", err);
    return { error: err.message || "Gagal memperbarui profil." };
  }
}

