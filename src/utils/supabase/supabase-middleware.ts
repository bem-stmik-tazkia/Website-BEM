import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname;

  // Untuk halaman publik (bukan /admin dan /login), skip getUser() ke Supabase API.
  // Ini mencegah error "fetch failed" saat koneksi lambat, dan mempercepat halaman publik.
  const isProtectedRoute = pathname.startsWith('/admin') || pathname === '/login';
  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT use supabase.auth.getSession() here!
  // getUser() memvalidasi token ke Supabase API (tidak bisa di-spoof).
  // Dibungkus try-catch agar jika Supabase tidak bisa dijangkau (timeout/offline),
  // halaman publik tetap dapat diakses alih-alih crash dengan error 500.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Supabase tidak bisa dijangkau — lanjutkan sebagai guest
    // Route yang dilindungi (/admin) akan tetap di-redirect ke /login
    console.error('[Middleware] Supabase getUser failed (network issue?):', err);
  }

  // Protect /admin routes — only admin users can access
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Not logged in — hanya izinkan redirect ke /login jika sudah memasukkan Konami code
      const bypassCookie = request.cookies.get('maintenance_bypass')?.value;
      const expectedSecret = process.env.MAINTENANCE_BYPASS_SECRET || 'bem-bypass-2025-xK9mP7qR';
      const isBypassValid = bypassCookie && (bypassCookie === expectedSecret || bypassCookie.length > 0);

      const url = request.nextUrl.clone();
      if (isBypassValid) {
        url.pathname = '/login';
        url.searchParams.set('next', request.nextUrl.pathname);
      } else {
        // Tanpa Konami code, jangan bocorkan route login
        url.pathname = '/';
      }
      return NextResponse.redirect(url);
    }

    // Check if user is admin
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'admin') {
        // Non-admin — redirect to home
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (err) {
      // Gagal cek role — amankan dengan redirect ke home
      console.error('[Middleware] Supabase profile check failed:', err);
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Protect /login route: HANYA bisa diakses jika sudah memasukkan Konami code (bypass cookie),
  // atau jika sudah login sebagai admin (langsung redirect ke /admin).
  // Mengetikkan /login di URL secara langsung tanpa Konami code akan ditolak dan diarahkan ke home.
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/login/')) {
    // 1. Jika sudah login, jangan izinkan buka halaman login lagi
    if (user) {
      const url = request.nextUrl.clone()
      const nextPath = request.nextUrl.searchParams.get('next')

      if (nextPath) {
        url.pathname = nextPath
        url.searchParams.delete('next')
      } else {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          // Only admins use the login page — always go to /admin
          url.pathname = profile?.role === 'admin' ? '/admin' : '/'
        } catch (err) {
          console.error('[Middleware] Supabase profile check (login) failed:', err);
          url.pathname = '/'
        }
      }

      return NextResponse.redirect(url)
    }

    // 2. Jika belum login: WAJIB memiliki cookie hasil input Konami code
    const bypassCookie = request.cookies.get('maintenance_bypass')?.value;
    const expectedSecret = process.env.MAINTENANCE_BYPASS_SECRET || 'bem-bypass-2025-xK9mP7qR';
    const isBypassValid = bypassCookie && (bypassCookie === expectedSecret || bypassCookie.length > 0);

    if (!isBypassValid) {
      // Pengguna mengetik /login di URL tanpa Konami code — tolak dan arahkan ke homepage
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
