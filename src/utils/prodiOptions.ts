export const ALL_PRODI_VALUE = "Semua Prodi";

export const PRODI_FILTER_OPTIONS = [
  { value: "Teknik Informatika", labelKey: "prodiTI" },
  { value: "Sistem Informasi", labelKey: "prodiSI" },
] as const;

export type ProdiLabelKey = "filterAllProdi" | (typeof PRODI_FILTER_OPTIONS)[number]["labelKey"];

export function isAllProdi(value: string) {
  return value === ALL_PRODI_VALUE;
}

export function getProdiLabelKey(value: string): ProdiLabelKey | null {
  if (isAllProdi(value)) return "filterAllProdi";
  const match = PRODI_FILTER_OPTIONS.find((option) => option.value === value);
  return match?.labelKey ?? null;
}

export function getProdiDisplayLabel(
  value: string,
  t: (key: ProdiLabelKey) => string
): string {
  const key = getProdiLabelKey(value);
  return key ? t(key) : value;
}
