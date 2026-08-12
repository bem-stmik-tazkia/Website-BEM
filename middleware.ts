import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only locale-prefixed routes and root — exclude admin, login, auth, api, and static files
  matcher: [
    // Match root
    '/',
    // Match locale-prefixed paths like /en/... /id/...
    '/(id|en|ar|ja|fr)/:path*',
    // Also match non-locale paths that should be redirected (except admin/login/auth/api/static)
    '/((?!admin|login|auth|api|_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};

