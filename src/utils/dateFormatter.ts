export const formatDateLocalized = (dateStr: string | null | undefined, locale: string = 'id'): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const localeMap: Record<string, string> = {
      en: 'en-US',
      ar: 'ar-SA',
      fr: 'fr-FR',
      ja: 'ja-JP',
      id: 'id-ID'
    };
    const targetLocale = localeMap[locale] || 'id-ID';
    return date.toLocaleDateString(targetLocale, { day: 'numeric', month: 'long', year: 'numeric' });
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
