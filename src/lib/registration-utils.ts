/**
 * Shared helpers for safe URL validation and image thumbnail resolution
 * in agenda/volunteer registration forms and admin reports.
 */

export function getSafeHttpsUrl(urlString: unknown): { href: string; hostname: string } | null {
  if (typeof urlString !== "string") return null;
  const trimmed = urlString.trim();
  if (!trimmed.startsWith("https://")) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" && parsed.hostname) {
      return {
        href: parsed.toString(),
        hostname: parsed.hostname,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Extracts Google Drive file ID from common Drive URLs (/file/d/<ID>/ or ?id=<ID>).
 */
export function extractGoogleDriveFileId(urlString: string): string | null {
  const fileMatch = urlString.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes("drive.google.com")) {
      const idParam = parsed.searchParams.get("id");
      if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) {
        return idParam;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Resolves a safe direct preview image URL for thumbnails & PDF photo reports.
 * Supports Supabase public storage URLs, direct raster image links, and Google Drive file links.
 */
export function getRegistrationImagePreviewUrl(rawValue: unknown): string | null {
  const safe = getSafeHttpsUrl(rawValue);
  if (!safe) return null;

  const { href, hostname } = safe;
  const lowerHost = hostname.toLowerCase();

  // Google Drive file link -> thumbnail endpoint
  if (lowerHost === "drive.google.com" || lowerHost.endsWith(".drive.google.com")) {
    const driveId = extractGoogleDriveFileId(href);
    if (driveId) {
      return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    }
    return null;
  }

  // Supabase storage image uploaded via /api/volunteer/upload or admin
  if (lowerHost.endsWith(".supabase.co") && href.includes("/storage/v1/object/public/")) {
    return href;
  }

  // Direct raster image URL (.jpg, .jpeg, .png, .webp, .gif, .avif)
  if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(href)) {
    return href;
  }

  return null;
}

/**
 * Checks if a given URL string points to our own Supabase public_images registration folder.
 */
export function isOwnRegistrationStorageUrl(urlString: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  try {
    const baseHost = new URL(supabaseUrl).hostname.toLowerCase();
    const parsed = new URL(urlString);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase() === baseHost &&
      parsed.pathname.startsWith("/storage/v1/object/public/public_images/pendaftaran/")
    );
  } catch {
    return false;
  }
}
