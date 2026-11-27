import type { DynamicFormField, AgendaItem, VolunteerApplication } from "@/types/agenda";
import type {
  CertificateCsvRow,
  CertificateDesignPreset,
  CertificateLayoutConfig,
  CertificateRecord,
  CertificateRenderData,
  CertificateSigner,
  CertificateTemplate,
} from "@/types/certificate";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_FORMAT_REGEX = /^[A-Z0-9-]{6,40}$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export const DEFAULT_CERTIFICATE_SIGNERS: CertificateSigner[] = [
  {
    name: "Ketua BEM STMIK Tazkia",
    role: "Ketua Badan Eksekutif Mahasiswa",
    signature_url: null,
  },
  {
    name: "Ketua Pelaksana",
    role: "Ketua Panitia Kegiatan",
    signature_url: null,
  },
];

export const CERTIFICATE_DESIGN_PRESETS: Array<{
  id: CertificateDesignPreset;
  label: string;
  description: string;
  primaryColor: string;
  accentColor: string;
}> = [
  {
    id: "classic-navy",
    label: "Klasik Resmi Navy & Emas",
    description: "Bingkai ganda navy khas BEM STMIK Tazkia dengan ornamen emas.",
    primaryColor: "#143470",
    accentColor: "#C89D3C",
  },
  {
    id: "emerald-gold",
    label: "Elegan Emerald & Gold",
    description: "Nuansa hijau zamrud akademik berpadu aksen garis geometris emas.",
    primaryColor: "#064E3B",
    accentColor: "#D4AF37",
  },
  {
    id: "modern-royal",
    label: "Modern Minimalis Royal",
    description: "Desain bersih bergaya modern dengan pita aksen biru-oranye.",
    primaryColor: "#1E3A8A",
    accentColor: "#EA580C",
  },
  {
    id: "custom-bg",
    label: "Background Kustom (Canva/Figma)",
    description: "Gunakan gambar desain sendiri sebagai latar sertifikat otomatis.",
    primaryColor: "#143470",
    accentColor: "#C89D3C",
  },
];

export function sanitizeCertificateText(raw: unknown, maxLength: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : undefined;
}

export function isValidCertificateCodeFormat(code: unknown): boolean {
  if (typeof code !== "string") return false;
  const clean = code.trim().toUpperCase();
  return CODE_FORMAT_REGEX.test(clean);
}

function isDisallowedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith("169.254.")
  ) {
    return true;
  }
  return false;
}

/**
 * Validates and sanitizes certificate asset/download URLs against XSS, SVG injection,
 * plaintext HTTP, credentials in URLs, and SSRF targets.
 */
export function sanitizeCertificateAssetUrl(
  rawUrl: unknown,
  options?: { allowPdf?: boolean }
): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 1000) return null;

  if (trimmed === "/images/logo2.webp") return trimmed;
  if (
    trimmed.startsWith("/storage/public_images/certificates/") &&
    !trimmed.includes("..") &&
    !trimmed.toLowerCase().endsWith(".svg")
  ) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || !parsed.hostname) return null;
  if (parsed.username || parsed.password) return null;
  if (isDisallowedHostname(parsed.hostname)) return null;

  const lowerPath = parsed.pathname.toLowerCase();
  if (
    lowerPath.endsWith(".svg") ||
    lowerPath.endsWith(".html") ||
    lowerPath.endsWith(".htm") ||
    lowerPath.endsWith(".js")
  ) {
    return null;
  }

  if (!options?.allowPdf && lowerPath.endsWith(".pdf")) {
    return null;
  }

  return parsed.toString();
}

