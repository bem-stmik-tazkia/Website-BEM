import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './utils/supabase/supabase-middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Jalankan Supabase middleware untuk proteksi route dan refresh token
  const supabaseResponse = await updateSession(request);
  
  // Jika Supabase melakukan redirect (misal dari /admin ke /login), langsung return
  if (supabaseResponse.headers.get('location') || supabaseResponse.status !== 200) {
    if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
      return supabaseResponse;
    }
  }

  // 2. Cek apakah ini route internal yang TIDAK butuh multi-bahasa
  const pathname = request.nextUrl.pathname;
  const isInternalRoute = pathname.startsWith('/admin') || 
                          pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/login') || 
                          pathname.startsWith('/auth');

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
  // Matcher untuk menjalankan middleware ini
  // Skip /api, /_next, /_vercel, dan file statis (berakhiran titik)
  matcher: ['/((?!api|_vercel|_next/static|_next/image|favicon.ico|images|icons|.*\\..*).*)']
};

