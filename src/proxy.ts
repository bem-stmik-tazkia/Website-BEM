import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './utils/supabase/supabase-middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Jalankan Supabase middleware untuk proteksi route, auth, dan refresh token
  const supabaseResponse = await updateSession(request);
  
  // Jika Supabase melakukan redirect atau merespons status selain 200 (misal 401, 403, 429), langsung return
  if (supabaseResponse.headers.get('location') || supabaseResponse.status !== 200) {
    return supabaseResponse;
  }

  // 2. Cek apakah ini route internal atau API yang TIDAK butuh multi-bahasa
  const pathname = request.nextUrl.pathname;
  const isInternalRoute = pathname.startsWith('/admin') || 
                          pathname.startsWith('/login') || 
                          pathname.startsWith('/auth') ||
                          pathname.startsWith('/api');

  if (isInternalRoute) {
    return supabaseResponse;
  }

  // 3. Untuk halaman publik, jalankan next-intl middleware
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
  // Matcher Next.js: mencakup /admin dan /api/admin untuk perlindungan auth,
  // serta seluruh halaman aplikasi kecuali aset statis dan route internal non-admin.
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api|_vercel|_next/static|_next/image|storage|favicon.ico|images|icons|.*\\..*).*)',
  ],
};
