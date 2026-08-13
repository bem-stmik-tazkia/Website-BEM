const LEGACY_PLACEHOLDER_BIOS = new Set([
  "Halo! Saya mahasiswa BEM STMIK Tazkia.",
  "Halo! Saya mahasiswa STMIK Tazkia.",
  "Hello! I am a STMIK Tazkia student.",
  "Hello! I am a student of STMIK Tazkia.",
]);

export function getDisplayBio(bio: string | undefined | null, fallback: string): string {
  const trimmed = bio?.trim();
  if (!trimmed) return fallback;
  if (LEGACY_PLACEHOLDER_BIOS.has(trimmed)) return fallback;
  return bio!;
}

export const DEFAULT_BIO_ID = "Halo! Saya mahasiswa STMIK Tazkia.";
