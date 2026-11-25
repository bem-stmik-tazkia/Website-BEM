import type { AgendaItem, AgendaKegiatan, DynamicFormField } from "../types/agenda";
import { isOwnRegistrationStorageUrl } from "./registration-utils";

export const ALLOWED_ROOT_DOMAINS = [
  "drive.google.com",
  "docs.google.com",
  "notion.so",
  "notion.site",
  "github.com",
  "linkedin.com",
  "figma.com",
  "canva.com",
  "onedrive.live.com",
  "1drv.ms",
];

/**
 * Checks whether a registration deadline (YYYY-MM-DD or ISO timestamp) has passed
 * based on the current calendar date in Asia/Jakarta (WIB).
 */
export function isDeadlinePassedJakarta(
  deadline?: string | null,
  now: Date = new Date()
): boolean {
  if (!deadline) return false;
  const deadlineDateStr = deadline.split("T")[0];
  const jakartaTodayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return jakartaTodayStr > deadlineDateStr;
}

export function isHostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_ROOT_DOMAINS.some(
    (domain) => host === domain || host.endsWith("." + domain)
  );
}

export function isAllowedDocumentUrl(
  urlString: string,
  options?: { allowOwnStorageImage?: boolean }
): { valid: boolean; reason?: string; url?: URL } {
  if (urlString.length > 500) {
    return { valid: false, reason: "Tautan dokumen maksimal 500 karakter" };
  }

  if (/[\s\x00-\x1F\x7F]/.test(urlString)) {
    return {
      valid: false,
      reason: "Tautan tidak boleh mengandung spasi atau karakter kontrol",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: "Format tautan dokumen tidak valid" };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      reason: "Tautan dokumen wajib menggunakan protokol https://",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      reason: "Tautan tidak boleh memuat kredensial username/password",
    };
  }

  if (parsed.port !== "" && parsed.port !== "443") {
    return {
      valid: false,
      reason: "Tautan tidak boleh menggunakan port non-default",
    };
  }

  const host = parsed.hostname.toLowerCase();
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const isIpv6 = host.startsWith("[") || host.includes(":");
  if (isIpv4 || isIpv6) {
    return { valid: false, reason: "Hostname tidak boleh berupa alamat IP" };
  }

  if (options?.allowOwnStorageImage && isOwnRegistrationStorageUrl(urlString)) {
    return { valid: true, url: parsed };
  }

  if (!isHostnameAllowed(host)) {
    return {
      valid: false,
      reason: `Domain '${host}' tidak diizinkan. Harap lampirkan tautan dari Google Drive/Docs, Notion, GitHub, LinkedIn, Figma, Canva, atau OneDrive.`,
    };
  }

  return { valid: true, url: parsed };
}

/**
 * Validates selected sub-items (positions for Oprec / competitions for Events).
 */
export function validateItemSelection(params: {
  agendaType: string;
  allowMultipleItems?: boolean | null;
  availableItems: Array<{ id: string; name: string; quota?: number | null }>;
  requestedItemIds: string[];
}): { valid: true; selectedItemIds: string[] } | { valid: false; error: string } {
  const { agendaType, allowMultipleItems, availableItems, requestedItemIds } = params;
  const deduped = Array.from(new Set(requestedItemIds.filter(Boolean)));

  if (availableItems.length === 0) {
    return { valid: true, selectedItemIds: [] };
  }

  if (deduped.length === 0) {
    return {
      valid: false,
      error:
        agendaType === "volunteer"
          ? "Silakan pilih posisi yang ingin dilamar"
          : "Silakan pilih minimal 1 cabang lomba yang ingin diikuti",
    };
  }

  if ((agendaType === "volunteer" || allowMultipleItems === false) && deduped.length > 1) {
    return {
      valid: false,
      error: "Kamu hanya diperbolehkan memilih 1 pilihan pada kegiatan ini",
    };
  }

  const validItemIds = new Set(availableItems.map((i) => i.id));
  for (const reqId of deduped) {
    if (!validItemIds.has(reqId)) {
      return { valid: false, error: "Pilihan posisi / cabang lomba tidak valid" };
    }
  }

  return { valid: true, selectedItemIds: deduped };
}

