// ─────────────────────────────────────────────
// Centralized color system for Kabinet (public page + admin)
// Colors are derived from role / index instead of the stored `color`/`warna`
// fields, because stored values are inconsistent (hex vs Tailwind class names).
// ─────────────────────────────────────────────

export interface KabinetTheme {
  color: string; // strong accent (text, badge)
  bg: string; // soft background
}

/** Core board tiers */
export const CORE_THEME = {
  lead: { color: "#1b4086", bg: "#e1e7ff" }, // Ketua & Wakil – navy
  staff: { color: "#f2791e", bg: "#ffe4d1" }, // Sekretaris, Bendahara, dll – orange
} satisfies Record<string, KabinetTheme>;

export type CoreTier = keyof typeof CORE_THEME;

/** Ketua / Wakil Ketua (Presiden / Wakil Presiden) are "lead", everything else is "staff". */
export function getCoreTier(role?: string): CoreTier {
  const r = (role || "").toLowerCase();
  return /ketua|presiden|president|chairman/.test(r) ? "lead" : "staff";
}

/** Sort order inside the lead tier: Ketua first, then Wakil. */
export function getLeadOrder(role?: string): number {
  return /wakil|vice/.test((role || "").toLowerCase()) ? 1 : 0;
}

export function getCoreTheme(role?: string): KabinetTheme {
  return CORE_THEME[getCoreTier(role)];
}

/**
 * Distinct department palette (assigned by department order).
 * Navy & orange are intentionally excluded — they are reserved for the core board tiers.
 */
export const DEPT_PALETTE: KabinetTheme[] = [
  { color: "#7c3aed", bg: "#ede9fe" }, // violet
  { color: "#0891b2", bg: "#cffafe" }, // cyan / teal
  { color: "#e11d48", bg: "#ffe4e6" }, // rose
  { color: "#059669", bg: "#d1fae5" }, // emerald
  { color: "#ca8a04", bg: "#fef9c3" }, // yellow / gold
  { color: "#c026d3", bg: "#fae8ff" }, // fuchsia
  { color: "#65a30d", bg: "#ecfccb" }, // lime
  { color: "#475569", bg: "#e2e8f0" }, // slate
];

export function getDeptTheme(index: number): KabinetTheme {
  return DEPT_PALETTE[((index % DEPT_PALETTE.length) + DEPT_PALETTE.length) % DEPT_PALETTE.length];
}
