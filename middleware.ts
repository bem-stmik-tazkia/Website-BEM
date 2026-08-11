import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes yang TIDAK perlu locale (internal/admin routes)
const INTERNAL_PATHS = ['/admin', '/login', '/auth'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Biarkan internal routes (admin, login, auth) jalan tanpa locale
  const isInternal = INTERNAL_PATHS.some(p => pathname.startsWith(p));
  if (isInternal) {
    return NextResponse.next();
  }

  // Untuk semua route lainnya, jalankan next-intl middleware
  // Ini yang akan otomatis redirect /dashboard → /id/dashboard
  return intlMiddleware(request);
}

export const config = {
  // Match semua route kecuali _next static files, images, favicon, api
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
