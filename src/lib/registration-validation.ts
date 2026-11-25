import type { AgendaItem, AgendaKegiatan, DynamicFormField } from "../types/agenda";
import { isOwnRegistrationStorageUrl, parseDeadlineInstant } from "./registration-utils";
import { getPublicApiMessage, type PublicLocale } from "./public-api-i18n";

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
 * in Asia/Jakarta (WIB), honoring exact closing hours and minutes.
 * Date-only deadlines remain open through 23:59:59 WIB of that calendar day.
 */
export function isDeadlinePassedJakarta(
  deadline?: string | null,
  now: Date = new Date()
): boolean {
  const instant = parseDeadlineInstant(deadline);
  if (!instant) return false;
  return now.getTime() > instant.getTime();
}

export function isHostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_ROOT_DOMAINS.some(
    (domain) => host === domain || host.endsWith("." + domain)
  );
}

export function isAllowedDocumentUrl(
  urlString: string,
  options?: { allowOwnStorageImage?: boolean; locale?: PublicLocale | string | null }
): { valid: boolean; reason?: string; url?: URL } {
  const loc = options?.locale;
  if (urlString.length > 500) {
    return { valid: false, reason: getPublicApiMessage(loc, "urlMaxLength") };
  }

  if (/[\s\x00-\x1F\x7F]/.test(urlString)) {
    return {
      valid: false,
      reason: getPublicApiMessage(loc, "urlNoSpaces"),
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: getPublicApiMessage(loc, "urlInvalidFormat") };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      reason: getPublicApiMessage(loc, "urlHttpsRequired"),
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      reason: getPublicApiMessage(loc, "urlNoCredentials"),
    };
  }

  if (parsed.port !== "" && parsed.port !== "443") {
    return {
      valid: false,
      reason: getPublicApiMessage(loc, "urlInvalidPort"),
    };
  }

  const host = parsed.hostname.toLowerCase();
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const isIpv6 = host.startsWith("[") || host.includes(":");
  if (isIpv4 || isIpv6) {
    return { valid: false, reason: getPublicApiMessage(loc, "urlNoIp") };
  }

  if (options?.allowOwnStorageImage && isOwnRegistrationStorageUrl(urlString)) {
    return { valid: true, url: parsed };
  }

  if (!isHostnameAllowed(host)) {
    return {
      valid: false,
      reason: getPublicApiMessage(loc, "urlDomainNotAllowed", { host }),
    };
  }

  return { valid: true, url: parsed };
}

/**
 * Checks whether an agenda has at least one question in either its common form_schema
 * or in any sub-item's extra_fields.
 */
