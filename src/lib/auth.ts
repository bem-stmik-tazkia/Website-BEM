import 'server-only';
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
export { sanitizeNextPath } from "@/utils/auth-url";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface AdminAuthContext {
  user: User;
  supabase: SupabaseServerClient;
}

export interface AuthUserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface AuthContext {
  user: User;
  profile: AuthUserProfile | null;
  isAdmin: boolean;
  supabase: SupabaseServerClient;
}

/**
 * Creates a server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Must ONLY be used in secure Route Handlers (e.g. background tasks, public form submissions where RLS denies anon).
 * Throws an Error if SUPABASE_SERVICE_ROLE_KEY is not configured, preventing insecure fallbacks to anon key.
 */
export function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Konfigurasi server tidak lengkap: SUPABASE_SERVICE_ROLE_KEY belum diatur.");
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Checks if the current authenticated user has administrative privileges.
 * Uses ONLY the is_admin() RPC which reads the public.admins allowlist (by JWT email).
 * profiles.role is NOT used — it is not the canonical source of truth.
 * B7: Removed profiles.role check to prevent privilege escalation via profile edits.
 */
export async function checkUserIsAdmin(
  supabase: SupabaseServerClient,
  _userId: string
): Promise<boolean> {
  try {
    const { data: isRpcAdmin } = await supabase.rpc("is_admin");
    if (isRpcAdmin === true) {
      return true;
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.error("[auth] Error checking admin status:", err);
  }

  return false;
}

/**
 * Mengambil pengguna yang sedang login saat ini (mahasiswa atau admin).
 * Mengembalikan null jika unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const isAdmin = await checkUserIsAdmin(supabase, user.id);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();

    return { user, profile, isAdmin, supabase };
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.error("[auth] getCurrentUser failed:", err);
    return null;
  }
}

/**
 * Guard otentikasi umum untuk Server Action (mahasiswa atau admin).
 * Melempar error jika pengguna belum login.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getCurrentUser();
  if (!auth) {
    throw new Error("Unauthorized: Sesi login tidak ditemukan atau telah berakhir.");
  }
  return auth;
}

/**
 * Retrieves the current admin user if authenticated and authorized.
 * Returns null if unauthenticated or not an admin.
 * Useful for Server Components and Layouts that need to redirect on failure.
 */
export async function getAdminUser(): Promise<AdminAuthContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const isAdmin = await checkUserIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return null;
    }

    return { user, supabase };
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.error("[auth] getAdminUser failed:", err);
    return null;
  }
}

/**
 * Strict authentication guard for Server Actions and internal server functions.
 * Throws an Error if the user is unauthenticated or not an admin.
 */
export async function requireAdmin(): Promise<AdminAuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized: Sesi tidak valid atau telah berakhir");
  }

  const isAdmin = await checkUserIsAdmin(supabase, user.id);
  if (!isAdmin) {
    throw new Error("Forbidden: Akses hanya untuk administrator");
  }

  return { user, supabase };
}

/**
 * Strict authentication guard for Route Handlers (/api/admin/...).
 * Returns either { authorized: true, user, supabase } or { authorized: false, response: NextResponse }.
 */
export async function verifyAdminApi(): Promise<
  | { authorized: true; user: User; supabase: SupabaseServerClient }
  | { authorized: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdmin = await checkUserIsAdmin(supabase, user.id);
  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, user, supabase };
}
