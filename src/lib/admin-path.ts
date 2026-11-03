/**
 * Utilitas Path & Pola Rute Admin (Client-Safe)
 * Modul ini MURNI logika routing dan regex string tanpa membaca environment secret,
 * tanpa dependensi Web Crypto, dan aman di-import oleh Client Components maupun Server.
 */

export const ADMIN_TOKEN_REGEX = /^[A-Za-z0-9_-]{75}$/;

/**
 * Mengecek apakah suatu pathname merupakan halaman login admin,
 * baik URL konvensional (/login) maupun URL token acak 75 karakter (/<token>).
 */
export function isAdminLoginPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Bersihkan parameter query dan hash
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  
  if (cleanPath === '/login' || cleanPath.startsWith('/login/')) {
    return true;
  }

  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length === 1 && ADMIN_TOKEN_REGEX.test(segments[0])) {
    return true;
  }

  return false;
}