export function extractOwnCertificateStoragePath(urlString: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    const baseHost = new URL(supabaseUrl).hostname.toLowerCase();
    const parsed = new URL(urlString);
    const marker = "/storage/v1/object/public/public_images/";
    if (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase() === baseHost &&
      parsed.pathname.includes(marker)
    ) {
      const storagePath = decodeURIComponent(parsed.pathname.split(marker)[1] || "");
      if (storagePath.startsWith("certificates/") && !storagePath.includes("..")) {
        return storagePath;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function clampCertificateLayoutConfig(
  raw?: CertificateLayoutConfig | null
): CertificateLayoutConfig {
  if (!raw || typeof raw !== "object") return {};
  const offset = Number(raw.contentOffsetY ?? 0);
  const opacity = Number(raw.overlayOpacity ?? 0);

  return {
    textColor: sanitizeHexColor(raw.textColor),
    accentColor: sanitizeHexColor(raw.accentColor),
    showLogo: typeof raw.showLogo === "boolean" ? raw.showLogo : true,
    showBorder: typeof raw.showBorder === "boolean" ? raw.showBorder : false,
    showQr: typeof raw.showQr === "boolean" ? raw.showQr : true,
    badgeText: raw.badgeText ? sanitizeCertificateText(raw.badgeText, 80) : undefined,
    contentOffsetY: Number.isFinite(offset)
      ? Math.max(-220, Math.min(220, Math.round(offset)))
      : 0,
    overlayOpacity: Number.isFinite(opacity)
      ? Math.max(0, Math.min(0.9, Number(opacity.toFixed(2))))
      : 0,
  };
}

/**
 * Generates an unpredictable 10-character (~50-bit entropy) public verification code.
 */
export function generateCertificateCode(date: Date = new Date()): string {
  const year = date.getFullYear();
  let suffix = "";

  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(10);
    globalThis.crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length; i++) {
      suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < 10; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  }

  return `TZK-${year}-${suffix}`;
}

export function toRomanMonth(date: Date): string {
  const idx = date.getMonth();
  return ROMAN_MONTHS[idx] || "I";
}

/**
 * Formats an official Indonesian organization certificate number.
 * Supports optional placeholders {SEQ}, {ROMAN_MONTH}, {YEAR} inside prefix.
 */
export function formatCertificateNumber({
  prefix = "SERT/BEM-TAZKIA",
  sequence,
  issuedDate = new Date(),
}: {
  prefix?: string | null;
  sequence: number;
  issuedDate?: Date;
}): string {
  const seqStr = String(Math.max(1, Math.floor(sequence))).padStart(3, "0");
  const roman = toRomanMonth(issuedDate);
  const year = String(issuedDate.getFullYear());
  const cleanPrefix = (prefix || "SERT/BEM-TAZKIA").trim().replace(/^\/+|\/+$/g, "");

  if (
    cleanPrefix.includes("{SEQ}") ||
    cleanPrefix.includes("{ROMAN_MONTH}") ||
    cleanPrefix.includes("{YEAR}")
  ) {
    return cleanPrefix
      .replace(/\{SEQ\}/g, seqStr)
      .replace(/\{ROMAN_MONTH\}/g, roman)
      .replace(/\{YEAR\}/g, year);
  }

  return `${seqStr}/${cleanPrefix}/${roman}/${year}`;
}

export function formatIndonesianLongDate(input?: string | Date | null): string {
  if (!input) return "";
  const parsed = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return typeof input === "string" ? input : "";
  }
  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Rewrites same-project Supabase public storage URLs to same-origin /storage/... paths
 * (backed by Next.js rewrite in next.config.ts) after validating URL safety.
 */
export function toSameOriginStorageUrl(url: string | null | undefined): string | null {
  const safeUrl = sanitizeCertificateAssetUrl(url, { allowPdf: false });
  if (!safeUrl) return null;
  if (safeUrl.startsWith("/")) return safeUrl;

  try {
    const parsed = new URL(safeUrl);
    const marker = "/storage/v1/object/public/";
    if (parsed.hostname.endsWith(".supabase.co") && parsed.pathname.includes(marker)) {
      const rest = parsed.pathname.split(marker)[1];
      if (rest && !rest.includes("..")) return `/storage/${rest}`;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeCertificateFilename(name: string): string {
  const safe = name
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_");
  return safe || "E-Sertifikat";
}

export function getCertificateVerifyUrl(code: string, origin?: string): string {
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  const baseOrigin =
    origin?.replace(/\/+$/g, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return baseOrigin ? `${baseOrigin}/sertifikat/${cleanCode}` : `/sertifikat/${cleanCode}`;
}

export function extractApplicantInfoForCertificate(
  app: VolunteerApplication,
  commonFields: DynamicFormField[] = [],
  agendaItems: AgendaItem[] = [],
  activityType: "event" | "volunteer" | "dokumentasi" = "event"
): {
  recipient_name: string;
  role_title: string;
} {
  const allFields: DynamicFormField[] = [...commonFields];
  const targetItem = app.item_id
    ? agendaItems.find((it) => it.id === app.item_id)
    : undefined;
  if (targetItem?.extra_fields) {
    for (const extra of targetItem.extra_fields) {
      if (!allFields.some((f) => f.id === extra.id)) {
        allFields.push(extra);
      }
    }
  }

  const responses = app.responses || {};

  const findFieldValue = (regex: RegExp): string | null => {
    for (const field of allFields) {
      const raw = responses[field.id];
      if (typeof raw !== "string" || !raw.trim()) continue;
      if (raw.startsWith("http")) continue;
      if (regex.test(field.label || "")) return raw.trim();
    }
    return null;
  };

  let recipientName =
    findFieldValue(/nama\s*lengkap|^nama\s*peserta$|^nama$|^nama\s*tim/i) || null;

  if (!recipientName) {
    const firstText = Object.values(responses).find(
      (v) =>
        typeof v === "string" &&
        v.trim().length > 1 &&
        !v.startsWith("http") &&
        !v.includes("@") &&
        !/^\d{7,}$/.test(v.trim())
    );
    if (typeof firstText === "string") {
      recipientName = firstText.trim();
    }
  }

  if (!recipientName) {
    recipientName = "Peserta Kegiatan";
  }

  let roleTitle = "Peserta";
  if (activityType === "volunteer") {
    roleTitle = app.item_name?.trim() ? `Panitia — ${app.item_name.trim()}` : "Panitia / Volunteer";
  } else if (app.item_name?.trim()) {
    roleTitle = `Peserta — ${app.item_name.trim()}`;
  }

  return {
    recipient_name: sanitizeCertificateText(recipientName, 120),
    role_title: sanitizeCertificateText(roleTitle, 120) || "Peserta",
  };
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV/TSV text (auto-detecting `;`, `,`, or tab delimiters) into certificate recipient rows.
 * Supports headers (nama, peran/role, nomor, keterangan) or simple 1-2 column (nama; peran) lists.
 */
export function parseCertificateCsvImport(
  rawText: string,
  defaultRole = "Peserta"
): { rows: CertificateCsvRow[]; errors: string[] } {
  const cleanText = rawText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) {
    return { rows: [], errors: ["Teks CSV kosong."] };
  }

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["Tidak ada baris data yang terbaca."] };
  }

  if (lines.length > 501) {
    return { rows: [], errors: ["Maksimal 500 baris dalam sekali import CSV."] };
  }

  const firstLine = lines[0];
  const counts = {
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
    ",": (firstLine.match(/,/g) || []).length,
  };
  let delimiter = ",";
  if (counts[";"] >= counts[","] && counts[";"] > 0) delimiter = ";";
  else if (counts["\t"] > counts[","]) delimiter = "\t";

  const firstCells = splitDelimitedLine(firstLine, delimiter).map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) =>
    /^(nama|name|nama lengkap|recipient_name|peran|role|jabatan|predikat|nomor)/.test(c)
  );

  let nameIdx = 0;
  let roleIdx = 1;
  let numberIdx = 2;
  let descIdx = 3;
  let startIndex = 0;

  if (looksLikeHeader) {
    startIndex = 1;
    nameIdx = firstCells.findIndex((c) => /nama|name|recipient_name/.test(c));
    roleIdx = firstCells.findIndex((c) => /peran|role|jabatan|predikat|posisi|status/.test(c));
    numberIdx = firstCells.findIndex((c) => /nomor|number|no_sertifikat/.test(c));
    descIdx = firstCells.findIndex((c) => /keterangan|catatan|desc/.test(c));
    if (nameIdx < 0) nameIdx = 0;
  }

  const rows: CertificateCsvRow[] = [];
  const errors: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitDelimitedLine(lines[i], delimiter);
    const name = sanitizeCertificateText(cols[nameIdx] || "", 120);
    if (!name) {
      errors.push(`Baris ${i + 1}: Kolom nama kosong, dilewati.`);
      continue;
    }

    const rawRole = roleIdx >= 0 ? sanitizeCertificateText(cols[roleIdx] || "", 120) : "";
    const rawNum = numberIdx >= 0 ? sanitizeCertificateText(cols[numberIdx] || "", 100) : "";
    const rawDesc = descIdx >= 0 ? sanitizeCertificateText(cols[descIdx] || "", 400) : "";

    rows.push({
      recipient_name: name,
      role_title: rawRole || sanitizeCertificateText(defaultRole, 120) || "Peserta",
      certificate_number: rawNum || null,
      description_override: rawDesc || null,
    });
  }

  return { rows, errors };
}

export function buildTemplateSnapshot(template: {
  subtitle?: string | null;
  description?: string | null;
  location?: string | null;
  design_preset?: CertificateDesignPreset | null;
  background_image_url?: string | null;
  layout_config?: CertificateLayoutConfig | null;
  signers?: CertificateSigner[] | null;
  issued_city?: string | null;
}) {
  return {
    subtitle: sanitizeCertificateText(template.subtitle, 120) || "SERTIFIKAT PENGHARGAAN",
    description: template.description ? sanitizeCertificateText(template.description, 600) : null,
    location: template.location ? sanitizeCertificateText(template.location, 200) : null,
    design_preset: template.design_preset || "classic-navy",
    background_image_url: sanitizeCertificateAssetUrl(template.background_image_url, {
      allowPdf: false,
    }),
    layout_config: clampCertificateLayoutConfig(template.layout_config),
    signers: Array.isArray(template.signers)
      ? template.signers
          .map((s) => ({
            name: sanitizeCertificateText(s?.name, 100),
            role: sanitizeCertificateText(s?.role, 120),
            signature_url: sanitizeCertificateAssetUrl(s?.signature_url, {
              allowPdf: false,
            }),
          }))
          .filter((s) => s.name || s.role)
          .slice(0, 3)
      : [],
    issued_city: sanitizeCertificateText(template.issued_city, 80) || "Bogor",
  };
}

export function certificateRecordToRenderData(
  cert: CertificateRecord,
  origin?: string,
  liveTemplate?: CertificateTemplate | null
): CertificateRenderData {
  const snap = cert.render_snapshot || {};
  const preset =
    liveTemplate?.design_preset || snap.design_preset || "classic-navy";
  const layoutConfig = clampCertificateLayoutConfig({
    ...(snap.layout_config || {}),
    ...(liveTemplate?.layout_config || {}),
  });
  const signers =
    liveTemplate?.signers && liveTemplate.signers.length > 0
      ? liveTemplate.signers
      : Array.isArray(snap.signers)
        ? snap.signers
        : DEFAULT_CERTIFICATE_SIGNERS;

  return {
    certificate_code: cert.certificate_code,
    certificate_number: cert.certificate_number,
    recipient_name: cert.recipient_name,
    role_title: cert.role_title,
    activity_title: liveTemplate?.title || cert.activity_title,
    activity_date_label:
      liveTemplate?.event_date_label || cert.activity_date_label,
    issued_date_label:
      cert.issued_date_label ||
      liveTemplate?.issued_date_label ||
      formatIndonesianLongDate(cert.issued_at),
    subtitle: liveTemplate?.subtitle || snap.subtitle || "SERTIFIKAT PENGHARGAAN",
    description:
      cert.description_override ?? liveTemplate?.description ?? snap.description ?? null,
    location: liveTemplate?.location ?? snap.location ?? null,
    design_preset: preset,
    background_image_url: sanitizeCertificateAssetUrl(
      liveTemplate?.background_image_url ?? snap.background_image_url ?? null,
      { allowPdf: false }
    ),
    layout_config: layoutConfig,
    signers,
    issued_city: liveTemplate?.issued_city || snap.issued_city || "Bogor",
    verifyUrl: getCertificateVerifyUrl(cert.certificate_code, origin),
  };
}
