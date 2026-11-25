import React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentProfileData } from "@/lib/profile-server";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProfileSettingsModal" });
  return {
    title: `${t("title")} - BEM STMIK Tazkia`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function StandaloneProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getCurrentProfileData();

  if (!profile) {
    redirect(`/masuk?next=${encodeURIComponent(`/${locale}/profil`)}`);
  }

  return (
    <div className="min-h-screen bg-surface-variant/20 pt-24 sm:pt-28 pb-28 lg:pb-16 px-3.5 sm:px-6 lg:px-8 w-full overflow-x-hidden">
      <ProfileSettingsForm
        initialProfile={profile}
        backHref="/"
        backLabelKey="backToHome"
      />
    </div>
  );
}
