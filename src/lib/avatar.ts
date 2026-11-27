const DEFAULT_OPTIMIZABLE_IMAGE_HOSTS = [
  "picsum.photos",
  "images.unsplash.com",
  "pmrowiyvuqnxgzmlbfzx.supabase.co",
  "dfeokmrfwgrufruieunh.supabase.co",
  "lh3.googleusercontent.com",
];

function getOptimizableHosts(): Set<string> {
  const hosts = new Set(DEFAULT_OPTIMIZABLE_IMAGE_HOSTS);
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl) {
    try {
      hosts.add(new URL(envUrl).hostname.toLowerCase());
    } catch {
      // Ignore malformed env URL
    }
  }
  return hosts;
}

/**
 * Checks whether an avatar URL can be safely passed through Next.js Image Optimization
 * (which pre-resizes large portrait photos cleanly via Sharp before browser rendering).
 */
export function canOptimizeAvatarUrl(src?: string | null): boolean {
  const clean = src?.trim();
  if (!clean) return false;

  const lower = clean.toLowerCase();
  if (lower.startsWith("data:") || lower.startsWith("blob:")) {
    return false;
  }

  // Local path (skip SVGs so vector assets don't fail Next/Image raster checks)
  if (clean.startsWith("/")) {
    const pathname = lower.split(/[?#]/)[0];
    return !pathname.endsWith(".svg");
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== "https:") return false;
    if (parsed.pathname.toLowerCase().endsWith(".svg")) return false;
    return getOptimizableHosts().has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Returns a ~2x Sharp pre-resize target width for small avatar boxes so 1x DPI screens
 * avoid severe single-pass browser downscaling aliasing without becoming soft.
 */
export function getAvatarRequestSize(displaySizePx: number): number {
  const safeSize = Number.isFinite(displaySizePx) && displaySizePx > 0 ? displaySizePx : 40;
  if (safeSize <= 48) return 96;
  if (safeSize <= 72) return 128;
  return 256;
}
