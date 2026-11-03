import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeNextPath } from '@/utils/auth-url';
import { isRandomAdminPathActive, verifyAdminToken } from '@/lib/admin-token';
import { ADMIN_TOKEN_REGEX } from '@/lib/admin-path';

/**
 * D13: Timing-safe string comparison to prevent timing attacks on bypass secret.
 * Fails closed (returns false) if either value is falsy or lengths differ.
 */
function isTimingSafeMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function updateSession(request: NextRequest, customSupabase?: any) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isRandomActive = isRandomAdminPathActive();
  const tokenCandidate = pathname.slice(1);
  const isTokenPath = isRandomActive && pathname.length === 76 && pathname.startsWith('/') && ADMIN_TOKEN_REGEX.test(tokenCandidate);

  // Rute yang membutuhkan verifikasi token via getUser() atau token rewrite
  const isApiAdmin = pathname.startsWith('/api/admin');
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isMasukRoute = pathname === '/masuk' || pathname.startsWith('/masuk/');
  const isProtectedRoute = isApiAdmin || isAdminRoute || isLoginRoute || isDashboardRoute || isMasukRoute || isTokenPath;

  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  // 1. Tangani Rute Token Admin Acak 75 Karakter (Hanya jika flag aktif)
  if (isTokenPath) {
    const isValid = await verifyAdminToken(tokenCandidate);
    if (isValid) {
      // Rewrite internal ke halaman login admin (URL di browser tetap acak)
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.rewrite(url, { headers: supabaseResponse.headers });
    }
    // Token tidak valid atau kedaluwarsa: respons 404 Not Found
    const notFoundUrl = new URL('/not-found', request.url);
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  const supabase = customSupabase || createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Menggunakan supabase.auth.getUser() untuk validasi token resmi ke Supabase Auth
  // Mencegah spoofing session atau manipulasi klaim client
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[Middleware] Supabase getUser failed (network issue?):', err);
  }

  // 2. Protect /api/admin routes — API returns 401/403 JSON instead of redirecting
  if (isApiAdmin) {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const { data: isRpcAdmin } = await supabase.rpc('is_admin');
      if (isRpcAdmin !== true) {
        return new NextResponse(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.error('[Middleware] Supabase is_admin check for API admin failed:', err);
      return new NextResponse(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return supabaseResponse;
  }

  // 3. Protect /admin routes — HANYA admin sah yang dapat mengakses.
  //    Bagi non-admin / mahasiswa: memberikan respons 404 (rewrite ke /not-found)
  //    sehingga path admin benar-benar tersembunyi.
  if (isAdminRoute) {
    if (!user) {
      const bypassCookie = request.cookies.get('maintenance_bypass')?.value;
      const expectedSecret = process.env.MAINTENANCE_BYPASS_SECRET;
      const isBypassValid = Boolean(expectedSecret && bypassCookie && isTimingSafeMatch(bypassCookie, expectedSecret));

      if (isBypassValid && !isRandomActive) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(url);
      } else {
        // Tanpa bypass valid atau saat random path aktif: 404 Not Found
        const notFoundUrl = new URL('/not-found', request.url);
        return NextResponse.rewrite(notFoundUrl, { status: 404 });
      }
    }

    // Periksa status admin pengguna
    try {
      const { data: isRpcAdmin } = await supabase.rpc('is_admin');
      if (isRpcAdmin !== true) {
        // Mahasiswa / non-admin yang login: respons 404 Not Found
        const notFoundUrl = new URL('/not-found', request.url);
        return NextResponse.rewrite(notFoundUrl, { status: 404 });
      }
    } catch (err) {
      console.error('[Middleware] Supabase is_admin check failed:', err);
      const notFoundUrl = new URL('/not-found', request.url);
      return NextResponse.rewrite(notFoundUrl, { status: 404 });
    }
  }

  // 4. Protect /dashboard routes — HANYA untuk mahasiswa (sesi admin ditolak dan dialihkan ke /admin)
  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/masuk';
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    try {
      const { data: isRpcAdmin } = await supabase.rpc('is_admin');
      if (isRpcAdmin === true) {
        // Sesi admin dilarang di /dashboard/*: redirect ke /admin
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error('[Middleware] Supabase is_admin check for dashboard failed:', err);
    }

    return supabaseResponse;
  }

  // 5. Handle /masuk route — jika sudah login, langsung alihkan ke dashboard / admin
  if (isMasukRoute) {
    if (user) {
      const url = request.nextUrl.clone();
      const nextParam = request.nextUrl.searchParams.get('next');

      let isUserAdmin = false;
      try {
        const { data: isRpcAdmin } = await supabase.rpc('is_admin');
        isUserAdmin = isRpcAdmin === true;
      } catch {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        isUserAdmin = profile?.role === 'admin';
      }

      if (isUserAdmin) {
        const safeNext = sanitizeNextPath(nextParam, request.nextUrl.origin, ['/admin']);
        url.pathname = safeNext || '/admin';
      } else {
        const safeNext = sanitizeNextPath(nextParam, request.nextUrl.origin, ['/dashboard']);
        url.pathname = safeNext || '/dashboard/artikel';
      }
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 6. Protect /login route:
  // Jika random path aktif: akses langsung ke /login menghasilkan 404 Not Found
  // Jika tidak aktif (default): HANYA bisa diakses jika sudah memasukkan Konami code
  if (isLoginRoute) {
    if (isRandomActive) {
      // Akses langsung ke /login dilarang saat random path aktif -> 404
      const notFoundUrl = new URL('/not-found', request.url);
      return NextResponse.rewrite(notFoundUrl, { status: 404 });
    }

    if (user) {
      const url = request.nextUrl.clone();
      const nextParam = request.nextUrl.searchParams.get('next');

      let isUserAdmin = false;
      try {
        const { data: isRpcAdmin } = await supabase.rpc('is_admin');
        isUserAdmin = isRpcAdmin === true;
      } catch {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        isUserAdmin = profile?.role === 'admin';
      }

      if (isUserAdmin) {
        const safeNext = sanitizeNextPath(nextParam, request.nextUrl.origin, ['/admin']);
        url.pathname = safeNext || '/admin';
      } else {
        const safeNext = sanitizeNextPath(nextParam, request.nextUrl.origin, ['/dashboard']);
        url.pathname = safeNext || '/dashboard/artikel';
      }
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }

    const bypassCookie = request.cookies.get('maintenance_bypass')?.value;
    const expectedSecret = process.env.MAINTENANCE_BYPASS_SECRET;
    const isBypassValid = Boolean(expectedSecret && bypassCookie && isTimingSafeMatch(bypassCookie, expectedSecret));

    if (!isBypassValid) {
      // Mengetik /login di URL tanpa Konami code ditolak dan diarahkan ke homepage
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
