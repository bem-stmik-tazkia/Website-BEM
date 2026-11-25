import "server-only";
import { createClient } from "@/utils/supabase/server";

export interface ProfilePageData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  googleAvatarUrl: string | null;
  bio: string;
  role: string;
}

export async function getCurrentProfileData(): Promise<ProfilePageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const googleAvatar =
    (user.user_metadata?.picture as string | undefined) ||
    (user.user_metadata?.avatar_url as string | undefined) ||
    null;

  let fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "";
  let avatarUrl = googleAvatar || "";
  let bio = "";
  let role = "mahasiswa";

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, bio, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      if (profile.full_name) fullName = profile.full_name;
      if (profile.avatar_url) avatarUrl = profile.avatar_url;
      if (profile.bio) bio = profile.bio;
      if (profile.role) role = profile.role;
    }

    const { data: isRpcAdmin } = await supabase.rpc("is_admin");
    if (isRpcAdmin === true) {
      role = "admin";
    } else if (role === "admin") {
      role = "mahasiswa";
    }
  } catch {
    // Gunakan fallback metadata auth
  }

  return {
    id: user.id,
    email: user.email || "",
    fullName,
    avatarUrl,
    googleAvatarUrl: googleAvatar,
    bio,
    role,
  };
}
