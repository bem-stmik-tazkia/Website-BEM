/**
 * Validasi dan sanitasi parameter `next` URL untuk mencegah serangan Open Redirect.
 * Syarat:
 * 1. Menggunakan new URL(next, origin) untuk memvalidasi struktur URL.
 * 2. Origin harus sama persis dengan origin aplikasi.
 * 3. Pathname harus diawali dengan allowlist awalan (misal: ['/dashboard', '/admin']).
 * 4. Menolak tanda //, /\, dan karakter backslash \ serta skema berbahaya apa pun.
 */
export function sanitizeNextPath(
  next: string | null | undefined,
  origin: string,
  allowedPrefixes: string[] = ['/dashboard', '/admin']
): string | null {
  if (!next || typeof next !== 'string') return null;

  const trimmed = next.trim();
  if (!trimmed) return null;

  // Tolak skema eksplisit, double slash (//), backslash (/ \ atau \), dan kontrol karakter
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return null;
  }

  try {
    // Validasi berbasis new URL(next, origin)
    const parsed = new URL(trimmed, origin);

    // Pastikan origin sama persis (mencegah redirect keluar domain)
    if (parsed.origin !== origin) {
      return null;
    }

    // Pastikan pathname cocok dengan salah satu allowlist
    const pathname = parsed.pathname;
    const isAllowed = allowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (!isAllowed) {
      return null;
    }

    // Kembalikan pathname beserta query search string
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

