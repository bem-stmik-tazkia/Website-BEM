import React from "react";
import { redirect } from "next/navigation";
import { getStudentDashboardData } from "@/lib/student-dashboard";
import StudentCertificatesClient from "@/components/dashboard/StudentCertificatesClient";

export const dynamic = "force-dynamic";

export default async function StudentDashboardSertifikatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user, certificates } = await getStudentDashboardData();

  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(`/${locale}/dashboard/sertifikat`)}`);
  }

  return (
    <StudentCertificatesClient userId={user.id} certificates={certificates} />
  );
}
