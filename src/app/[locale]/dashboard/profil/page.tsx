import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfileData } from "@/lib/profile-server";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfileData();

  if (!profile) {
    redirect(`/masuk?next=${encodeURIComponent(`/${locale}/dashboard/profil`)}`);
  }

  return (
    <ProfileSettingsForm
      initialProfile={profile}
      backHref="/dashboard"
      backLabelKey="backToDashboard"
    />
  );
}
