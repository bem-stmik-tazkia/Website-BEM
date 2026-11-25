export const DEFAULT_POSTERS = {
  event: "/posters/default-event.svg",
  volunteer: "/posters/default-oprec.svg",
} as const;

export const DEFAULT_OG_RASTER_IMAGE =
  "https://bem.stmik.tazkia.ac.id/images/logo2.webp";

/**
 * Returns the built-in animated SVG poster path tailored to the agenda type.
 */
export function getDefaultPosterPath(type?: string | null): string {
  return type === "volunteer" ? DEFAULT_POSTERS.volunteer : DEFAULT_POSTERS.event;
}

/**
 * Checks whether a URL/path points to one of the built-in default poster SVGs.
 */
export function isDefaultPosterPath(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed === DEFAULT_POSTERS.event ||
    trimmed === DEFAULT_POSTERS.volunteer ||
    trimmed.endsWith("/posters/default-event.svg") ||
    trimmed.endsWith("/posters/default-oprec.svg")
  );
}

/**
 * Checks whether an image URL/path targets an SVG asset (so Next/Image can bypass raster optimization).
 */
export function isSvgImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.svg(\?.*)?$/i.test(url.trim());
}

/**
 * Resolves the display poster URL for an event, oprec, or documentation item,
 * falling back to gallery[0] (if provided) and then the built-in animated SVG poster.
 */
export function getKegiatanPosterUrl(
  imageUrl?: string | null,
  type?: string | null,
  gallery?: Array<string | null | undefined> | null
): string {
  const trimmed = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (trimmed) return trimmed;

  if (Array.isArray(gallery)) {
    const firstGallery = gallery.find(
      (g): g is string => typeof g === "string" && g.trim().length > 0
    );
    if (firstGallery) return firstGallery.trim();
  }

  return getDefaultPosterPath(type);
}

/**
 * Matching fallback background class for default SVG posters when fitted inside non-16:9 frames.
 */
export function getDefaultPosterBgClass(type?: string | null): string {
  return type === "volunteer" ? "bg-[#C2410C]" : "bg-[#0E245C]";
}

/**
 * Deduplicates redundant category labels such as "VOLUNTEERS / VOLUNTEERS" into "VOLUNTEERS".
 */
export function dedupeCategoryLabel(category?: string | null): string {
  if (!category) return "";
  const parts = category.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return category.trim();
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some((u) => u.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }
  return unique.join(" / ");
}
