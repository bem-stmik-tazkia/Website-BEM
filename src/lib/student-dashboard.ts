import "server-only";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";
import type { ApplicationStatus } from "@/types/agenda";

export interface StudentRegistrationRecord {
  id: string;
  agenda_id: string;
  item_id: string | null;
  item_name: string | null;
  status: ApplicationStatus;
  applicant_email: string | null;
  created_at: string;
  agenda: {
    id: string;
    slug: string | null;
    title: string;
    type: "event" | "volunteer" | "dokumentasi";
    date: string | null;
    end_date: string | null;
    time_range: string | null;
    location: string | null;
    image_url: string | null;
    category: string | null;
    deadline: string | null;
  } | null;
}

export interface StudentArticleSummary {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

export interface StudentDashboardUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export async function getStudentDashboardData(): Promise<{
  user: StudentDashboardUser | null;
  registrations: StudentRegistrationRecord[];
  articles: StudentArticleSummary[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, registrations: [], articles: [] };
  }

  let profileRole = "mahasiswa";
  let profileFullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Mahasiswa";
  let profileAvatar: string | null =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      if (profile.full_name) profileFullName = profile.full_name;
      if (profile.avatar_url) profileAvatar = profile.avatar_url;
      if (profile.role) profileRole = profile.role;
    }
  } catch {
    // Gunakan fallback metadata auth
  }

  let registrations: StudentRegistrationRecord[] = [];
  let articles: StudentArticleSummary[] = [];

  try {
    const service = getServiceRoleClient();

    const [appsRes, articlesRes] = await Promise.all([
      service
        .from("volunteer_applications")
        .select("id, agenda_id, item_id, item_name, status, applicant_email, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("my_articles")
        .select("id, title, status, created_at, updated_at")
        .order("created_at", { ascending: false }),
    ]);

    if (!articlesRes.error && Array.isArray(articlesRes.data)) {
      articles = articlesRes.data as StudentArticleSummary[];
    }

    if (!appsRes.error && Array.isArray(appsRes.data) && appsRes.data.length > 0) {
      const agendaIds = Array.from(
        new Set(appsRes.data.map((r: any) => r.agenda_id).filter(Boolean))
      );

      let agendaMap = new Map<string, StudentRegistrationRecord["agenda"]>();
      if (agendaIds.length > 0) {
        const { data: agendasData } = await service
          .from("agendas")
          .select("id, slug, title, type, date, end_date, time_range, location, image_url, category, deadline")
          .in("id", agendaIds);
        if (Array.isArray(agendasData)) {
          agendaMap = new Map(agendasData.map((ag: any) => [ag.id, ag]));
        }
      }

      registrations = appsRes.data.map((row: any) => ({
        id: row.id,
        agenda_id: row.agenda_id,
        item_id: row.item_id || null,
        item_name: row.item_name || null,
        status:
          row.status === "rejected"
            ? "rejected"
            : row.status === "pending"
              ? "pending"
              : "accepted",
        applicant_email: row.applicant_email || null,
        created_at: row.created_at,
        agenda: agendaMap.get(row.agenda_id) || null,
      }));
    }
  } catch (err) {
    console.warn("[student-dashboard] Error loading dashboard data:", err);
  }

  return {
    user: {
      id: user.id,
      email: user.email || "",
      fullName: profileFullName,
      avatarUrl: profileAvatar,
      role: profileRole,
    },
    registrations,
    articles,
  };
}
