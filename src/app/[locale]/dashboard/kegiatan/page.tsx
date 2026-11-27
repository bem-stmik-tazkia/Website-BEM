import React from "react";
import { redirect } from "next/navigation";
import { getStudentDashboardData } from "@/lib/student-dashboard";
import StudentRegistrationsClient from "@/components/dashboard/StudentRegistrationsClient";

export const dynamic = "force-dynamic";

export default async function StudentDashboardKegiatanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user, registrations, certificates } = await getStudentDashboardData();

  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(`/${locale}/dashboard/kegiatan`)}`);
  }

  return (
    <StudentRegistrationsClient
      userId={user.id}
      registrations={registrations}
      certificates={certificates}
    />
  );
}
