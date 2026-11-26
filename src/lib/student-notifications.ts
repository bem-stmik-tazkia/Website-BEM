"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface StudentNotification {
  id: string;
  category: "article" | "registration";
  article_id: string | null;
  article_title: string;
  action: string;
  note: string | null;
  created_at: string;
  hasReviewedAt?: boolean;
  href: string;
}

export interface StudentNotifPrefs {
  lastViewed: string;
  readIds: string[];
  dismissedIds: string[];
  clearedAt: string;
}

export interface StudentUnreadCounts {
  total: number;
  articles: number;
  registrations: number;
}

export const STUDENT_NOTIF_UPDATED_EVENT = "student_notif_state_updated";

const KEY_LAST_VIEWED = "student_notif_last_viewed";
const KEY_READ_IDS = "student_notif_read_ids";
const KEY_DISMISSED_IDS = "student_notif_dismissed_ids";
const KEY_CLEARED_AT = "student_notif_cleared_at";

const MAX_STORED_IDS = 120;

function readIdArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeIdArray(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const deduped = Array.from(new Set(ids)).slice(-MAX_STORED_IDS);
    localStorage.setItem(key, JSON.stringify(deduped));
  } catch {
    // ignore storage quota errors
  }
}

export function readStudentNotifPrefs(): StudentNotifPrefs {
  if (typeof window === "undefined") {
    return { lastViewed: "", readIds: [], dismissedIds: [], clearedAt: "" };
  }
  return {
    lastViewed: localStorage.getItem(KEY_LAST_VIEWED) || "",
    readIds: readIdArray(KEY_READ_IDS),
    dismissedIds: readIdArray(KEY_DISMISSED_IDS),
    clearedAt: localStorage.getItem(KEY_CLEARED_AT) || "",
  };
}

export function isStudentNotificationVisible(
  item: StudentNotification,
  prefs: StudentNotifPrefs
): boolean {
  if (prefs.dismissedIds.includes(item.id)) return false;
  // Jangan sembunyikan notifikasi pendaftaran baru hanya karena clearedAt bila reviewed_at belum tersedia
  if (
    prefs.clearedAt &&
    (item.category !== "registration" || item.hasReviewedAt) &&
    new Date(item.created_at) <= new Date(prefs.clearedAt)
  ) {
    return false;
  }
  return true;
}

export function isStudentNotificationUnread(
  item: StudentNotification,
  prefs: StudentNotifPrefs
): boolean {
  if (prefs.readIds.includes(item.id)) return false;
  if (
    prefs.lastViewed &&
    (item.category !== "registration" || item.hasReviewedAt) &&
    new Date(item.created_at) <= new Date(prefs.lastViewed)
  ) {
    return false;
  }
  return true;
}

export function computeStudentUnreadCounts(
  items: StudentNotification[],
  prefs: StudentNotifPrefs
): StudentUnreadCounts {
  let articles = 0;
  let registrations = 0;

  for (const item of items) {
    if (!isStudentNotificationVisible(item, prefs)) continue;
    if (!isStudentNotificationUnread(item, prefs)) continue;
    if (item.category === "registration") {
      registrations++;
    } else {
      articles++;
    }
  }

  return { total: articles + registrations, articles, registrations };
}

export function markAllStudentNotifsRead(items: StudentNotification[]) {
  if (typeof window === "undefined") return;
  const nowIso = new Date().toISOString();
  localStorage.setItem(KEY_LAST_VIEWED, nowIso);
  const existingRead = readIdArray(KEY_READ_IDS);
  writeIdArray(
    KEY_READ_IDS,
    [...existingRead, ...items.map((item) => item.id)]
  );
  window.dispatchEvent(new Event(STUDENT_NOTIF_UPDATED_EVENT));
}

export function markStudentNotifRead(id: string) {
  if (typeof window === "undefined") return;
  const existingRead = readIdArray(KEY_READ_IDS);
  if (!existingRead.includes(id)) {
    writeIdArray(KEY_READ_IDS, [...existingRead, id]);
    window.dispatchEvent(new Event(STUDENT_NOTIF_UPDATED_EVENT));
  }
}

export function dismissStudentNotif(id: string) {
  if (typeof window === "undefined") return;
  const existingDismissed = readIdArray(KEY_DISMISSED_IDS);
  const existingRead = readIdArray(KEY_READ_IDS);
  writeIdArray(KEY_DISMISSED_IDS, [...existingDismissed, id]);
  writeIdArray(KEY_READ_IDS, [...existingRead, id]);
  window.dispatchEvent(new Event(STUDENT_NOTIF_UPDATED_EVENT));
}

