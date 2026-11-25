import { parseDeadlineInstant, splitDeadlineWib } from "@/lib/registration-utils";

/**
 * Shared formatting and URL helpers for server-side notification providers
 * (Telegram & Discord).
 */

/**
 * Strips HTML tags and normalizes whitespace into plain text.
 */
export function stripHtml(text: string): string {
  return (text || "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns the public website base URL without trailing slashes.
 */
export function getBaseSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://bem.stmik.tazkia.ac.id"
  ).replace(/\/+$/, "");
}

/**
 * Returns a trimmed http(s) URL if valid, otherwise null.
 */
export function isValidHttpUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

/**
 * Truncates text cleanly with an ellipsis when exceeding maxLength.
 */
export function truncateText(text: string, maxLength: number): string {
  const clean = (text || "").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, Math.max(0, maxLength - 3)).trimEnd() + "...";
}

/**
 * Formats a date in Indonesian long format (Asia/Jakarta).
 */
export function formatWibDate(dateInput?: string | Date | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a date and time in Indonesian format (Asia/Jakarta).
 */
export function formatWibDateTime(dateInput?: string | Date | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a registration deadline in full Indonesian format including closing hour in WIB
 * (e.g. "Jumat, 27 November 2026 • 17:00 WIB").
 */
export function formatWibDeadline(deadlineInput?: string | null): string {
  const instant = parseDeadlineInstant(deadlineInput);
  if (!instant) return "-";
  const dateText = formatWibDate(instant);
  const { time } = splitDeadlineWib(deadlineInput);
  return `${dateText} • ${time} WIB`;
}
