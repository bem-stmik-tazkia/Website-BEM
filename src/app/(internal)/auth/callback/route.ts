import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sanitizeNextPath } from '@/utils/auth-url';

export async function handleAuthCallback(request: NextRequest, customSupabase?: any) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');
  const nextParam = searchParams.get('next');

  // Use Next.js built-in nextUrl which correctly resolves Vercel's internal routing
  const publicOrigin = request.nextUrl.origin;

  // Tentukan apakah request ini berasal dari alur admin (/admin)
  const isAdminFlow = Boolean(
    nextParam && sanitizeNextPath(nextParam, publicOrigin, ['/admin'])
  );

  // Helper redirect error tanpa membocorkan rute admin.
  // Semua kegagalan mahasiswa menggunakan satu kode generik (?error=login_failed)
  const getErrorRedirect = () => {
    if (isAdminFlow) {
      // Alur admin tidak boleh diarahkan ke /login (yang 404 pada URL acak) atau membocorkan admin
      return NextResponse.redirect(new URL('/', publicOrigin));
    }
    const redirectUrl = new URL('/masuk', publicOrigin);
    redirectUrl.searchParams.set('error', 'login_failed');
    return NextResponse.redirect(redirectUrl);
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
    const cookieStore = await cookies();
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
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
  const { data: isRpcAdmin } = await supabase.rpc('is_admin');
  const isAdmin = isRpcAdmin === true;

  if (isAdminFlow) {
    // Alur Admin (dimulai dari login admin via Konami dengan next=/admin)
    if (isAdmin) {
      // Admin sah: lolos is_admin() -> arahkan ke /admin
      const safeNext = sanitizeNextPath(nextParam, publicOrigin, ['/admin']);
      const destination = safeNext || '/admin';
      return NextResponse.redirect(new URL(destination, publicOrigin));
    }

    // Bukan admin di alur admin: kembalikan PERILAKU ASLI:
    // signOut dan arahkan keluar ke beranda secara diam tanpa pesan atau parameter
    console.warn('[auth/callback] Non-admin user attempted admin login flow. Signing out.');
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/', publicOrigin));
  }

  // 6. Alur Mahasiswa (dimulai dari /masuk):
  // Jika akun lolos is_admin(), TOLAK: signOut dan arahkan ke /masuk?error=login_failed,
  // yaitu alamat tujuan dan pesan yang SAMA PERSIS dengan penolakan akun non-kampus.
  if (isAdmin) {
    console.warn('[auth/callback] Admin account attempted student login flow. Rejecting.');
    await supabase.auth.signOut();
    return getErrorRedirect();
  }

  // Akun mahasiswa sah: arahkan ke /dashboard/artikel
  const safeNext = sanitizeNextPath(nextParam, publicOrigin, ['/dashboard']);
  const destination = safeNext || '/dashboard/artikel';
  return NextResponse.redirect(new URL(destination, publicOrigin));
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