export function clearAllStudentNotifs(items: StudentNotification[]) {
  if (typeof window === "undefined") return;
  const nowIso = new Date().toISOString();
  localStorage.setItem(KEY_CLEARED_AT, nowIso);
  localStorage.setItem(KEY_LAST_VIEWED, nowIso);
  const ids = items.map((item) => item.id);
  writeIdArray(KEY_DISMISSED_IDS, [...readIdArray(KEY_DISMISSED_IDS), ...ids]);
  writeIdArray(KEY_READ_IDS, [...readIdArray(KEY_READ_IDS), ...ids]);
  window.dispatchEvent(new Event(STUDENT_NOTIF_UPDATED_EVENT));
}

export async function markStudentCategoryReadFromClient(
  supabase: SupabaseClient,
  category: "article" | "registration"
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existingRead = readIdArray(KEY_READ_IDS);
    const idsToAdd: string[] = [];

    if (category === "registration") {
      const { data } = await supabase
        .from("volunteer_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["accepted", "rejected"])
        .limit(30);
      if (Array.isArray(data)) {
        for (const row of data) {
          idsToAdd.push(`reg-${row.id}-${row.status}`);
        }
      }
    } else {
      const { data } = await supabase
        .from("article_audit_log")
        .select("id")
        .eq("author_id", user.id)
        .in("action", [
          "status_published",
          "revision_approved",
          "status_rejected",
          "revision_rejected",
          "status_draft",
        ])
        .limit(30);
      if (Array.isArray(data)) {
        for (const row of data) {
          idsToAdd.push(String(row.id));
        }
      }
    }

    if (idsToAdd.length > 0) {
      writeIdArray(KEY_READ_IDS, [...existingRead, ...idsToAdd]);
      window.dispatchEvent(new Event(STUDENT_NOTIF_UPDATED_EVENT));
    }
  } catch {
    // non-fatal
  }
}

export async function fetchStudentNotificationFeed(
  supabase: SupabaseClient,
  userId: string
): Promise<StudentNotification[]> {
  const [auditRes, articlesRes] = await Promise.all([
    supabase
      .from("article_audit_log")
      .select("id, article_id, article_title, action, note, created_at")
      .eq("author_id", userId)
      .in("action", [
        "status_published",
        "revision_approved",
        "status_rejected",
        "revision_rejected",
        "status_draft",
      ])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("articles").select("id").eq("author_id", userId),
  ]);

  let appsData: Array<{
    id: string;
    agenda_id: string;
    item_name?: string | null;
    status: string;
    created_at: string;
    reviewed_at?: string | null;
  }> = [];

  const primaryAppsRes = await supabase
    .from("volunteer_applications")
    .select("id, agenda_id, item_name, status, created_at, reviewed_at")
    .eq("user_id", userId)
    .in("status", ["accepted", "rejected"])
    .order("created_at", { ascending: false })
    .limit(15);

  if (!primaryAppsRes.error && Array.isArray(primaryAppsRes.data)) {
    appsData = primaryAppsRes.data;
  } else {
    // Fallback jika kolom reviewed_at belum dimigrasi
    const fallbackAppsRes = await supabase
      .from("volunteer_applications")
      .select("id, agenda_id, item_name, status, created_at")
      .eq("user_id", userId)
      .in("status", ["accepted", "rejected"])
      .order("created_at", { ascending: false })
      .limit(15);
    if (!fallbackAppsRes.error && Array.isArray(fallbackAppsRes.data)) {
      appsData = fallbackAppsRes.data;
    }
  }

  let agendaTitleMap = new Map<string, string>();
  if (appsData.length > 0) {
    const agendaIds = Array.from(
      new Set(appsData.map((r) => r.agenda_id).filter(Boolean))
    );
    if (agendaIds.length > 0) {
      const { data: agendasData } = await supabase
        .from("agendas")
        .select("id, title")
        .in("id", agendaIds);
      if (Array.isArray(agendasData)) {
        agendaTitleMap = new Map(agendasData.map((a: any) => [a.id, a.title]));
      }
    }
  }

  const existingArticleIds = new Set(
    (articlesRes.data || []).map((a: any) => a.id)
  );

  const articleList: StudentNotification[] =
    !auditRes.error && Array.isArray(auditRes.data)
      ? auditRes.data
          .filter(
            (item) => item.article_id && existingArticleIds.has(item.article_id)
          )
          .map((item) => ({
            id: String(item.id),
            category: "article" as const,
            article_id: item.article_id,
            article_title: item.article_title || "Artikel Mahasiswa",
            action: item.action,
            note: item.note,
            created_at: item.created_at,
            href: "/dashboard/artikel",
          }))
      : [];

  const regList: StudentNotification[] = appsData.map((row) => ({
    id: `reg-${row.id}-${row.status}`,
    category: "registration" as const,
    article_id: null,
    article_title: agendaTitleMap.get(row.agenda_id) || "Kegiatan BEM",
    action: row.status === "accepted" ? "reg_accepted" : "reg_rejected",
    note: row.item_name || null,
    created_at: row.reviewed_at || row.created_at,
    hasReviewedAt: Boolean(row.reviewed_at),
    href: "/dashboard/kegiatan",
  }));

  return [...articleList, ...regList].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
