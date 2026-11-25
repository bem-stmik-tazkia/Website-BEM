import { parseDeadlineInstant, splitDeadlineWib } from "@/lib/registration-utils";

export const formatDateLocalized = (
  dateStr: string | null | undefined, 
  locale: string = 'id',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const localeMap: Record<string, string> = {
      en: 'en-GB',
      ar: 'ar-SA',
      fr: 'fr-FR',
      ja: 'ja-JP',
      id: 'id-ID'
    };
    const targetLocale = localeMap[locale] || 'id-ID';
    const defaultOptions: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString(targetLocale, options || defaultOptions);
  } catch {
    return dateStr;
  }
};

export const formatDateToIndo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // fallback if invalid

    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    return dateStr;
  }
};

/**
 * Formats a registration deadline with date and exact closing hour in WIB (e.g. "27 November 2026 • 17:00 WIB").
 * Always pins formatting to Asia/Jakarta to prevent SSR vs browser hydration mismatches.
 */
export const formatDeadlineWib = (
  deadlineStr: string | null | undefined,
  locale: string = "id"
): string => {
  if (!deadlineStr) return "-";
  const instant = parseDeadlineInstant(deadlineStr);
  if (!instant) return deadlineStr;

  const { time } = splitDeadlineWib(deadlineStr);
  const dateLabel =
    locale === "id"
      ? (() => {
          const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember",
          ];
          const wibParts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
            .format(instant)
            .split("-");
          const y = wibParts[0];
          const m = parseInt(wibParts[1], 10) - 1;
          const d = parseInt(wibParts[2], 10);
          return `${d} ${months[m]} ${y}`;
        })()
      : formatDateLocalized(instant.toISOString(), locale, {
          timeZone: "Asia/Jakarta",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

  return `${dateLabel} • ${time} WIB`;
};