/**
 * Validates user answers against the agenda's dynamic form_schema.
 */
export function validateRegistrationResponses(
  formSchema: DynamicFormField[],
  responses: Record<string, string>
): { valid: true; extractedPortofolioUrl: string | null } | { valid: false; error: string } {
  const formSchemaMap = new Map(formSchema.map((field) => [field.id, field]));

  for (const submittedKey of Object.keys(responses)) {
    if (!formSchemaMap.has(submittedKey)) {
      return {
        valid: false,
        error: `Field '${submittedKey}' tidak terdaftar dalam formulir pendaftaran kegiatan ini`,
      };
    }
  }

  let extractedPortofolioUrl: string | null = null;

  for (const field of formSchema) {
    const rawValue = responses[field.id];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (field.required && !value) {
      return { valid: false, error: `Kolom '${field.label}' wajib diisi` };
    }

    if (value) {
      if (field.type === "file" || field.type === "image") {
        const urlCheck = isAllowedDocumentUrl(value, {
          allowOwnStorageImage: field.type === "image",
        });
        if (!urlCheck.valid) {
          return { valid: false, error: `Kolom '${field.label}': ${urlCheck.reason}` };
        }
        if (!extractedPortofolioUrl) {
          extractedPortofolioUrl = value.slice(0, 500);
        }
      } else if (field.type === "select") {
        const opts = Array.isArray(field.options)
          ? field.options.map((o) => o.trim()).filter(Boolean)
          : [];
        if (opts.length > 0 && !opts.includes(value)) {
          return {
            valid: false,
            error: `Pilihan pada kolom '${field.label}' tidak valid`,
          };
        }
      } else {
        if (value.length > 3000) {
          return {
            valid: false,
            error: `Kolom '${field.label}' melebihi batas maksimal 3000 karakter`,
          };
        }
        if (field.type === "number" && !/^-?\d+$/.test(value)) {
          return {
            valid: false,
            error: `Kolom '${field.label}' harus berupa angka yang valid`,
          };
        }
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return {
            valid: false,
            error: `Kolom '${field.label}' harus berupa alamat email yang valid`,
          };
        }
      }
    }
  }

  return { valid: true, extractedPortofolioUrl };
}

/**
 * Pure aggregation helper attaching items + accepted/rejected counts to agenda objects.
 * Rows with status === 'rejected' do not occupy quota slots.
 */
export function aggregateAgendaItemsAndCounts<T extends Partial<AgendaKegiatan>>(
  agendas: T[],
  items: AgendaItem[],
  applications: Array<{
    agenda_id: string;
    item_id?: string | null;
    status?: string | null;
  }>
): T[] {
  const itemAcceptedMap = new Map<string, number>();
  const itemRejectedMap = new Map<string, number>();
  const agendaAcceptedMap = new Map<string, number>();

  for (const row of applications) {
    const isRejected = row.status === "rejected";
    if (!isRejected) {
      agendaAcceptedMap.set(
        row.agenda_id,
        (agendaAcceptedMap.get(row.agenda_id) || 0) + 1
      );
      if (row.item_id) {
        itemAcceptedMap.set(row.item_id, (itemAcceptedMap.get(row.item_id) || 0) + 1);
      }
    } else if (row.item_id) {
      itemRejectedMap.set(row.item_id, (itemRejectedMap.get(row.item_id) || 0) + 1);
    }
  }

  const itemsByAgenda = new Map<string, AgendaItem[]>();
  for (const raw of items) {
    const enrichedItem: AgendaItem = {
      ...raw,
      filled_count: itemAcceptedMap.get(raw.id) || 0,
      rejected_count: itemRejectedMap.get(raw.id) || 0,
    };
    const existing = itemsByAgenda.get(raw.agenda_id) || [];
    existing.push(enrichedItem);
    itemsByAgenda.set(raw.agenda_id, existing);
  }

  return agendas.map((agenda) => {
    if (!agenda.id) return agenda;
    return {
      ...agenda,
      items: itemsByAgenda.get(agenda.id) || [],
      accepted_count: agendaAcceptedMap.get(agenda.id) || 0,
    };
  });
}
