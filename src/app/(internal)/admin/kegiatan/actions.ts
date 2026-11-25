"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin, getServiceRoleClient } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { AgendaItemInput, AgendaKegiatan, ApplicationStatus, KegiatanFormInput } from "@/types/agenda";
import { sendDiscordKegiatanNotification } from "@/lib/discord";
import { enrichAgendasWithItemsAndCounts } from "@/lib/agenda-items-server";
import { isOwnRegistrationStorageUrl } from "@/lib/registration-utils";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateAllAgendaPaths(agendaId?: string, slug?: string | null) {
  revalidatePath("/admin/kegiatan");
  revalidatePath("/admin/dokumentasi");
  revalidatePath("/agenda");
  revalidatePath("/dokumentasi");
  revalidatePath("/publikasi/dokumentasi");
  revalidatePath("/[locale]/agenda", "page");
  revalidatePath("/[locale]/dokumentasi", "page");
  revalidatePath("/[locale]/publikasi/dokumentasi", "page");
  if (agendaId) {
    revalidatePath(`/[locale]/agenda/${agendaId}`, "page");
    revalidatePath(`/[locale]/agenda/${agendaId}/apply`, "page");
    revalidatePath(`/admin/kegiatan/${agendaId}/pendaftar`);
  }
  if (slug) {
    revalidatePath(`/[locale]/agenda/${slug}`, "page");
    revalidatePath(`/[locale]/agenda/${slug}/apply`, "page");
  }
  revalidatePath("/", "layout");
  revalidateTag("agenda", "max");
}

export async function getKegiatans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agendas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching kegiatans:", error.message || error, JSON.stringify(error));
    return [];
  }

  return enrichAgendasWithItemsAndCounts((data || []) as AgendaKegiatan[]);
}

export async function getKegiatanById(idOrSlug: string) {
  const supabase = await createClient();

  const isUuid = UUID_REGEX.test(idOrSlug);

  let query = supabase.from("agendas").select("*");
  if (isUuid) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching kegiatan by id/slug:", error);
    return null;
  }

  if (!data) return null;
  const [enriched] = await enrichAgendasWithItemsAndCounts([data as AgendaKegiatan]);
  return enriched;
}

