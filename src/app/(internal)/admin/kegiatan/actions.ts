"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { AgendaKegiatan } from "@/types/agenda";

export async function getKegiatans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agendas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching kegiatans:", error);
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

export async function saveKegiatan(data: Partial<AgendaKegiatan>) {
  const supabase = await createClient();
  
  if (!data.slug) {
    // Generate slug from title
    data.slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `kegiatan-${Date.now()}`;
  }

  if (data.id) {
    // Update existing
    const { error } = await supabase
      .from("agendas")
      .update({
        title: data.title,
        slug: data.slug,
        type: data.type,
        date: data.date || null,
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
      .eq("id", data.id);

    if (error) throw new Error(error.message);
  } else {
    // Insert new
    const { error } = await supabase
      .from("agendas")
      .insert([{
        title: data.title,
        slug: data.slug,
        type: data.type,
        date: data.date || null,
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
      }]);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/kegiatan");
  revalidatePath("/agenda");
  revalidatePath("/admin/dokumentasi");
  revalidatePath("/publikasi/dokumentasi");
}

export async function deleteKegiatan(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agendas")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/kegiatan");
  revalidatePath("/agenda");
  revalidatePath("/admin/dokumentasi");
  revalidatePath("/publikasi/dokumentasi");
  return data;
}

export async function submitVolunteerApplication(agendaId: string, responses: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_applications")
    .insert([{ agenda_id: agendaId, responses }]);
    
  if (error) throw new Error(error.message);
  return true;
}

export async function getVolunteerApplications(agendaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_applications")
    .select("*")
    .eq("agenda_id", agendaId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
