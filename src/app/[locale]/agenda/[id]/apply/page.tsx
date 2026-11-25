import React from "react";
import { notFound } from "next/navigation";
import { getKegiatanById, getVolunteerParticipantCount } from "@/app/(internal)/admin/kegiatan/actions";
import { hasAnyFormQuestions, isDeadlinePassedJakarta } from "@/lib/registration-validation";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";
import ApplyClientForm from "./ApplyClientForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const agenda = await getKegiatanById(id);
  const { getAlternates } = await import("@/utils/seo");
  const hasRegistration = hasAnyFormQuestions(agenda?.form_schema, agenda?.items);

  if (!agenda || (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))) {
    return { title: "Pendaftaran Tidak Ditemukan - BEM STMIK Tazkia" };
  }
  return {
    title: `Daftar ${agenda.title} - BEM STMIK Tazkia`,
    description: `Formulir pendaftaran untuk ${agenda.title}`,
    alternates: getAlternates(`/agenda/${id}/apply`, locale),
  };
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ item?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const preselectedItemId = resolvedSearchParams?.item;

  const agenda = await getKegiatanById(id);
  const hasRegistration = hasAnyFormQuestions(agenda?.form_schema, agenda?.items);

  if (!agenda || (agenda.type !== "volunteer" && !(agenda.type === "event" && hasRegistration))) {
    notFound();
  }

  const items = agenda.items || [];
  const participantCount = await getVolunteerParticipantCount(agenda.id);
  const maxQuota = agenda.max_participants;

  const isQuotaFull =
    items.length > 0
      ? items.every((it) => typeof it.quota === "number" && (it.filled_count || 0) >= it.quota)
      : maxQuota !== null && maxQuota !== undefined && participantCount >= maxQuota;

  const isClosed = isDeadlinePassedJakarta(agenda.deadline);
  const requiresLogin = Boolean(
    typeof agenda.require_login === "boolean"
      ? agenda.require_login
      : agenda.type === "volunteer"
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUser = user
    ? {
        id: user.id,
        email: user.email || "",
        fullName:
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          "",
      }
    : null;

  let existingAppliedItemIds: string[] = [];
  let hasExistingAgendaApplication = false;

  if (user) {
    try {
      const service = getServiceRoleClient();
      const { data: userApps, error: userAppsErr } = await service
        .from("volunteer_applications")
        .select("item_id, status")
        .eq("agenda_id", agenda.id)
        .eq("user_id", user.id);

      if (!userAppsErr && Array.isArray(userApps)) {
        const activeApps = userApps.filter((a: any) => a.status !== "rejected");
        existingAppliedItemIds = activeApps
          .map((a: any) => a.item_id)
          .filter((itemId: unknown): itemId is string => typeof itemId === "string");
        if (items.length === 0 && activeApps.length > 0) {
          hasExistingAgendaApplication = true;
        }
      }
    } catch {
      // Abaikan bila kolom user_id belum dimigrasi
    }
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans">
      <ApplyClientForm
        agenda={agenda}
        isClosed={isClosed}
        isQuotaFull={isQuotaFull}
        preselectedItemId={preselectedItemId}
        requiresLogin={requiresLogin}
        currentUser={currentUser}
        existingAppliedItemIds={existingAppliedItemIds}
        hasExistingAgendaApplication={hasExistingAgendaApplication}
      />
    </div>
  );
}
