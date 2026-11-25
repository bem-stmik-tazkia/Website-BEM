"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin, getServiceRoleClient } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { AgendaKegiatan } from "@/types/agenda";
import { sendDiscordKegiatanNotification } from "@/lib/discord";

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

  return data as AgendaKegiatan[];
}

export async function getKegiatanById(idOrSlug: string) {
  const supabase = await createClient();
  
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
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

  return data as AgendaKegiatan;
}

export async function saveKegiatan(
  data: Partial<AgendaKegiatan>,
  options?: { sendDiscord?: boolean }
) {
  const { supabase } = await requireAdmin();
  
  if (!data.slug) {
    // Generate slug from title
    data.slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `kegiatan-${Date.now()}`;
  }

  let savedKegiatan: AgendaKegiatan | null = null;

  if (data.id) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("agendas")
      .update({
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
        max_participants: data.max_participants !== undefined ? data.max_participants : null
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    savedKegiatan = updated as AgendaKegiatan;
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from("agendas")
      .insert([{
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
        max_participants: data.max_participants !== undefined ? data.max_participants : null
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    savedKegiatan = inserted as AgendaKegiatan;
  }

  let discordResult: { ok: boolean; channel?: string; error?: string } | null = null;
  if (options?.sendDiscord && savedKegiatan?.is_published) {
    try {
      discordResult = await sendDiscordKegiatanNotification({
        ...savedKegiatan,
        hasRegistrationForm:
          Array.isArray(savedKegiatan.form_schema) && savedKegiatan.form_schema.length > 0,
      });
    } catch (discordErr) {
      console.warn("[saveKegiatan] Gagal mengirim notif Discord:", discordErr);
      discordResult = { ok: false, error: "Gagal mengirim notifikasi Discord" };
    }
  }

  revalidatePath("/admin/kegiatan");
  revalidatePath("/admin/dokumentasi");
  revalidatePath("/agenda");
  revalidatePath("/dokumentasi");
  revalidatePath("/publikasi/dokumentasi");
  revalidatePath("/[locale]/agenda", "page");
  revalidatePath("/[locale]/dokumentasi", "page");
  revalidatePath("/[locale]/publikasi/dokumentasi", "page");
  revalidatePath("/", "layout");
  revalidateTag("agenda", "max");

  return { data: savedKegiatan, discord: discordResult };
}

export async function deleteKegiatan(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("agendas")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/kegiatan");
  revalidatePath("/admin/dokumentasi");
  revalidatePath("/agenda");
  revalidatePath("/dokumentasi");
  revalidatePath("/publikasi/dokumentasi");
  revalidatePath("/[locale]/agenda", "page");
  revalidatePath("/[locale]/dokumentasi", "page");
  revalidatePath("/[locale]/publikasi/dokumentasi", "page");
  revalidatePath("/", "layout");
  revalidateTag("agenda", "max");
  
  return data;
}

export async function getVolunteerApplications(agendaId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("volunteer_applications")
    .select("*")
    .eq("agenda_id", agendaId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getVolunteerParticipantCount(agendaId: string): Promise<number> {
  try {
    const supabase = getServiceRoleClient();
    const { count, error } = await supabase
      .from("volunteer_applications")
      .select("*", { count: "exact", head: true })
      .eq("agenda_id", agendaId);

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
      .select("id, agenda_id, responses, created_at")
      .gt("created_at", cutoff)
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
      const prefix = agenda?.type === "volunteer" ? "Pendaftar Oprec" : "RSVP Event";
      const firstTextVal =
        app.responses && typeof app.responses === "object"
          ? Object.values(app.responses).find(
              (v) => typeof v === "string" && v.trim().length > 0 && !v.startsWith("http")
            )
          : null;

      return {
        id: `vol-${app.id}`,
        type: "volunteer" as const,
        title: `${prefix}: ${agenda?.title || "Kegiatan BEM"}`,
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

