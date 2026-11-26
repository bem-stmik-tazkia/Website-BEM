import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sanitizeNextPath, STUDENT_ALLOWED_NEXT_PREFIXES } from '@/utils/auth-url';

export async function handleAuthCallback(request: NextRequest, customSupabase?: any) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');
  const cookieStore = await cookies();
  const rawCookieNext = cookieStore.get('auth_next')?.value;
  let decodedCookieNext: string | null = null;
  if (rawCookieNext) {
    try {
      decodedCookieNext = decodeURIComponent(rawCookieNext);
    } catch {
      decodedCookieNext = rawCookieNext;
    }
  }
  const nextParam = searchParams.get('next') || decodedCookieNext;
  const flowCookie = cookieStore.get('auth_flow')?.value;

  // Use Next.js built-in nextUrl which correctly resolves Vercel's internal routing
  const publicOrigin = request.nextUrl.origin;

  const pendingAuthCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const redirectClean = (url: URL) => {
    const res = NextResponse.redirect(url);
    pendingAuthCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    });
    res.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
    res.cookies.set('auth_flow', '', { path: '/', maxAge: 0 });
    return res;
  };

  // Tentukan apakah request ini berasal dari alur admin (/admin)
  const isAdminFlow =
    flowCookie === 'admin' ||
    Boolean(nextParam && sanitizeNextPath(nextParam, publicOrigin, ['/admin']));

  // Helper redirect error tanpa membocorkan rute admin.
  // Semua kegagalan mahasiswa menggunakan satu kode generik (?error=login_failed)
  const getErrorRedirect = () => {
    if (isAdminFlow) {
      // Alur admin tidak boleh diarahkan ke /login (yang 404 pada URL acak) atau membocorkan admin
      return redirectClean(new URL('/', publicOrigin));
    }
    const redirectUrl = new URL('/masuk', publicOrigin);
    redirectUrl.searchParams.set('error', 'login_failed');
    return redirectClean(redirectUrl);
  };

  // 1. Periksa parameter error / error_description SEBELUM exchangeCodeForSession
  if (errorParam || errorDesc) {
    console.warn('[auth/callback] OAuth error param received:', { errorParam, errorDesc });
    return getErrorRedirect();
  }

  // 2. Jika tidak ada authorization code
  if (!code) {
    return getErrorRedirect();
  }

  let supabase = customSupabase;
  if (!supabase) {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((cookie) => {
              pendingAuthCookies.push(cookie);
            });
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored when called from Server Component / Middleware refresh
            }
          },
        },
      }
    );
  }

  // 3. Tukar code untuk mendapatkan session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[auth/callback] Code exchange failed:', exchangeError.message);
    // Hapus sesi jika sempat terbentuk parsial
    await supabase.auth.signOut();
    return getErrorRedirect();
  }

  // 4. Verifikasi pengguna yang terautentikasi
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return getErrorRedirect();
  }

  // 5. Periksa hak akses Admin via RPC is_admin() (canonical source of truth: public.admins)
  let isAdmin = false;
  try {
    const { data: isRpcAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError) {
      console.warn('[auth/callback] is_admin() RPC returned error:', rpcError.message);
    } else {
      isAdmin = isRpcAdmin === true;
    }
  } catch (rpcException) {
    console.error('[auth/callback] is_admin() RPC threw exception:', rpcException);
    // Fail-open untuk mahasiswa: jika RPC crash, anggap bukan admin
    // Otorisasi /admin/* tetap fail-closed di middleware
    isAdmin = false;
  }

  if (isAdminFlow) {
    // Alur Admin (dimulai dari login admin via Konami)
    if (isAdmin) {
      // Admin sah: lolos is_admin() -> arahkan ke /admin atau target valid
      const safeNext = sanitizeNextPath(nextParam, publicOrigin, ['/admin', ...STUDENT_ALLOWED_NEXT_PREFIXES]);
      const destination = safeNext || '/admin';
      return redirectClean(new URL(destination, publicOrigin));
    }

    // Bukan admin di alur admin: kembalikan PERILAKU ASLI:
    // signOut dan arahkan keluar ke beranda secara diam tanpa pesan atau parameter
    console.warn('[auth/callback] Non-admin user attempted admin login flow. Signing out.');
    await supabase.auth.signOut();
    return redirectClean(new URL('/', publicOrigin));
  }

  // 6. Alur Mahasiswa (dimulai dari /masuk):
  // Jika akun lolos is_admin(), TOLAK: signOut dan arahkan ke /masuk?error=login_failed,
  // yaitu alamat tujuan dan pesan yang SAMA PERSIS dengan penolakan akun non-kampus.
  if (isAdmin) {
    console.warn('[auth/callback] Admin account attempted student login flow. Rejecting.');
    await supabase.auth.signOut();
    return getErrorRedirect();
  }

  // Akun mahasiswa sah: arahkan ke tujuan aman (dashboard, buat artikel, atau halaman daftar agenda)
  const safeNext = sanitizeNextPath(nextParam, publicOrigin, STUDENT_ALLOWED_NEXT_PREFIXES);
  const destination = safeNext || '/dashboard';
  return redirectClean(new URL(destination, publicOrigin));
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