async function syncAgendaItems(
  agendaId: string,
  incomingItems: AgendaItemInput[]
) {
  const service = getServiceRoleClient();

  const normalized = incomingItems
    .map((item, idx) => ({
      id: item.id && UUID_REGEX.test(item.id) ? item.id : undefined,
      name: (item.name || "").trim(),
      description: item.description?.trim() || null,
      quota:
        typeof item.quota === "number" && Number.isFinite(item.quota) && item.quota > 0
          ? Math.floor(item.quota)
          : null,
      participant_type: item.participant_type === "tim" ? "tim" : "individu",
      rulebook_url: item.rulebook_url?.trim() || null,
      sort_order: idx,
    }))
    .filter((item) => item.name.length > 0);

  const { data: existingRows, error: fetchErr } = await service
    .from("agenda_items")
    .select("id")
    .eq("agenda_id", agendaId);

  if (fetchErr) {
    // Jika tabel belum dibuat di DB, lewati secara elegan hanya bila memang tidak ada items baru
    if (normalized.length === 0) return;
    throw new Error(
      `Gagal membaca sub-item kegiatan (pastikan migrasi SQL sudah dijalankan): ${fetchErr.message}`
    );
  }

  const existingIds = new Set((existingRows || []).map((r: { id: string }) => r.id));
  const keepIds = new Set(
    normalized.map((i) => i.id).filter((id): id is string => Boolean(id && existingIds.has(id)))
  );

  // Hapus item yang sudah dihapus oleh admin di form
  const toDelete = Array.from(existingIds).filter((id) => !keepIds.has(id));
  if (toDelete.length > 0) {
    const { error: delErr } = await service
      .from("agenda_items")
      .delete()
      .eq("agenda_id", agendaId)
      .in("id", toDelete);
    if (delErr) throw new Error(delErr.message);
  }

  // Update item yang sudah ada
  for (const item of normalized) {
    if (item.id && existingIds.has(item.id)) {
      const { error: updErr } = await service
        .from("agenda_items")
        .update({
          name: item.name,
          description: item.description,
          quota: item.quota,
          participant_type: item.participant_type,
          rulebook_url: item.rulebook_url,
          sort_order: item.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("agenda_id", agendaId);
      if (updErr) throw new Error(updErr.message);
    }
  }

  // Insert item baru
  const toInsert = normalized
    .filter((item) => !item.id || !existingIds.has(item.id))
    .map((item) => ({
      agenda_id: agendaId,
      name: item.name,
      description: item.description,
      quota: item.quota,
      participant_type: item.participant_type,
      rulebook_url: item.rulebook_url,
      sort_order: item.sort_order,
    }));

  if (toInsert.length > 0) {
    const { error: insErr } = await service.from("agenda_items").insert(toInsert);
    if (insErr) throw new Error(insErr.message);
  }
}

export async function saveKegiatan(
  data: KegiatanFormInput,
  options?: { sendDiscord?: boolean }
) {
  const { supabase } = await requireAdmin();

  if (!data.slug) {
    data.slug =
      data.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `kegiatan-${Date.now()}`;
  }

  const validItems = Array.isArray(data.items)
    ? data.items.filter((i) => (i.name || "").trim().length > 0)
    : [];
  const hasSubItems = validItems.length > 0;

  const payload = {
    title: data.title,
    slug: data.slug,
    type: data.type,
    date: data.date || null,
    end_date: data.end_date || null,
    location: data.location || null,
    image_url: data.image_url,
    registration_link: data.registration_link,
    description: data.description,
    category: data.category,
    time_range: data.time_range,
    deadline: data.deadline || null,
    is_urgent: data.is_urgent,
    is_published: data.is_published,
    gallery: data.gallery || [],
    video_url: data.video_url || null,
    online_link: data.online_link || null,
    form_schema: data.form_schema || [],
    speakers: data.speakers || [],
    max_participants: hasSubItems
      ? null
      : data.max_participants !== undefined
      ? data.max_participants
      : null,
    allow_multiple_items:
      data.type === "volunteer"
        ? false
        : data.allow_multiple_items !== undefined
        ? Boolean(data.allow_multiple_items)
        : true,
  };

  let savedKegiatan: AgendaKegiatan | null = null;

  if (data.id) {
    const { data: updated, error } = await supabase
      .from("agendas")
      .update(payload)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    savedKegiatan = updated as AgendaKegiatan;
  } else {
    const { data: inserted, error } = await supabase
      .from("agendas")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    savedKegiatan = inserted as AgendaKegiatan;
  }

  if (savedKegiatan?.id && Array.isArray(data.items)) {
    const isRegistrationEnabled =
      savedKegiatan.type === "volunteer" ||
      (savedKegiatan.type === "event" &&
        Array.isArray(savedKegiatan.form_schema) &&
        savedKegiatan.form_schema.length > 0);
    await syncAgendaItems(
      savedKegiatan.id,
      isRegistrationEnabled ? validItems : []
    );
  }

  const [enrichedSaved] = savedKegiatan
    ? await enrichAgendasWithItemsAndCounts([savedKegiatan])
    : [null];

  let discordResult: { ok: boolean; channel?: string; error?: string } | null = null;
  if (options?.sendDiscord && enrichedSaved?.is_published) {
    try {
      discordResult = await sendDiscordKegiatanNotification({
        ...enrichedSaved,
        hasRegistrationForm:
          Array.isArray(enrichedSaved.form_schema) &&
          enrichedSaved.form_schema.length > 0,
      });
    } catch (discordErr) {
      console.warn("[saveKegiatan] Gagal mengirim notif Discord:", discordErr);
      discordResult = { ok: false, error: "Gagal mengirim notifikasi Discord" };
    }
  }

  revalidateAllAgendaPaths(enrichedSaved?.id, enrichedSaved?.slug);

  return { data: enrichedSaved, discord: discordResult };
}

export async function deleteKegiatan(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("agendas").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidateAllAgendaPaths(id);

  return data;
}

export async function getVolunteerApplications(agendaId: string) {
  await requireAdmin();
  const service = getServiceRoleClient();
  const { data, error } = await service
    .from("volunteer_applications")
    .select("*")
    .eq("agenda_id", agendaId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getVolunteerParticipantCount(agendaId: string): Promise<number> {
  try {
    const supabase = getServiceRoleClient();
    const { count, error } = await supabase
      .from("volunteer_applications")
      .select("*", { count: "exact", head: true })
      .eq("agenda_id", agendaId)
      .or("status.is.null,status.eq.accepted");

    if (error) {
      console.error("Error fetching volunteer participant count:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("Error in getVolunteerParticipantCount:", err);
    return 0;
  }
}

export async function updateVolunteerApplicationStatus(
  applicationId: string,
  agendaId: string,
  status: ApplicationStatus
) {
  await requireAdmin();
  const service = getServiceRoleClient();

  const { data: appRow, error: fetchErr } = await service
    .from("volunteer_applications")
    .select("id, agenda_id")
    .eq("id", applicationId)
    .eq("agenda_id", agendaId)
    .maybeSingle();

  if (fetchErr || !appRow) {
    throw new Error("Data pendaftar tidak ditemukan.");
  }

  const { error: rpcErr } = await service.rpc("set_volunteer_application_status", {
    p_application_id: applicationId,
    p_status: status,
  });

  if (rpcErr) {
    const msg = rpcErr.message || "";
    if (msg.includes("QUOTA_FULL:")) {
      const target = msg.split("QUOTA_FULL:")[1]?.trim() || "posisi ini";
      throw new Error(
        `Kuota untuk "${target}" sudah penuh. Tambah kuota atau tolak pendaftar lain terlebih dahulu.`
      );
    }
    throw new Error(msg || "Gagal memperbarui status pendaftar.");
  }

  revalidateAllAgendaPaths(agendaId);
  return { ok: true, status };
}

export async function deleteVolunteerApplication(
  applicationId: string,
  agendaId: string
) {
  await requireAdmin();
  const service = getServiceRoleClient();

  const { data: appRow, error: fetchErr } = await service
    .from("volunteer_applications")
    .select("id, agenda_id, responses")
    .eq("id", applicationId)
    .eq("agenda_id", agendaId)
    .maybeSingle();

  if (fetchErr || !appRow) {
    throw new Error("Data pendaftar tidak ditemukan.");
  }

  const { error: delErr } = await service
    .from("volunteer_applications")
    .delete()
    .eq("id", applicationId)
    .eq("agenda_id", agendaId);

  if (delErr) {
    throw new Error(delErr.message);
  }

  // Bersihkan foto pendaftaran di Supabase Storage jika tidak dipakai baris pendaftaran lain
  try {
    const responsesObj =
      appRow.responses && typeof appRow.responses === "object"
        ? (appRow.responses as Record<string, unknown>)
        : {};
    const storageUrls = Object.values(responsesObj).filter(
      (val): val is string =>
        typeof val === "string" && isOwnRegistrationStorageUrl(val)
    );

    for (const url of storageUrls) {
      const parsed = new URL(url);
      const marker = "/storage/v1/object/public/public_images/";
      const storagePath = parsed.pathname.includes(marker)
        ? decodeURIComponent(parsed.pathname.split(marker)[1] || "")
        : "";
      if (!storagePath) continue;

      const { count } = await service
        .from("volunteer_applications")
        .select("id", { count: "exact", head: true })
        .eq("agenda_id", agendaId)
        .filter("responses::text", "ilike", `%${storagePath}%`);

      if ((count ?? 0) === 0) {
        await service.storage.from("public_images").remove([storagePath]);
      }
    }
  } catch (cleanupErr) {
    console.warn("[deleteVolunteerApplication] Storage cleanup skipped:", cleanupErr);
  }

  revalidateAllAgendaPaths(agendaId);
  return { ok: true };
}

export interface AdminVolunteerBellNotif {
  id: string;
  type: "volunteer";
  title: string;
  author: string;
  created_at: string;
  href: string;
}

export async function fetchRecentVolunteerApplicationsForBell(
  sinceIso?: string
): Promise<AdminVolunteerBellNotif[]> {
  try {
    await requireAdmin();
    const service = getServiceRoleClient();
    const cutoff =
      sinceIso || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: apps, error } = await service
      .from("volunteer_applications")
      .select("id, agenda_id, item_name, status, responses, created_at")
      .gt("created_at", cutoff)
      .or("status.is.null,status.eq.accepted")
      .order("created_at", { ascending: false })
      .limit(15);

    if (error || !apps || apps.length === 0) {
      return [];
    }

    const agendaIds = Array.from(new Set(apps.map((a: any) => a.agenda_id).filter(Boolean)));
    const { data: agendas } = await service
      .from("agendas")
      .select("id, title, type")
      .in("id", agendaIds);

    const agendaMap = new Map((agendas || []).map((ag: any) => [ag.id, ag]));

    return apps.map((app: any) => {
      const agenda = agendaMap.get(app.agenda_id);
      const prefix = agenda?.type === "volunteer" ? "Pendaftar Oprec" : "Pendaftar Event";
      const itemSuffix = app.item_name ? ` (${app.item_name})` : "";
      const firstTextVal =
        app.responses && typeof app.responses === "object"
          ? Object.values(app.responses).find(
              (v) => typeof v === "string" && v.trim().length > 0 && !v.startsWith("http")
            )
          : null;

      return {
        id: `vol-${app.id}`,
        type: "volunteer" as const,
        title: `${prefix}: ${agenda?.title || "Kegiatan BEM"}${itemSuffix}`,
        author: typeof firstTextVal === "string" ? firstTextVal : "Mahasiswa",
        created_at: app.created_at,
        href: `/admin/kegiatan/${app.agenda_id}/pendaftar`,
      };
    });
  } catch (err) {
    console.warn("[actions:fetchRecentVolunteerApplicationsForBell] Error:", err);
    return [];
  }
}