export function hasAnyFormQuestions(
  formSchema?: DynamicFormField[] | null,
  items?: Array<{ extra_fields?: DynamicFormField[] | null }> | null
): boolean {
  if (Array.isArray(formSchema) && formSchema.length > 0) return true;
  if (
    Array.isArray(items) &&
    items.some((it) => Array.isArray(it.extra_fields) && it.extra_fields.length > 0)
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether an agenda has at least one image upload field in either its common
 * form_schema or in any sub-item's extra_fields.
 */
export function hasAnyImageField(
  formSchema?: DynamicFormField[] | null,
  items?: Array<{ extra_fields?: DynamicFormField[] | null }> | null
): boolean {
  if (Array.isArray(formSchema) && formSchema.some((f) => f?.type === "image")) {
    return true;
  }
  if (
    Array.isArray(items) &&
    items.some(
      (it) =>
        Array.isArray(it.extra_fields) &&
        it.extra_fields.some((f) => f?.type === "image")
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Validates selected sub-items (positions for Oprec / competitions for Events).
 */
export function validateItemSelection(params: {
  agendaType: string;
  allowMultipleItems?: boolean | null;
  availableItems: Array<{ id: string; name: string; quota?: number | null }>;
  requestedItemIds: string[];
  locale?: PublicLocale | string | null;
}): { valid: true; selectedItemIds: string[] } | { valid: false; error: string } {
  const { agendaType, allowMultipleItems, availableItems, requestedItemIds, locale } = params;
  const deduped = Array.from(new Set(requestedItemIds.filter(Boolean)));

  if (availableItems.length === 0) {
    return { valid: true, selectedItemIds: [] };
  }

  if (deduped.length === 0) {
    return {
      valid: false,
      error:
        agendaType === "volunteer"
          ? getPublicApiMessage(locale, "selectPosition")
          : getPublicApiMessage(locale, "selectCompetition"),
    };
  }

  if ((agendaType === "volunteer" || allowMultipleItems === false) && deduped.length > 1) {
    return {
      valid: false,
      error: getPublicApiMessage(locale, "singleItemOnly"),
    };
  }

  const validItemIds = new Set(availableItems.map((i) => i.id));
  for (const reqId of deduped) {
    if (!validItemIds.has(reqId)) {
      return { valid: false, error: getPublicApiMessage(locale, "invalidItemChoice") };
    }
  }

  return { valid: true, selectedItemIds: deduped };
}

function validateSingleFieldValue(
  field: DynamicFormField,
  rawValue: unknown,
  itemNamePrefix?: string,
  locale?: PublicLocale | string | null
): { valid: true; value: string; portofolioUrl?: string } | { valid: false; error: string } {
  const prefix = itemNamePrefix ? `${itemNamePrefix} — ` : "";
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (field.required && !value) {
    return {
      valid: false,
      error: getPublicApiMessage(locale, "fieldRequired", { prefix, label: field.label }),
    };
  }

  if (!value) {
    return { valid: true, value: "" };
  }

  if (field.type === "file" || field.type === "image") {
    const urlCheck = isAllowedDocumentUrl(value, {
      allowOwnStorageImage: field.type === "image",
      locale,
    });
    if (!urlCheck.valid) {
      return {
        valid: false,
        error: getPublicApiMessage(locale, "fieldDocError", {
          prefix,
          label: field.label,
          reason: urlCheck.reason,
        }),
      };
    }
    return { valid: true, value, portofolioUrl: value.slice(0, 500) };
  }

  if (field.type === "select") {
    const opts = Array.isArray(field.options)
      ? field.options.map((o) => o.trim()).filter(Boolean)
      : [];
    if (opts.length > 0 && !opts.includes(value)) {
      return {
        valid: false,
        error: getPublicApiMessage(locale, "fieldInvalidSelect", {
          prefix,
          label: field.label,
        }),
      };
    }
    return { valid: true, value };
  }

  if (value.length > 3000) {
    return {
      valid: false,
      error: getPublicApiMessage(locale, "fieldMaxLength", { prefix, label: field.label }),
    };
  }
  if (field.type === "number" && !/^-?\d+$/.test(value)) {
    return {
      valid: false,
      error: getPublicApiMessage(locale, "fieldInvalidNumber", {
        prefix,
        label: field.label,
      }),
    };
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return {
      valid: false,
      error: getPublicApiMessage(locale, "fieldInvalidEmail", {
        prefix,
        label: field.label,
      }),
    };
  }

  return { valid: true, value };
}

/**
 * Validates user answers against a flat form_schema (legacy single-form mode).
 */
export function validateRegistrationResponses(
  formSchema: DynamicFormField[],
  responses: Record<string, string>,
  locale?: PublicLocale | string | null
): { valid: true; extractedPortofolioUrl: string | null } | { valid: false; error: string } {
  const formSchemaMap = new Map(formSchema.map((field) => [field.id, field]));

  for (const submittedKey of Object.keys(responses)) {
    if (!formSchemaMap.has(submittedKey)) {
      return {
        valid: false,
        error: getPublicApiMessage(locale, "fieldUnknown", { key: submittedKey }),
      };
    }
  }

  let extractedPortofolioUrl: string | null = null;

  for (const field of formSchema) {
    const check = validateSingleFieldValue(field, responses[field.id], undefined, locale);
    if (!check.valid) return check;
    if (check.portofolioUrl && !extractedPortofolioUrl) {
      extractedPortofolioUrl = check.portofolioUrl;
    }
  }

  return { valid: true, extractedPortofolioUrl };
}

/**
 * Validates common form_schema PLUS per-selected-item extra_fields,
 * returning clean per-item response maps so each competition/position row
 * stores only common answers + its own extra answers.
 */
export function validateMultiItemRegistrationResponses(params: {
  commonSchema: DynamicFormField[];
  selectedItems: Array<{
    id: string;
    name: string;
    extra_fields?: DynamicFormField[] | null;
  }>;
  responses: Record<string, string>;
  locale?: PublicLocale | string | null;
}):
  | {
      valid: true;
      responsesByItem: Record<string, Record<string, string>>;
      extractedPortofolioUrl: string | null;
      mergedFieldsForSummary: Array<{ label: string; value: string }>;
    }
  | { valid: false; error: string } {
  const { commonSchema, selectedItems, responses, locale } = params;

  const allowedKeys = new Set<string>(commonSchema.map((f) => f.id));
  for (const item of selectedItems) {
    for (const ef of item.extra_fields || []) {
      allowedKeys.add(ef.id);
    }
  }

  for (const submittedKey of Object.keys(responses)) {
    if (!allowedKeys.has(submittedKey)) {
      return {
        valid: false,
        error: getPublicApiMessage(locale, "fieldUnknown", { key: submittedKey }),
      };
    }
  }

  let extractedPortofolioUrl: string | null = null;
  const commonValues: Record<string, string> = {};
  const mergedFieldsForSummary: Array<{ label: string; value: string }> = [];

  for (const field of commonSchema) {
    const check = validateSingleFieldValue(field, responses[field.id], undefined, locale);
    if (!check.valid) return check;
    if (check.value) {
      commonValues[field.id] = check.value;
      mergedFieldsForSummary.push({ label: field.label, value: check.value });
    }
    if (check.portofolioUrl && !extractedPortofolioUrl) {
      extractedPortofolioUrl = check.portofolioUrl;
    }
  }

  const responsesByItem: Record<string, Record<string, string>> = {};

  for (const item of selectedItems) {
    const itemResponses: Record<string, string> = { ...commonValues };
    const extras = Array.isArray(item.extra_fields) ? item.extra_fields : [];

    for (const ef of extras) {
      const check = validateSingleFieldValue(ef, responses[ef.id], item.name, locale);
      if (!check.valid) return check;
      if (check.value) {
        itemResponses[ef.id] = check.value;
        mergedFieldsForSummary.push({
          label: `[${item.name}] ${ef.label}`,
          value: check.value,
        });
      }
      if (check.portofolioUrl && !extractedPortofolioUrl) {
        extractedPortofolioUrl = check.portofolioUrl;
      }
    }

    responsesByItem[item.id] = itemResponses;
  }

  return {
    valid: true,
    responsesByItem,
    extractedPortofolioUrl,
    mergedFieldsForSummary,
  };
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
      extra_fields: Array.isArray(raw.extra_fields) ? raw.extra_fields : [],
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
