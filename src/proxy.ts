import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './utils/supabase/supabase-middleware';
import { isRandomAdminPathActive } from './lib/admin-token';
import { ADMIN_TOKEN_REGEX } from './lib/admin-path';

const handleI18nRouting = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 0. Jika URL admin tidak sengaja memiliki prefix bahasa (misal /en/admin/artikel atau /id/admin/...),
  // langsung redirect bersih ke /admin/... tanpa prefix agar tidak 404
  const pathname = request.nextUrl.pathname;
  const localeAdminMatch = pathname.match(/^\/(?:id|en|ar|fr|ja)(\/admin(?:\/.*)?)$/);
  if (localeAdminMatch) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = localeAdminMatch[1];
    return NextResponse.redirect(cleanUrl);
  }

  // 1. Jalankan Supabase middleware untuk proteksi route, auth, dan refresh token
  const supabaseResponse = await updateSession(request);
  
  // Jika Supabase melakukan redirect atau merespons status selain 200 (misal 401, 403, 404, 429), langsung return
  if (supabaseResponse.headers.get('location') || supabaseResponse.status !== 200) {
    return supabaseResponse;
  }

  // 2. Cek apakah ini route internal murni (admin/api/auth) yang TIDAK butuh multi-bahasa
  const isRandomActive = isRandomAdminPathActive();
  const isTokenPath = isRandomActive && pathname.startsWith('/') && ADMIN_TOKEN_REGEX.test(pathname.slice(1));
  const isInternalRoute = isTokenPath ||
                          pathname.startsWith('/admin') || 
                          pathname.startsWith('/login') || 
                          pathname.startsWith('/masuk') || 
                          pathname.startsWith('/auth') ||
                          pathname.startsWith('/api');

  if (isInternalRoute) {
    return supabaseResponse;
  }

  // 3. Untuk halaman publik dan dashboard mahasiswa, jalankan next-intl middleware (Mendukung Multi-Bahasa)
  const intlResponse = handleI18nRouting(request);
  
  // Gabungkan cookie dari Supabase (jika ada refresh session) ke response next-intl
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  });

  return intlResponse;
}

export const config = {
  // Matcher Next.js: mencakup /admin, /api/admin, /masuk untuk perlindungan auth,
  // serta seluruh halaman aplikasi termasuk dashboard multi-bahasa.
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/masuk',
    '/((?!api|_vercel|_next/static|_next/image|storage|favicon.ico|images|icons|.*\\..*).*)',
  ],
};
